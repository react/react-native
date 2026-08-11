/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/http/IWebSocketClient.h>
#include <memory>
#include <string>
#include <thread>

namespace facebook::react {

class WebSocketClient : public IWebSocketClient {
 public:
  WebSocketClient() noexcept;
  ~WebSocketClient() override;
  WebSocketClient(WebSocketClient& other) = delete;
  WebSocketClient& operator=(WebSocketClient& other) = delete;
  WebSocketClient(WebSocketClient&& other) = delete;
  WebSocketClient& operator=(WebSocketClient&& other) = delete;

  void setOnClosedCallback(OnClosedCallback&& callback) noexcept override;

  void setOnMessageCallback(OnMessageCallback&& callback) noexcept override;

  void connect(
      const std::string& url,
      OnConnectCallback&& onConnectCallback = nullptr) override;

  void close(const std::string& reason) override;

  void send(const std::string& message) override;

  void ping() override;

 private:
  struct Impl;

  // Instance data and IO thread
  const std::shared_ptr<Impl> impl_;
  std::unique_ptr<std::thread> thread_;
};

} // namespace facebook::react
