/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBoxHMRClient+Internal.h"

#if RCT_DEV_MENU

@implementation RCTRedBoxHMRClient {
  NSURL *_bundleURL;
  NSURLSessionWebSocketTask *_webSocketTask;
  NSURLSession *_session;
  void (^_onFileChange)(void);
  BOOL _stopped;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL onFileChange:(void (^)(void))onFileChange
{
  if (self = [super init]) {
    _bundleURL = bundleURL;
    _onFileChange = [onFileChange copy];
  }
  return self;
}

- (void)start
{
  if (![_bundleURL.scheme hasPrefix:@"http"]) {
    return;
  }

  NSURLComponents *components = [[NSURLComponents alloc] initWithURL:_bundleURL resolvingAgainstBaseURL:NO];
  components.scheme = [_bundleURL.scheme isEqualToString:@"https"] ? @"wss" : @"ws";
  components.path = @"/hot";
  components.query = nil;
  components.fragment = nil;
  NSURL *wsURL = components.URL;
  if (!wsURL) {
    return;
  }

  _session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]
                                           delegate:self
                                      delegateQueue:nil];
  _webSocketTask = [_session webSocketTaskWithURL:wsURL];
  [_webSocketTask resume];
}

- (void)stop
{
  _stopped = YES;
  _onFileChange = nil;
  [_webSocketTask cancel];
  _webSocketTask = nil;
  [_session invalidateAndCancel];
  _session = nil;
}

- (void)URLSession:(__unused NSURLSession *)session
          webSocketTask:(__unused NSURLSessionWebSocketTask *)webSocketTask
    didOpenWithProtocol:(__unused NSString *)protocol
{
  NSDictionary *registration = @{
    @"type" : @"register-entrypoints",
    @"entryPoints" : @[ _bundleURL.absoluteString ],
  };
  NSData *json = [NSJSONSerialization dataWithJSONObject:registration options:0 error:nil];
  NSURLSessionWebSocketMessage *msg = [[NSURLSessionWebSocketMessage alloc]
      initWithString:[[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding]];
  [_webSocketTask sendMessage:msg
            completionHandler:^(__unused NSError *error){
            }];
  [self _listenForNextMessage];
}

- (void)_listenForNextMessage
{
  if (_stopped) {
    return;
  }
  __weak __typeof(self) weakSelf = self;
  [_webSocketTask receiveMessageWithCompletionHandler:^(NSURLSessionWebSocketMessage *message, NSError *error) {
    if (error || !message) {
      return;
    }
    [weakSelf _handleMessage:message];
    [weakSelf _listenForNextMessage];
  }];
}

- (void)_handleMessage:(NSURLSessionWebSocketMessage *)message
{
  if (message.type != NSURLSessionWebSocketMessageTypeString || _stopped) {
    return;
  }
  NSData *data = [message.string dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  if ([json[@"type"] isEqualToString:@"update-start"]) {
    // Ignore the initial update that fires when the client first registers.
    // Only react to subsequent file changes.
    NSDictionary *body = json[@"body"];
    if ([body isKindOfClass:[NSDictionary class]] && [body[@"isInitialUpdate"] boolValue]) {
      return;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self->_onFileChange) {
        self->_onFileChange();
      }
    });
  }
}

- (void)URLSession:(__unused NSURLSession *)session
       webSocketTask:(__unused NSURLSessionWebSocketTask *)task
    didCloseWithCode:(__unused NSURLSessionWebSocketCloseCode)closeCode
              reason:(__unused NSData *)reason
{
}

@end

#endif
