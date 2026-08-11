/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorThread.h"

#include <jsinspector-modern/InspectorPackagerConnection.h>
#include <react/http/IWebSocketClient.h>
#include <chrono>
#include <memory>
#include <string>

namespace facebook::react {

class IWebSocketClient;

class InspectorPackagerConnectionDelegate final
    : public jsinspector_modern::InspectorPackagerConnectionDelegate {
  class WebSocket : public jsinspector_modern::IWebSocket {
   public:
    WebSocket(
        const std::string& url,
        std::weak_ptr<jsinspector_modern::IWebSocketDelegate> webSocketDelegate,
        std::weak_ptr<InspectorThread> inspectorThread,
        const WebSocketClientFactory& webSocketClientFactory);
    ~WebSocket() override;
    WebSocket(const WebSocket& other) = delete;
    WebSocket& operator=(WebSocket& other) = delete;
    WebSocket(WebSocket&& other) = delete;
    WebSocket& operator=(WebSocket&& other) = delete;

    void send(std::string_view message) override;

   private:
    std::weak_ptr<jsinspector_modern::IWebSocketDelegate> webSocketDelegate_;
    std::weak_ptr<InspectorThread> inspectorThread_;
    std::unique_ptr<IWebSocketClient> websocket_;
  };

 public:
  InspectorPackagerConnectionDelegate(
      std::weak_ptr<InspectorThread> inspectorThread,
      WebSocketClientFactory webSocketClientFactory) noexcept;

  std::unique_ptr<jsinspector_modern::IWebSocket> connectWebSocket(
      const std::string& url,
      std::weak_ptr<jsinspector_modern::IWebSocketDelegate> delegate) override;

  void scheduleCallback(
      std::function<void(void)> callback,
      std::chrono::milliseconds delayMs =
          std::chrono::milliseconds::zero()) override;

 private:
  std::weak_ptr<InspectorThread> inspectorThread_;
  WebSocketClientFactory webSocketClientFactory_;
};

} // namespace facebook::react
