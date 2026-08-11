/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

#import "RCTCxxInspectorWebSocketAdapter.h"

#import <jsinspector-modern/InspectorPackagerConnection.h>

#import <chrono>
#import <memory>
#import <string>

namespace facebook::react::jsinspector_modern {
/**
 * Glue between C++ and Objective-C for InspectorPackagerConnectionDelegate.
 */
class RCTCxxInspectorPackagerConnectionDelegate
    : public InspectorPackagerConnectionDelegate {
  class WebSocket : public IWebSocket {
   public:
    WebSocket(RCTCxxInspectorWebSocketAdapter* adapter);
    virtual void send(std::string_view message) override;
    virtual ~WebSocket() override;

   private:
    RCTCxxInspectorWebSocketAdapter* const _adapter;
  };

 public:
  virtual std::unique_ptr<IWebSocket> connectWebSocket(
      const std::string& url,
      std::weak_ptr<IWebSocketDelegate> delegate) override;

  virtual void scheduleCallback(
      std::function<void(void)> callback,
      std::chrono::milliseconds delayMs) override;
};
} // namespace facebook::react::jsinspector_modern

#endif
