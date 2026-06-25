/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/http/IWebSocketClient.h>
#include <react/threading/TaskDispatchThread.h>
#include <atomic>
#include <functional>
#include <memory>
#include <string>

namespace facebook::react {

class PackagerConnection {
  using LiveReloadCallback = std::function<void()>;
  using ShowDevMenuCallback = std::function<void()>;

 public:
  PackagerConnection(
      WebSocketClientFactory webSocketClientFactory,
      std::string packagerConnectionUrl,
      LiveReloadCallback &&liveReloadCallback,
      ShowDevMenuCallback &&showDevMenuCallback);
  ~PackagerConnection() noexcept;
  PackagerConnection(const PackagerConnection &other) = delete;
  PackagerConnection &operator=(PackagerConnection &other) = delete;
  PackagerConnection(PackagerConnection &&other) = delete;
  PackagerConnection &operator=(PackagerConnection &&other) = delete;

 private:
  void attemptConnection();
  void scheduleReconnect();

  const WebSocketClientFactory webSocketClientFactory_;
  const std::string packagerConnectionUrl_;
  const LiveReloadCallback liveReloadCallback_;
  const ShowDevMenuCallback showDevMenuCallback_;
  std::unique_ptr<IWebSocketClient> websocket_;
  std::atomic<bool> isInitialConnection_{true};
  std::atomic<bool> reconnectPending_{false};
  TaskDispatchThread reconnectThread_{"PackagerReconnect"};
};

} // namespace facebook::react
