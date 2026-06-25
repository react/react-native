/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <mutex>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTAssert.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTNetworkTask.h>
#import <React/RCTUtils.h>

#import <React/RCTHTTPRequestHandler.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import "RCTInspectorNetworkReporter.h"
#import "RCTNetworkPlugins.h"
#import "RCTNetworking+Internal.h"
#import "RCTNetworking.h"

typedef RCTURLRequestCancellationBlock (^RCTHTTPQueryResult)(NSError *error, NSDictionary<NSString *, id> *result);

NSString *const RCTNetworkingPHUploadHackScheme = @"ph-upload";

@interface RCTNetworking () <NativeNetworkingIOSSpec>

- (RCTURLRequestCancellationBlock)processDataForHTTPQuery:(NSDictionary<NSString *, id> *)data
                                        devToolsRequestId:(NSString *)devToolsRequestId
                                                 callback:(RCTHTTPQueryResult)callback;
@end

/**
 * Helper to convert FormData payloads into multipart/formdata requests.
 */
@interface RCTHTTPFormDataHelper : NSObject

@property (nonatomic, weak) RCTNetworking *networker;

@end

@implementation RCTHTTPFormDataHelper {
  NSMutableArray<NSDictionary<NSString *, id> *> *_parts;
  NSMutableData *_multipartBody;
  RCTHTTPQueryResult _callback;
  NSString *_boundary;
}

static NSString *RCTGenerateFormBoundary()
{
  const size_t boundaryLength = 70;
  const char *boundaryChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.";

  char *bytes = (char *)malloc(boundaryLength);
  if (!bytes) {
    // CWE - 391 : Unchecked error condition
    // https://www.cvedetails.com/cwe-details/391/Unchecked-Error-Condition.html
    // https://eli.thegreenplace.net/2009/10/30/handling-out-of-memory-conditions-in-c
    abort();
  }
  size_t charCount = strlen(boundaryChars);
  for (int i = 0; i < boundaryLength; i++) {
    bytes[i] = boundaryChars[arc4random_uniform((u_int32_t)charCount)];
  }
  return [[NSString alloc] initWithBytesNoCopy:bytes
                                        length:boundaryLength
                                      encoding:NSUTF8StringEncoding
                                  freeWhenDone:YES];
}

- (RCTURLRequestCancellationBlock)process:(NSArray<NSDictionary *> *)formData
                        devToolsRequestId:(NSString *)devToolsRequestId
                                 callback:(RCTHTTPQueryResult)callback
{
  RCTAssertThread(_networker.methodQueue, @"process: must be called on request queue");

  if (formData.count == 0) {
    return callback(nil, nil);
  }

  _parts = [formData mutableCopy];
  _callback = callback;
  _multipartBody = [NSMutableData new];
  _boundary = RCTGenerateFormBoundary();

  for (NSUInteger i = 0; i < _parts.count; i++) {
    NSString *uri = _parts[i][@"uri"];
    if (uri && [[uri substringToIndex:@"ph:".length] caseInsensitiveCompare:@"ph:"] == NSOrderedSame) {
      uri = [RCTNetworkingPHUploadHackScheme stringByAppendingString:[uri substringFromIndex:@"ph".length]];
      NSMutableDictionary *mutableDict = [_parts[i] mutableCopy];
      mutableDict[@"uri"] = uri;
      _parts[i] = mutableDict;
    }
  }

  return [_networker processDataForHTTPQuery:_parts[0]
                           devToolsRequestId:devToolsRequestId
                                    callback:^(NSError *error, NSDictionary<NSString *, id> *result) {
                                      return [self handleResult:result error:error devToolsRequestId:devToolsRequestId];
                                    }];
}

- (RCTURLRequestCancellationBlock)handleResult:(NSDictionary<NSString *, id> *)result
                                         error:(NSError *)error
                             devToolsRequestId:(NSString *)devToolsRequestId
{
  RCTAssertThread(_networker.methodQueue, @"handleResult: must be called on request queue");

  if (error) {
    return _callback(error, nil);
  }

  // Start with boundary.
  [_multipartBody
      appendData:[[NSString stringWithFormat:@"--%@\r\n", _boundary] dataUsingEncoding:NSUTF8StringEncoding]];

  // Print headers.
  NSMutableDictionary<NSString *, NSString *> *headers = [_parts[0][@"headers"] mutableCopy];
  NSString *partContentType = result[@"contentType"];
  if (partContentType != nil && ![partContentType isEqual:[NSNull null]]) {
    headers[@"content-type"] = partContentType;
  }
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *parameterKey, NSString *parameterValue, BOOL *stop) {
    [self->_multipartBody appendData:[[NSString stringWithFormat:@"%@: %@\r\n", parameterKey, parameterValue]
                                         dataUsingEncoding:NSUTF8StringEncoding]];
  }];

  // Add the body.
  [_multipartBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  [_multipartBody appendData:result[@"body"]];
  [_multipartBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];

  [_parts removeObjectAtIndex:0];
  if (_parts.count) {
    return [_networker processDataForHTTPQuery:_parts[0]
                             devToolsRequestId:devToolsRequestId
                                      callback:^(NSError *err, NSDictionary<NSString *, id> *res) {
                                        return [self handleResult:res error:err devToolsRequestId:devToolsRequestId];
                                      }];
  }

  // We've processed the last item. Finish and return.
  [_multipartBody
      appendData:[[NSString stringWithFormat:@"--%@--\r\n", _boundary] dataUsingEncoding:NSUTF8StringEncoding]];
  NSString *contentType = [NSString stringWithFormat:@"multipart/form-data; boundary=%@", _boundary];
  return _callback(nil, @{@"body" : _multipartBody, @"contentType" : contentType});
}

@end

/**
 * Bridge module that provides the JS interface to the network stack.
 */
@implementation RCTNetworking {
  NSMutableDictionary<NSNumber *, RCTNetworkTask *> *_tasksByRequestID;
  std::mutex _handlersLock;
  NSArray<id<RCTURLRequestHandler>> *_handlers;
  NSArray<id<RCTURLRequestHandler>> * (^_handlersProvider)(RCTModuleRegistry *);
  NSMutableArray<id<RCTNetworkingRequestHandler>> *_requestHandlers;
  NSMutableArray<id<RCTNetworkingResponseHandler>> *_responseHandlers;
  NSMutableArray<id<RCTNetworkingTextResponseHandler>> *_textResponseHandlers;
}

@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  return [super initWithDisabledObservation];
}

- (instancetype)initWithHandlersProvider:
    (NSArray<id<RCTURLRequestHandler>> * (^)(RCTModuleRegistry *moduleRegistry))getHandlers
{
  if (self = [self init]) {
    _handlersProvider = getHandlers;
  }
  return self;
}

- (void)invalidate
{
  [super invalidate];

  std::lock_guard<std::mutex> lock(_handlersLock);

  for (NSNumber *requestID in _tasksByRequestID) {
    [_tasksByRequestID[requestID] cancel];
  }
  [_tasksByRequestID removeAllObjects];
  for (id<RCTURLRequestHandler> handler in _handlers) {
    if ([handler conformsToProtocol:@protocol(RCTInvalidating)]) {
      [(id<RCTInvalidating>)handler invalidate];
    }
  }
  _handlers = nil;
  _requestHandlers = nil;
  _responseHandlers = nil;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"didCompleteNetworkResponse",
    @"didReceiveNetworkResponse",
    @"didSendNetworkData",
    @"didReceiveNetworkIncrementalData",
    @"didReceiveNetworkDataProgress",
    @"didReceiveNetworkData"
  ];
}

- (id<RCTURLRequestHandler>)handlerForRequest:(NSURLRequest *)request
{
  if (!request.URL) {
    return nil;
  }
  NSArray<id<RCTURLRequestHandler>> *handlers = [self prioritizedHandlers];

  if (RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<RCTURLRequestHandler> previousHandler = nil;
    for (id<RCTURLRequestHandler> handler in handlers) {
      float priority = [handler respondsToSelector:@selector(handlerPriority)] ? [handler handlerPriority] : 0;
      if (previousHandler && priority < previousPriority) {
        return previousHandler;
      }
      if ([handler canHandleRequest:request]) {
        if (previousHandler) {
          if (priority == previousPriority) {
            RCTLogError(
                @"The RCTURLRequestHandlers %@ and %@ both reported that"
                 " they can handle the request %@, and have equal priority"
                 " (%g). This could result in non-deterministic behavior.",
                handler,
                previousHandler,
                request,
                priority);
          }
        } else {
          previousHandler = handler;
          previousPriority = priority;
        }
      }
    }
    return previousHandler;
  }

  // Normal code path
  for (id<RCTURLRequestHandler> handler in handlers) {
    if ([handler canHandleRequest:request]) {
      return handler;
    }
  }
  return nil;
}

- (NSArray<id<RCTURLRequestHandler>> *)prioritizedHandlers
{
  std::lock_guard<std::mutex> lock(_handlersLock);
  if (_handlers) {
    return _handlers;
  }

  NSArray<id<RCTURLRequestHandler>> *newHandlers = _handlersProvider
      ? _handlersProvider(self.moduleRegistry)
      : [self.bridge modulesConformingToProtocol:@protocol(RCTURLRequestHandler)];

  // Get handlers, sorted in reverse priority order (highest priority first)
  newHandlers = [newHandlers
      sortedArrayUsingComparator:^NSComparisonResult(id<RCTURLRequestHandler> a, id<RCTURLRequestHandler> b) {
        float priorityA = [a respondsToSelector:@selector(handlerPriority)] ? [a handlerPriority] : 0;
        float priorityB = [b respondsToSelector:@selector(handlerPriority)] ? [b handlerPriority] : 0;
        if (priorityA > priorityB) {
          return NSOrderedAscending;
        } else if (priorityA < priorityB) {
          return NSOrderedDescending;
        } else {
          return NSOrderedSame;
        }
      }];

  _handlers = newHandlers;
  return newHandlers;
}

- (NSDictionary<NSString *, id> *)stripNullsInRequestHeaders:(NSDictionary<NSString *, id> *)headers
{
  NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:headers.count];
  for (NSString *key in headers.allKeys) {
    id val = headers[key];
    if (val != [NSNull null]) {
      result[key] = val;
    }
  }

  return result;
}

- (RCTURLRequestCancellationBlock)buildRequest:(NSDictionary<NSString *, id> *)query
                             devToolsRequestId:(NSString *)devToolsRequestId
                               completionBlock:(void (^)(NSURLRequest *request))block
{
  RCTAssertThread(_methodQueue, @"buildRequest: must be called on request queue");

  NSURL *URL = [RCTConvert NSURL:query[@"url"]]; // this is marked as nullable in JS, but should not be null
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  request.HTTPMethod = [RCTConvert NSString:RCTNilIfNull(query[@"method"])].uppercaseString ?: @"GET";
  request.HTTPShouldHandleCookies = [RCTConvert BOOL:query[@"withCredentials"]];

  if (request.HTTPShouldHandleCookies) {
    // Load and set the cookie header.
    NSArray<NSHTTPCookie *> *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:URL];
    request.allHTTPHeaderFields = [NSHTTPCookie requestHeaderFieldsWithCookies:cookies];
  }

  // Set supplied headers.
  NSDictionary *headers = [RCTConvert NSDictionary:query[@"headers"]];
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
    if (value) {
      [request addValue:[RCTConvert NSString:value] forHTTPHeaderField:key];
    }
  }];

  request.timeoutInterval = [RCTConvert NSTimeInterval:query[@"timeout"]];
  NSDictionary<NSString *, id> *data = [RCTConvert NSDictionary:RCTNilIfNull(query[@"data"])];
  NSString *trackingName = data[@"trackingName"];
  if (trackingName) {
    [NSURLProtocol setProperty:trackingName forKey:@"trackingName" inRequest:request];
  }
  return [self processDataForHTTPQuery:data
                     devToolsRequestId:devToolsRequestId
                              callback:^(NSError *error, NSDictionary<NSString *, id> *result) {
                                if (error) {
                                  RCTLogError(@"Error processing request body: %@", error);
                                  // Ideally we'd circle back to JS here and notify an error/abort on the request.
                                  return (RCTURLRequestCancellationBlock)nil;
                                }
                                request.HTTPBody = result[@"body"];
                                NSString *dataContentType = result[@"contentType"];
                                NSString *requestContentType = [request valueForHTTPHeaderField:@"Content-Type"];
                                BOOL isMultipart = ![dataContentType isEqual:[NSNull null]] &&
                                    [dataContentType hasPrefix:@"multipart"];

                                // For multipart requests we need to override caller-specified content type with one
                                // from the data object, because it contains the boundary string
                                if (dataContentType && ([requestContentType length] == 0 || isMultipart)) {
                                  [request setValue:dataContentType forHTTPHeaderField:@"Content-Type"];
                                }

                                // Gzip the request body
                                if ([request.allHTTPHeaderFields[@"Content-Encoding"] isEqualToString:@"gzip"]) {
                                  request.HTTPBody = RCTGzipData(request.HTTPBody, -1 /* default */);
                                  [request setValue:(@(request.HTTPBody.length)).description
                                      forHTTPHeaderField:@"Content-Length"];
                                }

                                // NSRequest default cache policy violate on `If-None-Match`, should allow the request
                                // to get 304 from server.
                                if (request.allHTTPHeaderFields[@"If-None-Match"]) {
                                  request.cachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
                                }

                                dispatch_async(self->_methodQueue, ^{
                                  block(request);
                                });

                                return (RCTURLRequestCancellationBlock)nil;
                              }];
}

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [self handlerForRequest:request] != nil;
}

/**
 * Process the 'data' part of an HTTP query.
 *
 * 'data' can be a JSON value of the following forms:
 *
 * - {"string": "..."}: a simple JS string that will be UTF-8 encoded and sent as the body
 *
 * - {"uri": "some-uri://..."}: reference to a system resource, e.g. an image in the asset library
 *
 * - {"formData": [...]}: list of data payloads that will be combined into a multipart/form-data request
 *
 * - {"blob": {...}}: an object representing a blob
 *
 * If successful, the callback be called with a result dictionary containing the following (optional) keys:
 *
 * - @"body" (NSData): the body of the request
 *
 * - @"contentType" (NSString): the content type header of the request
 *
 */
- (RCTURLRequestCancellationBlock)
    processDataForHTTPQuery:(nullable NSDictionary<NSString *, id> *)query
          devToolsRequestId:(NSString *)devToolsRequestId
                   callback:(RCTURLRequestCancellationBlock (^)(NSError *error, NSDictionary<NSString *, id> *result))
                                callback
{
  RCTAssertThread(_methodQueue, @"processDataForHTTPQuery: must be called on request queue");

  if (!query) {
    return callback(nil, nil);
  }
  for (id<RCTNetworkingRequestHandler> handler in _requestHandlers) {
    if ([handler canHandleNetworkingRequest:query]) {
      // @lint-ignore FBOBJCUNTYPEDCOLLECTION1
      NSDictionary *body = [handler handleNetworkingRequest:query];
      if (body) {
        return callback(nil, body);
      }
    }
  }
  NSData *body = [RCTConvert NSData:query[@"string"]];
  if (body) {
    return callback(nil, @{@"body" : body});
  }
  NSString *base64String = [RCTConvert NSString:query[@"base64"]];
  if (base64String) {
    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
    return callback(nil, @{@"body" : data});
  }
  NSURLRequest *request = [RCTConvert NSURLRequest:query[@"uri"]];
  if (request) {
    __block RCTURLRequestCancellationBlock cancellationBlock = nil;
    RCTNetworkTask *task = [self
        networkTaskWithDevToolsRequestId:devToolsRequestId
                                 request:request
                         completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
                           dispatch_async(self->_methodQueue, ^{
                             cancellationBlock = callback(
                                 error,
                                 data ? @{@"body" : data, @"contentType" : RCTNullIfNil(response.MIMEType)} : nil);
                           });
                         }];

    [task start];

    __weak RCTNetworkTask *weakTask = task;
    return ^{
      [weakTask cancel];
      if (facebook::react::ReactNativeFeatureFlags::enableNetworkEventReporting()) {
        [RCTInspectorNetworkReporter reportRequestFailed:devToolsRequestId cancelled:YES];
      }
      if (cancellationBlock) {
        cancellationBlock();
      }
    };
  }
  NSArray<NSDictionary *> *formData = [RCTConvert NSDictionaryArray:query[@"formData"]];
  if (formData) {
    RCTHTTPFormDataHelper *formDataHelper = [RCTHTTPFormDataHelper new];
    formDataHelper.networker = self;
    return [formDataHelper process:formData devToolsRequestId:devToolsRequestId callback:callback];
  }
  // Nothing in the data payload, at least nothing we could understand anyway.
  // Ignore and treat it as if it were null.
  return callback(nil, nil);
}

+ (NSString *)decodeTextData:(NSData *)data
                fromResponse:(NSURLResponse *)response
               withCarryData:(NSMutableData *)inputCarryData
{
  NSStringEncoding encoding = NSUTF8StringEncoding;
  if (response.textEncodingName) {
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
    encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
  }

  NSMutableData *currentCarryData = inputCarryData ?: [NSMutableData new];
  [currentCarryData appendData:data];

  // Attempt to decode text
  NSString *encodedResponse = [[NSString alloc] initWithData:currentCarryData encoding:encoding];

  if (!encodedResponse && data.length > 0) {
    if (encoding == NSUTF8StringEncoding && inputCarryData) {
      // If decode failed, we attempt to trim broken character bytes from the data.
      // At this time, only UTF-8 support is enabled. Multibyte encodings, such as UTF-16 and UTF-32, require a lot of
      // additional work to determine wether BOM was included in the first data packet. If so, save it, and attach it to
      // each new data packet. If not, an encoding has to be selected with a suitable byte order (for ARM iOS, it would
      // be little endianness).

      CFStringEncoding cfEncoding = CFStringConvertNSStringEncodingToEncoding(encoding);
      // Taking a single unichar is not good enough, due to Unicode combining character sequences or characters outside
      // the BMP. See https://www.objc.io/issues/9-strings/unicode/#common-pitfalls We'll attempt with a sequence of two
      // characters, the most common combining character sequence and characters outside the BMP (emojis).
      CFIndex maxCharLength = CFStringGetMaximumSizeForEncoding(2, cfEncoding);

      NSUInteger removedBytes = 1;

      while (removedBytes < maxCharLength) {
        encodedResponse = [[NSString alloc]
            initWithData:[currentCarryData subdataWithRange:NSMakeRange(0, currentCarryData.length - removedBytes)]
                encoding:encoding];

        if (encodedResponse != nil) {
          break;
        }

        removedBytes += 1;
      }
    } else {
      // We don't have an encoding, or the encoding is incorrect, so now we try to guess
      [NSString stringEncodingForData:data
                      encodingOptions:@{NSStringEncodingDetectionSuggestedEncodingsKey : @[ @(encoding) ]}
                      convertedString:&encodedResponse
                  usedLossyConversion:NULL];
    }
  }

  if (inputCarryData) {
    NSUInteger encodedResponseLength = [encodedResponse dataUsingEncoding:encoding].length;

    // Ensure a valid subrange exists within currentCarryData
    if (currentCarryData.length >= encodedResponseLength) {
      NSData *newCarryData = [currentCarryData
          subdataWithRange:NSMakeRange(encodedResponseLength, currentCarryData.length - encodedResponseLength)];
      [inputCarryData setData:newCarryData];
    } else {
      [inputCarryData setLength:0];
    }
  }

  return encodedResponse;
}

- (void)sendData:(NSData *)data
    responseType:(NSString *)responseType
        response:(NSURLResponse *)response
         forTask:(RCTNetworkTask *)task
{
  RCTAssertThread(_methodQueue, @"sendData: must be called on request queue");

  id responseData = nil;
  for (id<RCTNetworkingResponseHandler> handler in _responseHandlers) {
    if ([handler canHandleNetworkingResponse:responseType]) {
      responseData = [handler handleNetworkingResponse:response data:data];
      break;
    }
  }

  if (!responseData) {
    if (data.length == 0) {
      return;
    }

    if ([responseType isEqualToString:@"text"]) {
      // No carry storage is required here because the entire data has been loaded.
      responseData = [RCTNetworking decodeTextData:data fromResponse:task.response withCarryData:nil];
      if (!responseData) {
        RCTLogWarn(@"Received data was not a string, or was not a recognised encoding.");
        return;
      }
    } else if ([responseType isEqualToString:@"base64"]) {
      responseData = [data base64EncodedStringWithOptions:0];
    } else {
      RCTLogWarn(@"Invalid responseType: %@", responseType);
      return;
    }
  }

  if (facebook::react::ReactNativeFeatureFlags::enableNetworkEventReporting()) {
    id responseDataForPreview;
    if ([responseType isEqualToString:@"blob"]) {
      responseDataForPreview = data;
    } else if ([responseData isKindOfClass:[NSString class]]) {
      responseDataForPreview = responseData;
    }
    bool base64Encoded = [responseType isEqualToString:@"base64"] || [responseType isEqualToString:@"blob"];

    [RCTInspectorNetworkReporter maybeStoreResponseBody:task.devToolsRequestId
                                                   data:responseDataForPreview
                                          base64Encoded:base64Encoded];
  }

  [self sendEventWithName:@"didReceiveNetworkData" body:@[ task.requestID, responseData ]];
}

- (void)sendRequest:(NSURLRequest *)request
          responseType:(NSString *)responseType
    incrementalUpdates:(BOOL)incrementalUpdates
        responseSender:(RCTResponseSenderBlock)responseSender
     devToolsRequestId:(NSString *)devToolsRequestId
{
  RCTAssertThread(_methodQueue, @"sendRequest: must be called on request queue");
  __weak __typeof(self) weakSelf = self;
  __block RCTNetworkTask *task;
  RCTURLRequestProgressBlock uploadProgressBlock = ^(int64_t progress, int64_t total) {
    NSArray *responseJSON = @[ task.requestID, @((double)progress), @((double)total) ];
    [weakSelf sendEventWithName:@"didSendNetworkData" body:responseJSON];
  };

  RCTURLRequestResponseBlock responseBlock = ^(NSURLResponse *response) {
    NSDictionary<NSString *, NSString *> *headers;
    NSInteger status;
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      headers = httpResponse.allHeaderFields ?: @{};
      status = httpResponse.statusCode;
    } else {
      // Other HTTP-like request
      headers = response.MIMEType ? @{@"Content-Type" : response.MIMEType} : @{};
      status = 200;
    }
    id responseURL = response.URL ? response.URL.absoluteString : [NSNull null];
    NSArray<id> *responseJSON = @[ task.requestID, @(status), headers, responseURL ];

    if (facebook::react::ReactNativeFeatureFlags::enableNetworkEventReporting()) {
      [RCTInspectorNetworkReporter reportResponseStart:task.devToolsRequestId
                                              response:response
                                            statusCode:status
                                               headers:headers];
    }
    [weakSelf sendEventWithName:@"didReceiveNetworkResponse" body:responseJSON];
  };

  // XHR does not allow you to peek at xhr.response before the response is
  // finished. Only when xhr.responseType is set to ''/'text', consumers may
  // peek at xhr.responseText. So unless the requested responseType is 'text',
  // we only send progress updates and not incremental data updates to JS here.
  RCTURLRequestIncrementalDataBlock incrementalDataBlock = nil;
  RCTURLRequestProgressBlock downloadProgressBlock = nil;
  if (incrementalUpdates) {
    if ([responseType isEqualToString:@"text"]) {
      // We need this to carry over bytes, which could not be decoded into text (such as broken UTF-8 characters).
      // The incremental data block holds the ownership of this object, and will be released upon release of the block.
      NSMutableData *incrementalDataCarry = [NSMutableData new];

      incrementalDataBlock = ^(NSData *data, int64_t progress, int64_t total) {
        NSUInteger initialCarryLength = incrementalDataCarry.length;

        id responseString = [RCTNetworking decodeTextData:data
                                             fromResponse:task.response
                                            withCarryData:incrementalDataCarry];
        if (!responseString) {
          RCTLogWarn(@"Received data was not a string, or was not a recognised encoding.");
          return;
        }

        // Update progress to include the previous carry length and reduce the current carry length.
        NSArray<id> *responseJSON = @[
          task.requestID,
          responseString,
          @(progress + initialCarryLength - incrementalDataCarry.length),
          @(total)
        ];

        if (facebook::react::ReactNativeFeatureFlags::enableNetworkEventReporting()) {
          [RCTInspectorNetworkReporter reportDataReceived:task.devToolsRequestId data:data];
          [RCTInspectorNetworkReporter maybeStoreResponseBodyIncremental:task.devToolsRequestId data:responseString];
        }
        [weakSelf sendEventWithName:@"didReceiveNetworkIncrementalData" body:responseJSON];
      };
    } else {
      downloadProgressBlock = ^(int64_t progress, int64_t total) {
        NSArray<id> *responseJSON = @[ task.requestID, @(progress), @(total) ];
        [weakSelf sendEventWithName:@"didReceiveNetworkDataProgress" body:responseJSON];
      };
    }
  }

  RCTURLRequestCompletionBlock completionBlock = ^(NSURLResponse *response, NSData *data, NSError *error) {
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    // Unless we were sending incremental (text) chunks to JS, all along, now
    // is the time to send the request body to JS.
    if (!(incrementalUpdates && [responseType isEqualToString:@"text"])) {
      [strongSelf sendData:data responseType:responseType response:response forTask:task];
    }

    if ([responseType isEqualToString:@"text"]) {
      for (id<RCTNetworkingTextResponseHandler> handler in strongSelf->_textResponseHandlers) {
        if ([handler canHandleNetworkingTextResponseForRequest:task.request]) {
          NSString *responseString = [RCTNetworking decodeTextData:data
                                                      fromResponse:task.response
                                                     withCarryData:[NSMutableData new]];
          [handler handleNetworkingResponseText:responseString request:task.request];
        }
      }
    }

    NSArray *responseJSON =
        @[ task.requestID, RCTNullIfNil(error.localizedDescription), error.code == kCFURLErrorTimedOut ? @YES : @NO ];

    if (facebook::react::ReactNativeFeatureFlags::enableNetworkEventReporting()) {
      if (error != nullptr) {
        [RCTInspectorNetworkReporter reportRequestFailed:task.devToolsRequestId cancelled:NO];
      } else {
        [RCTInspectorNetworkReporter reportResponseEnd:task.devToolsRequestId encodedDataLength:data.length];
      }
    }
    [strongSelf sendEventWithName:@"didCompleteNetworkResponse" body:responseJSON];
    [strongSelf->_tasksByRequestID removeObjectForKey:task.requestID];
  };

  task = [self networkTaskWithDevToolsRequestId:devToolsRequestId request:request completionBlock:completionBlock];
  task.downloadProgressBlock = downloadProgressBlock;
  task.incrementalDataBlock = incrementalDataBlock;
  task.responseBlock = responseBlock;
  task.uploadProgressBlock = uploadProgressBlock;

  if (task.requestID) {
    if (!_tasksByRequestID) {
      _tasksByRequestID = [NSMutableDictionary new];
    }
    _tasksByRequestID[task.requestID] = task;
    responseSender(@[ task.requestID ]);
    if (facebook::react::ReactNativeFeatureFlags::enableNetworkEventReporting()) {
      [RCTInspectorNetworkReporter reportRequestStart:task.devToolsRequestId
                                              request:request
                                    encodedDataLength:task.response.expectedContentLength];
      [RCTInspectorNetworkReporter reportConnectionTiming:task.devToolsRequestId request:task.request];
    }
  }

  [task start];
}

#pragma mark - Public API

- (void)addRequestHandler:(id<RCTNetworkingRequestHandler>)handler
{
  if (!_requestHandlers) {
    _requestHandlers = [NSMutableArray new];
  }
  [_requestHandlers addObject:handler];
}

- (void)addResponseHandler:(id<RCTNetworkingResponseHandler>)handler
{
  if (!_responseHandlers) {
    _responseHandlers = [NSMutableArray new];
  }
  [_responseHandlers addObject:handler];
}

- (void)addTextResponseHandler:(id<RCTNetworkingTextResponseHandler>)handler
{
  if (!_textResponseHandlers) {
    _textResponseHandlers = [NSMutableArray new];
  }
  [_textResponseHandlers addObject:handler];
}

- (void)removeRequestHandler:(id<RCTNetworkingRequestHandler>)handler
{
  [_requestHandlers removeObject:handler];
}

- (void)removeResponseHandler:(id<RCTNetworkingResponseHandler>)handler
{
  [_responseHandlers removeObject:handler];
}

- (RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                           completionBlock:(RCTURLRequestCompletionBlock)completionBlock
{
  return [self networkTaskWithDevToolsRequestId:nil request:request completionBlock:completionBlock];
}

- (RCTNetworkTask *)networkTaskWithDevToolsRequestId:(NSString *)devToolsRequestId
                                             request:(NSURLRequest *)request
                                     completionBlock:(RCTURLRequestCompletionBlock)completionBlock
{
  id<RCTURLRequestHandler> handler = [self handlerForRequest:request];
  if (!handler) {
    RCTLogError(@"No suitable URL request handler found for %@", request.URL);
    return nil;
  }

  RCTNetworkTask *task = [[RCTNetworkTask alloc] initWithDevToolsRequestId:devToolsRequestId
                                                                   request:request
                                                                   handler:handler
                                                             callbackQueue:_methodQueue];
  task.completionBlock = completionBlock;
  return task;
}

#pragma mark - JS API

RCT_EXPORT_METHOD(
    sendRequest : (JS::NativeNetworkingIOS::SpecSendRequestQuery &)query callback : (RCTResponseSenderBlock)
        responseSender)
{
  NSString *method = query.method();
  NSString *url = query.url();
  id<NSObject> data = query.data();
  id<NSObject> headers = query.headers();
  NSString *queryResponseType = query.responseType();
  bool queryIncrementalUpdates = query.incrementalUpdates();
  double timeout = query.timeout();
  bool withCredentials = query.withCredentials();
  NSString *devToolsRequestId = query.unstable_devToolsRequestId();

  dispatch_async(_methodQueue, ^{
    NSDictionary *queryDict = @{
      @"method" : method,
      @"url" : url,
      @"data" : data,
      @"headers" : headers,
      @"responseType" : queryResponseType,
      @"incrementalUpdates" : @(queryIncrementalUpdates),
      @"timeout" : @(timeout),
      @"withCredentials" : @(withCredentials),
    };

    // TODO: buildRequest returns a cancellation block, but there's currently
    // no way to invoke it, if, for example the request is cancelled while
    // loading a large file to build the request body
    [self buildRequest:queryDict
        devToolsRequestId:devToolsRequestId
          completionBlock:^(NSURLRequest *request) {
            NSString *responseType = [RCTConvert NSString:queryDict[@"responseType"]];
            BOOL incrementalUpdates = [RCTConvert BOOL:queryDict[@"incrementalUpdates"]];
            [self sendRequest:request
                      responseType:responseType
                incrementalUpdates:incrementalUpdates
                    responseSender:responseSender
                 devToolsRequestId:devToolsRequestId];
          }];
  });
}

RCT_EXPORT_METHOD(abortRequest : (double)requestID)
{
  dispatch_async(_methodQueue, ^{
    [self->_tasksByRequestID[[NSNumber numberWithDouble:requestID]] cancel];
    [self->_tasksByRequestID removeObjectForKey:[NSNumber numberWithDouble:requestID]];
  });
}

RCT_EXPORT_METHOD(clearCookies : (RCTResponseSenderBlock)responseSender)
{
  dispatch_async(_methodQueue, ^{
    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
    if (!storage.cookies.count) {
      responseSender(@[ @NO ]);
      return;
    }

    for (NSHTTPCookie *cookie in storage.cookies) {
      [storage deleteCookie:cookie];
    }
    responseSender(@[ @YES ]);
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeNetworkingIOSSpecJSI>(params);
}

@end

@implementation RCTBridge (RCTNetworking)

- (RCTNetworking *)networking
{
  return [self moduleForClass:[RCTNetworking class]];
}

@end

@implementation RCTBridgeProxy (RCTNetworking)

- (RCTNetworking *)networking
{
  return [self moduleForClass:[RCTNetworking class]];
}

@end

Class RCTNetworkingCls(void)
{
  return RCTNetworking.class;
}
