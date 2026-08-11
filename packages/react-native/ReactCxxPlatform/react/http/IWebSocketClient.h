/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <string>

namespace facebook::react {

class IWebSocketClient {
 public:
  using OnConnectCallback = std::function<void(bool, const std::string&)>;
  using OnClosedCallback = std::function<void(const std::string&)>;
  using OnMessageCallback = std::function<void(const std::string&)>;

  virtual ~IWebSocketClient() = default;

  virtual void setOnClosedCallback(OnClosedCallback&& callback) noexcept = 0;

  virtual void setOnMessageCallback(OnMessageCallback&& callback) noexcept = 0;

  virtual void connect(
      const std::string& url,
      OnConnectCallback&& = nullptr) = 0;

  virtual void close(const std::string& reason) = 0;

  virtual void send(const std::string& message) = 0;

  virtual void ping() = 0;
};

extern const char WebSocketClientFactoryKey[];

extern const char DevToolsWebSocketClientFactoryKey[];

using WebSocketClientFactory =
    std::function<std::unique_ptr<IWebSocketClient>()>;

WebSocketClientFactory getWebSocketClientFactory();

} // namespace facebook::react
