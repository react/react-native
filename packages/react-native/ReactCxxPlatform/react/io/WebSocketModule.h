/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/http/IWebSocketClient.h>
#include <memory>
#include <optional>
#include <string>
#include <unordered_map>

namespace facebook::react {

class IWebSocketClient;

class WebSocketModule : public NativeWebSocketModuleCxxSpec<WebSocketModule>,
                        public std::enable_shared_from_this<WebSocketModule> {
 public:
  WebSocketModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      WebSocketClientFactory webSocketClientFactory);
  ~WebSocketModule() override;
  WebSocketModule(const WebSocketModule& other) = delete;
  WebSocketModule& operator=(WebSocketModule& other) = delete;
  WebSocketModule(WebSocketModule&& other) = delete;
  WebSocketModule& operator=(WebSocketModule&& other) = delete;

  void connect(
      jsi::Runtime& rt,
      const std::string& url,
      const std::optional<std::vector<std::string>>& protocols,
      jsi::Object options,
      int32_t socketID);

  void send(jsi::Runtime& rt, const std::string& message, int32_t socketID);

  void sendBinary(
      jsi::Runtime& rt,
      const std::string& base64String,
      int32_t socketID);

  void ping(jsi::Runtime& rt, int32_t socketID);

  void close(
      jsi::Runtime& rt,
      int32_t code,
      const std::string& reason,
      int32_t socketID);

  void addListener(jsi::Runtime& rt, const std::string& eventName);

  void removeListeners(jsi::Runtime& rt, int32_t count);

 private:
  WebSocketClientFactory webSocketClientFactory_;
  std::unordered_map<int32_t, std::unique_ptr<IWebSocketClient>> connections_;
};

} // namespace facebook::react
