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

static const NSTimeInterval RCTReconnectInitialDelay = 2.0;
static const NSTimeInterval RCTReconnectMaxDelay = 120.0;

@interface RCTReconnectingWebSocket () <SRWebSocketDelegate>
@end

@implementation RCTReconnectingWebSocket {
  NSURL *_url;
  SRWebSocket *_socket;
  BOOL _stopped;
  BOOL _reconnectPending;
  NSTimeInterval _reconnectDelay;
  uint64_t _reconnectToken;
}

- (instancetype)initWithURL:(NSURL *)url queue:(dispatch_queue_t)queue
{
  if (self = [super init]) {
    _url = url;
    _delegateDispatchQueue = queue;
    _reconnectDelay = RCTReconnectInitialDelay;
  }
  return self;
}

- (instancetype)initWithURL:(NSURL *)url
{
  return [self initWithURL:url queue:dispatch_get_main_queue()];
}

- (void)send:(id)data
{
  SRWebSocket *socket;
  @synchronized (self) {
    socket = _socket;
  }
  [socket sendData:data error:nil];
}

- (void)connect
{
  SRWebSocket *socketToClose = nil;
  NSMutableURLRequest *request = nil;
  SRWebSocket *socket = nil;

  @synchronized (self) {
    if (_stopped) {
      return;
    }
    _reconnectPending = NO;

    socketToClose = _socket;
    _socket.delegate = nil;
    _socket = nil;

    request = [NSMutableURLRequest requestWithURL:_url];
    [[RCTDevSupportHttpHeaders sharedInstance] applyHeadersToRequest:request];
    socket = [[SRWebSocket alloc] initWithURLRequest:request];
    socket.delegate = self;
    [socket setDelegateDispatchQueue:_delegateDispatchQueue];
    _socket = socket;
  }

  [socketToClose closeWithCode:1000 reason:@"Invalidated"];
  [socket open];
}

- (void)start
{
  @synchronized (self) {
    _stopped = NO;
    _reconnectPending = NO;
    _reconnectToken++;
    _reconnectDelay = RCTReconnectInitialDelay;
  }
  [self connect];
}

- (void)stop
{
  SRWebSocket *socketToClose = nil;
  @synchronized (self) {
    _stopped = YES;
    _reconnectPending = NO;
    _reconnectToken++;
    _reconnectDelay = RCTReconnectInitialDelay;
    socketToClose = _socket;
    _socket.delegate = nil;
    _socket = nil;
  }
  [socketToClose closeWithCode:1000 reason:@"Invalidated"];
}

- (void)reconnect
{
  NSTimeInterval delay;
  uint64_t token;
  @synchronized (self) {
    if (_stopped || _reconnectPending) {
      return;
    }
    _reconnectPending = YES;
    token = ++_reconnectToken;
    delay = _reconnectDelay;
    _reconnectDelay = MIN(_reconnectDelay * 2, RCTReconnectMaxDelay);
  }

  __weak __typeof(self) weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    @synchronized (strongSelf) {
      if (strongSelf->_stopped || strongSelf->_reconnectToken != token) {
        return;
      }
    }
    [strongSelf connect];
  });
}

- (void)webSocketDidOpen:(SRWebSocket *)webSocket
{
  @synchronized (self) {
    if (webSocket != _socket) {
      return;
    }
    _reconnectDelay = RCTReconnectInitialDelay;
  }
  [_delegate reconnectingWebSocketDidOpen:self];
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message
{
  @synchronized (self) {
    if (webSocket != _socket) {
      return;
    }
  }
  [_delegate reconnectingWebSocket:self didReceiveMessage:message];
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  @synchronized (self) {
    if (webSocket != _socket) {
      return;
    }
  }
  [_delegate reconnectingWebSocketDidClose:self];
  [self reconnect];
}

- (void)webSocket:(SRWebSocket *)webSocket
    didCloseWithCode:(NSInteger)code
              reason:(NSString *)reason
            wasClean:(BOOL)wasClean
{
  @synchronized (self) {
    if (webSocket != _socket) {
      return;
    }
  }
  [_delegate reconnectingWebSocketDidClose:self];
  [self reconnect];
}

@end

#endif
