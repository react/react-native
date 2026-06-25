/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorNetworkHelper.h"
#import <React/RCTDevSupportHttpHeaders.h>
#import <React/RCTLog.h>

using ListenerBlock = void (^)(RCTInspectorNetworkListener *);

@interface RCTInspectorNetworkHelper () <NSURLSessionDataDelegate>
@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, void (^)(ListenerBlock)> *executorsByTaskId;
- (void)withListenerForTask:(NSURLSessionTask *)task execute:(ListenerBlock)block;
@end

@implementation RCTInspectorNetworkHelper

- (instancetype)init
{
  self = [super init];
  if (self != nullptr) {
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    self.session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
    self.executorsByTaskId = [NSMutableDictionary new];
  }
  return self;
}

- (void)loadNetworkResourceWithParams:(const RCTInspectorLoadNetworkResourceRequest &)params
                             executor:(RCTInspectorNetworkExecutor)executor
{
  NSString *urlString = [NSString stringWithCString:params.url.c_str() encoding:NSUTF8StringEncoding];
  NSURL *url = [NSURL URLWithString:urlString];
  auto executorBlock = ^(ListenerBlock func) {
    executor([=](RCTInspectorNetworkListener &listener) { func(&listener); });
  };

  if (url == nil) {
    executorBlock(^(RCTInspectorNetworkListener *listener) {
      listener->onError([NSString stringWithFormat:@"Not a valid URL: %@", urlString].UTF8String);
    });
    return;
  }

  NSMutableURLRequest *urlRequest = [NSMutableURLRequest requestWithURL:url];
  [urlRequest setHTTPMethod:@"GET"];
  [[RCTDevSupportHttpHeaders sharedInstance] applyHeadersToRequest:urlRequest];
  NSURLSessionDataTask *dataTask = [self.session dataTaskWithRequest:urlRequest];
  __weak NSURLSessionDataTask *weakDataTask = dataTask;

  executorBlock(^(RCTInspectorNetworkListener *listener) {
    listener->setCancelFunction([weakDataTask]() { [weakDataTask cancel]; });
  });

  // Store the executor as a block per task.
  self.executorsByTaskId[@(dataTask.taskIdentifier)] = executorBlock;

  [dataTask resume];
}

- (void)withListenerForTask:(NSURLSessionTask *)task execute:(ListenerBlock)block
{
  void (^executor)(ListenerBlock) = self.executorsByTaskId[@(task.taskIdentifier)];
  if (executor != nullptr) {
    executor(block);
  }
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session
              dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveResponse:(NSURLResponse *)response
     completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))completionHandler
{
  auto callbackWithHeadersOrError = (^(RCTInspectorNetworkListener *listener) {
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      std::map<std::string, std::string> headersMap;
      for (NSString *key in httpResponse.allHeaderFields) {
        headersMap[[key UTF8String]] = [[httpResponse.allHeaderFields objectForKey:key] UTF8String];
      }
      completionHandler(NSURLSessionResponseAllow);
      listener->onHeaders(httpResponse.statusCode, headersMap);
    } else {
      listener->onError("Unsupported response type");
      completionHandler(NSURLSessionResponseCancel);
    }
  });
  [self withListenerForTask:dataTask execute:callbackWithHeadersOrError];
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
  auto callbackWithData = ^(RCTInspectorNetworkListener *listener) {
    listener->onData(std::string_view(static_cast<const char *>(data.bytes), data.length));
  };
  [self withListenerForTask:dataTask execute:callbackWithData];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  auto callbackWithCompletionOrError = ^(RCTInspectorNetworkListener *listener) {
    if (error != nil) {
      listener->onError(error.localizedDescription.UTF8String);
    } else {
      listener->onCompletion();
    }
  };
  [self withListenerForTask:task execute:callbackWithCompletionOrError];
}

@end
