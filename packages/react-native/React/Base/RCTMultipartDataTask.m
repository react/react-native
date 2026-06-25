/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMultipartDataTask.h"

static RCTMultipartDataTaskRequestInterceptor multipartRequestInterceptor;

void RCTSetCustomMultipartDataTaskRequestInterceptor(RCTMultipartDataTaskRequestInterceptor interceptor)
{
  multipartRequestInterceptor = interceptor;
}

@interface RCTMultipartDataTask () <NSURLSessionDataDelegate, NSURLSessionDataDelegate>

@end

@implementation RCTMultipartDataTask {
  NSURL *_url;
  RCTMultipartDataTaskCallback _partHandler;
  RCTMultipartProgressCallback _progressHandler;
  NSInteger _statusCode;
  NSDictionary *_headers;
  NSString *_boundary;
  NSMutableData *_data;
}

- (instancetype)initWithURL:(NSURL *)url
                partHandler:(RCTMultipartDataTaskCallback)partHandler
            progressHandler:(RCTMultipartProgressCallback)progressHandler
{
  if (self = [super init]) {
    _url = url;
    _partHandler = [partHandler copy];
    _progressHandler = [progressHandler copy];
  }
  return self;
}

- (void)startTask
{
  NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]
                                                        delegate:self
                                                   delegateQueue:nil];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:_url];
  [request addValue:@"multipart/mixed" forHTTPHeaderField:@"Accept"];
  NSURLRequest *finalRequest = request;
  if (multipartRequestInterceptor != nil) {
    NSURLRequest *intercepted = multipartRequestInterceptor(request);
    if (intercepted != nil) {
      finalRequest = intercepted;
    }
  }
  NSLog(@"[RCTMultipartDataTask] %@ %@", finalRequest.HTTPMethod ?: @"GET", finalRequest.URL.absoluteString);
  NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:finalRequest];
  [dataTask resume];
  [session finishTasksAndInvalidate];
}

- (void)URLSession:(__unused NSURLSession *)session
              dataTask:(__unused NSURLSessionDataTask *)dataTask
    didReceiveResponse:(NSURLResponse *)response
     completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))completionHandler
{
  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    _headers = [httpResponse allHeaderFields];
    _statusCode = [httpResponse statusCode];

    NSString *contentType = @"";
    for (NSString *key in [_headers keyEnumerator]) {
      if ([[key lowercaseString] isEqualToString:@"content-type"]) {
        contentType = [_headers valueForKey:key];
        break;
      }
    }

    NSRegularExpression *regex =
        [NSRegularExpression regularExpressionWithPattern:@"multipart/mixed;.*boundary=\"([^\"]+)\""
                                                  options:0
                                                    error:nil];
    NSTextCheckingResult *match = [regex firstMatchInString:contentType
                                                    options:0
                                                      range:NSMakeRange(0, contentType.length)];
    if (match) {
      _boundary = [contentType substringWithRange:[match rangeAtIndex:1]];
      completionHandler(NSURLSessionResponseBecomeStream);
      return;
    }
  }

  // In case the server doesn't support multipart/mixed responses, fallback to normal download
  _data = [[NSMutableData alloc] initWithCapacity:1024 * 1024];
  completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(__unused NSURLSession *)session
                    task:(__unused NSURLSessionTask *)task
    didCompleteWithError:(NSError *)error
{
  if (_partHandler) {
    _partHandler(_statusCode, _headers, _data, error, YES);
  }
}

- (void)URLSession:(__unused NSURLSession *)session
          dataTask:(__unused NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data
{
  [_data appendData:data];
}

- (void)URLSession:(__unused NSURLSession *)session
               dataTask:(__unused NSURLSessionDataTask *)dataTask
    didBecomeStreamTask:(NSURLSessionStreamTask *)streamTask
{
  [streamTask captureStreams];
}

- (void)URLSession:(__unused NSURLSession *)session
              streamTask:(__unused NSURLSessionStreamTask *)streamTask
    didBecomeInputStream:(NSInputStream *)inputStream
            outputStream:(__unused NSOutputStream *)outputStream
{
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream
                                                                                  boundary:_boundary];
  RCTMultipartDataTaskCallback partHandler = _partHandler;
  _partHandler = nil;
  NSInteger statusCode = _statusCode;

  BOOL completed = [reader
      readAllPartsWithCompletionCallback:^(NSDictionary *headers, NSData *content, BOOL done) {
        partHandler(statusCode, headers, content, nil, done);
      }
                        progressCallback:_progressHandler];
  if (!completed) {
    partHandler(
        statusCode, nil, nil, [NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorCancelled userInfo:nil], YES);
  }
}

@end
