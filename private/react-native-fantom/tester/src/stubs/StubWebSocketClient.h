/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/http/IWebSocketClient.h>

namespace facebook::react {

class StubWebSocketClient : public IWebSocketClient {
 public:
  StubWebSocketClient() noexcept = default;
  ~StubWebSocketClient() override = default;
  StubWebSocketClient(StubWebSocketClient &other) = delete;
  StubWebSocketClient &operator=(StubWebSocketClient &other) = delete;
  StubWebSocketClient(StubWebSocketClient &&other) = delete;
  StubWebSocketClient &operator=(StubWebSocketClient &&other) = delete;

  void setOnClosedCallback(OnClosedCallback && /*callback*/) noexcept override {}

  void setOnMessageCallback(OnMessageCallback && /*callback*/) noexcept override {}

  void connect(const std::string & /*url*/, OnConnectCallback && /*onConnectCallback*/ = nullptr) override {}

  void close(const std::string & /*reason*/) override {}

  void send(const std::string & /*message*/) override {}

  void ping() override {}
};

WebSocketClientFactory getStubWebSocketClientFactory();

} // namespace facebook::react
