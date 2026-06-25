/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTHTTPRequestHandler.h>

#import <mutex>

#import <React/RCTNetworking.h>
#import <ReactCommon/RCTTurboModule.h>

#import "RCTNetworkPlugins.h"

@interface RCTHTTPRequestHandler () <NSURLSessionDataDelegate, RCTTurboModule>

@end

static NSURLSessionConfigurationProvider urlSessionConfigurationProvider;

void RCTSetCustomNSURLSessionConfigurationProvider(NSURLSessionConfigurationProvider provider)
{
  urlSessionConfigurationProvider = provider;
}

static RCTHTTPRequestInterceptor httpRequestInterceptor;

void RCTSetCustomHTTPRequestInterceptor(RCTHTTPRequestInterceptor interceptor)
{
  httpRequestInterceptor = interceptor;
}

@implementation RCTHTTPRequestHandler {
  NSMapTable *_delegates;
  NSURLSession *_session;
  std::mutex _mutex;
}

@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

- (void)invalidate
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_session invalidateAndCancel];
  self->_session = nil;
}

// Needs to lock before call this method.
- (BOOL)isValid
{
  // if session == nil and delegates != nil, we've been invalidated
  return (_session != nullptr) || (_delegates == nullptr);
}

#pragma mark - NSURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  static NSSet<NSString *> *schemes = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // technically, RCTHTTPRequestHandler can handle file:// as well,
    // but it's less efficient than using RCTFileRequestHandler
    schemes = [[NSSet alloc] initWithObjects:@"http", @"https", nil];
  });
  return [schemes containsObject:request.URL.scheme.lowercaseString];
}

- (NSURLSessionDataTask *)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  std::lock_guard<std::mutex> lock(_mutex);
  // Lazy setup
  if ((_session == nullptr) && [self isValid]) {
    // You can override default NSURLSession instance property allowsCellularAccess (default value YES)
    //  by providing the following key to your RN project (edit ios/project/Info.plist file in Xcode):
    // <key>ReactNetworkForceWifiOnly</key>    <true/>
    // This will set allowsCellularAccess to NO and force Wifi only for all network calls on iOS
    // If you do not want to override default behavior, do nothing or set key with value false
    NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
    NSNumber *useWifiOnly = [infoDictionary objectForKey:@"ReactNetworkForceWifiOnly"];

    NSOperationQueue *callbackQueue = [NSOperationQueue new];
    callbackQueue.maxConcurrentOperationCount = 1;
    callbackQueue.underlyingQueue = [[_moduleRegistry moduleForName:"Networking"] methodQueue];
    NSURLSessionConfiguration *configuration;
    if (urlSessionConfigurationProvider != nullptr) {
      configuration = urlSessionConfigurationProvider();
    } else {
      configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
      // Set allowsCellularAccess to NO ONLY if key ReactNetworkForceWifiOnly exists AND its value is YES
      if (useWifiOnly != nullptr) {
        configuration.allowsCellularAccess = ![useWifiOnly boolValue];
      }
      [configuration setHTTPShouldSetCookies:YES];
      [configuration setHTTPCookieAcceptPolicy:NSHTTPCookieAcceptPolicyAlways];
      [configuration setHTTPCookieStorage:[NSHTTPCookieStorage sharedHTTPCookieStorage]];
    }
    assert(configuration != nil);
    _session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:callbackQueue];

    _delegates = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                           valueOptions:NSPointerFunctionsStrongMemory
                                               capacity:0];
  }
  NSURLRequest *finalRequest = request;
  if (httpRequestInterceptor != nullptr) {
    NSURLRequest *intercepted = httpRequestInterceptor(request);
    if (intercepted != nil) {
      finalRequest = intercepted;
    }
  }
  NSURLSessionDataTask *task = [_session dataTaskWithRequest:finalRequest];
  [_delegates setObject:delegate forKey:task];
  [task resume];
  return task;
}

- (void)cancelRequest:(NSURLSessionDataTask *)task
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    [_delegates removeObjectForKey:task];
  }
  [task cancel];
}

#pragma mark - NSURLSession delegate

- (void)URLSession:(NSURLSession *)session
                        task:(NSURLSessionTask *)task
             didSendBodyData:(int64_t)bytesSent
              totalBytesSent:(int64_t)totalBytesSent
    totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
  id<RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didSendDataWithProgress:totalBytesSent];
}

- (void)URLSession:(NSURLSession *)session
                          task:(NSURLSessionTask *)task
    willPerformHTTPRedirection:(NSHTTPURLResponse *)response
                    newRequest:(NSURLRequest *)request
             completionHandler:(void (^)(NSURLRequest *))completionHandler
{
  // Reset the cookies on redirect.
  // This is necessary because we're not letting iOS handle cookies by itself
  NSMutableURLRequest *nextRequest = [request mutableCopy];

  NSArray<NSHTTPCookie *> *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:request.URL];
  nextRequest.allHTTPHeaderFields = [NSHTTPCookie requestHeaderFieldsWithCookies:cookies];
  completionHandler(nextRequest);
}

- (void)URLSession:(NSURLSession *)session
              dataTask:(NSURLSessionDataTask *)task
    didReceiveResponse:(NSURLResponse *)response
     completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
{
  id<RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didReceiveResponse:response];
  completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)task didReceiveData:(NSData *)data
{
  id<RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didReceiveData:data];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  id<RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
    [_delegates removeObjectForKey:task];
  }
  [delegate URLRequest:task didCompleteWithError:error];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class RCTHTTPRequestHandlerCls(void)
{
  return RCTHTTPRequestHandler.class;
}
