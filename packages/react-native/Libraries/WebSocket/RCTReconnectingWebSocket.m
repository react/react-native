/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTReconnectingWebSocket.h>

#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTDevSupportHttpHeaders.h>

#import <SocketRocket/SRWebSocket.h>

#if RCT_DEV // Only supported in dev mode

@interface RCTReconnectingWebSocket () <SRWebSocketDelegate>
@end

@implementation RCTReconnectingWebSocket {
  NSURL *_url;
  SRWebSocket *_socket;
  BOOL _stopped;
}

- (instancetype)initWithURL:(NSURL *)url queue:(dispatch_queue_t)queue
{
  if (self = [super init]) {
    _url = url;
    _delegateDispatchQueue = queue;
  }
  return self;
}

- (instancetype)initWithURL:(NSURL *)url
{
  return [self initWithURL:url queue:dispatch_get_main_queue()];
}

- (void)send:(id)data
{
  [_socket sendData:data error:nil];
}

- (void)start
{
  [self stop];
  _stopped = NO;
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:_url];
  [[RCTDevSupportHttpHeaders sharedInstance] applyHeadersToRequest:request];
  _socket = [[SRWebSocket alloc] initWithURLRequest:request];
  _socket.delegate = self;
  [_socket setDelegateDispatchQueue:_delegateDispatchQueue];
  [_socket open];
}

- (void)stop
{
  _stopped = YES;
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message
{
  [_delegate reconnectingWebSocket:self didReceiveMessage:message];
}

- (void)reconnect
{
  if (_stopped) {
    return;
  }

  __weak SRWebSocket *socket = _socket;
  __weak __typeof(self) weakSelf = self;

  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [weakSelf start];
    if (!socket) {
      [weakSelf reconnect];
    }
  });
}

- (void)webSocketDidOpen:(SRWebSocket *)webSocket
{
  [_delegate reconnectingWebSocketDidOpen:self];
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [_delegate reconnectingWebSocketDidClose:self];
  if ([error code] != ECONNREFUSED) {
    [self reconnect];
  }
}

- (void)webSocket:(SRWebSocket *)webSocket
    didCloseWithCode:(NSInteger)code
              reason:(NSString *)reason
            wasClean:(BOOL)wasClean
{
  [_delegate reconnectingWebSocketDidClose:self];
  [self reconnect];
}

@end

#endif
