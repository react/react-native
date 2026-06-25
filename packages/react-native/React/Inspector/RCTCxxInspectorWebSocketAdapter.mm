/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCxxInspectorWebSocketAdapter.h"

#if RCT_DEV || RCT_REMOTE_PROFILE

#import <React/RCTAssert.h>
#import <React/RCTDevSupportHttpHeaders.h>
#import <React/RCTInspector.h>
#import <React/RCTInspectorPackagerConnection.h>
#import <React/RCTUtils.h>
#import <SocketRocket/SRWebSocket.h>
#import <jsinspector-modern/InspectorPackagerConnection.h>
#import <memory>

using namespace facebook::react::jsinspector_modern;

namespace {
NSString *NSStringFromUTF8StringView(std::string_view view)
{
  NSString *result = [[NSString alloc] initWithBytes:(const char *)view.data()
                                              length:view.size()
                                            encoding:NSUTF8StringEncoding];
  RCTAssert(result != nil, @"string_view contains invalid UTF-8 bytes");
  return result;
}
} // namespace
@interface RCTCxxInspectorWebSocketAdapter () <SRWebSocketDelegate> {
  std::weak_ptr<IWebSocketDelegate> _delegate;
  SRWebSocket *_webSocket;
}
@end

@implementation RCTCxxInspectorWebSocketAdapter
- (instancetype)initWithURL:(const std::string &)url delegate:(std::weak_ptr<IWebSocketDelegate>)delegate
{
  if ((self = [super init]) != nullptr) {
    _delegate = delegate;
    NSURL *requestURL = [NSURL URLWithString:NSStringFromUTF8StringView(url)];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:requestURL];
    [[RCTDevSupportHttpHeaders sharedInstance] applyHeadersToRequest:request];
    _webSocket = [[SRWebSocket alloc] initWithURLRequest:request];
    _webSocket.delegate = self;
    [_webSocket open];
  }
  return self;
}

- (void)send:(std::string_view)message
{
  __weak RCTCxxInspectorWebSocketAdapter *weakSelf = self;
  NSString *messageStr = NSStringFromUTF8StringView(message);
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTCxxInspectorWebSocketAdapter *strongSelf = weakSelf;
    if (strongSelf != nullptr) {
      [strongSelf->_webSocket sendString:messageStr error:NULL];
    }
  });
}

- (void)close
{
  [_webSocket closeWithCode:1000 reason:@"End of session"];
}

- (void)webSocketDidOpen:(__unused SRWebSocket *)webSocket
{
  // NOTE: We are on the main queue here, per SRWebSocket's defaults.
  if (auto delegate = _delegate.lock()) {
    delegate->didOpen();
  }
}

- (void)webSocket:(__unused SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  // NOTE: We are on the main queue here, per SRWebSocket's defaults.
  if (auto delegate = _delegate.lock()) {
    delegate->didFailWithError([error code], [error description].UTF8String);
  }
}

- (void)webSocket:(__unused SRWebSocket *)webSocket didReceiveMessageWithString:(NSString *)message
{
  // NOTE: We are on the main queue here, per SRWebSocket's defaults.
  if (auto delegate = _delegate.lock()) {
    delegate->didReceiveMessage([message UTF8String]);
  }
}

- (void)webSocket:(__unused SRWebSocket *)webSocket
    didCloseWithCode:(__unused NSInteger)code
              reason:(__unused NSString *)reason
            wasClean:(__unused BOOL)wasClean
{
  // NOTE: We are on the main queue here, per SRWebSocket's defaults.
  if (auto delegate = _delegate.lock()) {
    delegate->didClose();
  }
}

@end

#endif
