/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorPackagerConnectionDelegate.h"

#include <chrono>
#include <utility>

namespace facebook::react {

InspectorPackagerConnectionDelegate::WebSocket::WebSocket(
    const std::string& url,
    std::weak_ptr<jsinspector_modern::IWebSocketDelegate> webSocketDelegate,
    std::weak_ptr<InspectorThread> inspectorThread,
    const WebSocketClientFactory& webSocketClientFactory)
    : webSocketDelegate_{webSocketDelegate},
      inspectorThread_(std::move(inspectorThread)) {
  websocket_ = webSocketClientFactory();
  websocket_->setOnMessageCallback(
      [webSocketDelegate,
       inspectorThread = inspectorThread_](const std::string& message) {
        auto strongInspectorThread = inspectorThread.lock();
        if (!strongInspectorThread) {
          return;
        }
        strongInspectorThread->invokeElsePost([webSocketDelegate, message]() {
          if (const auto strongDelegate = webSocketDelegate.lock()) {
            strongDelegate->didReceiveMessage(message);
          }
        });
      });
  websocket_->setOnClosedCallback(
      [webSocketDelegate,
       inspectorThread = inspectorThread_](const std::string& /*message*/) {
        auto strongInspectorThread = inspectorThread.lock();
        if (!strongInspectorThread) {
          return;
        }
        strongInspectorThread->invokeElsePost([webSocketDelegate]() {
          if (const auto strongDelegate = webSocketDelegate.lock()) {
            strongDelegate->didClose();
          }
        });
      });
  websocket_->connect(
      url,
      [webSocketDelegate, inspectorThread = inspectorThread_](
          bool success, const std::string& message) {
        auto strongInspectorThread = inspectorThread.lock();
        if (!strongInspectorThread) {
          return;
        }
        strongInspectorThread->invokeElsePost(
            [webSocketDelegate, success, message]() {
              if (auto strongDelegate = webSocketDelegate.lock()) {
                if (success) {
                  strongDelegate->didOpen();
                } else {
                  // Assume the server is not running, and suppress an error log
                  strongDelegate->didFailWithError(ECONNREFUSED, message);
                }
              }
            });
      });
}

InspectorPackagerConnectionDelegate::WebSocket::~WebSocket() {
  websocket_->close("InspectorPackagerConnectionDelegate destroyed");
};

void InspectorPackagerConnectionDelegate::WebSocket::send(
    std::string_view message) {
  if (auto strongInspectorThread = inspectorThread_.lock()) {
    strongInspectorThread->invokeElsePost(
        [this, message = std::string(message)]() {
          if (websocket_) {
            websocket_->send(message);
          }
        });
  }
}

InspectorPackagerConnectionDelegate::InspectorPackagerConnectionDelegate(
    std::weak_ptr<InspectorThread> inspectorThread,
    WebSocketClientFactory webSocketClientFactory) noexcept
    : inspectorThread_(std::move(inspectorThread)),
      webSocketClientFactory_(std::move(webSocketClientFactory)) {}

std::unique_ptr<jsinspector_modern::IWebSocket>
InspectorPackagerConnectionDelegate::connectWebSocket(
    const std::string& url,
    std::weak_ptr<jsinspector_modern::IWebSocketDelegate> delegate) {
  return std::make_unique<WebSocket>(
      url, delegate, inspectorThread_, webSocketClientFactory_);
}

void InspectorPackagerConnectionDelegate::scheduleCallback(
    std::function<void(void)> callback,
    std::chrono::milliseconds delayMs) {
  if (auto inspectorThread = inspectorThread_.lock()) {
    inspectorThread->invokeElsePost(std::move(callback), delayMs);
  }
}

} // namespace facebook::react
