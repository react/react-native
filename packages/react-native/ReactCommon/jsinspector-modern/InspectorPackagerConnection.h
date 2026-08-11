/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "WebSocketInterfaces.h"

#include <chrono>
#include <functional>
#include <memory>
#include <optional>
#include <string>
#include <string_view>

namespace facebook::react::jsinspector_modern {

class InspectorPackagerConnectionDelegate;

/**
 * A platform-agnostic implementation of the "device" side of the React Native
 * inspector-proxy protocol. The protocol multiplexes one or more debugger
 * connections over a single socket.
 * InspectorPackagerConnection will automatically attempt to reconnect after a
 * delay if the connection fails or is lost.
 */
class InspectorPackagerConnection {
 public:
  /**
   * Creates a new connection instance. Connections start in the disconnected
   * state; connect() should be called to establish a connection.
   * \param url The WebSocket URL where the inspector-proxy server is listening.
   * \param deviceName The host device name.
   * \param appName The application name.
   * \param delegate An interface to platform-specific methods for creating a
   * WebSocket, scheduling async work, etc.
   */
  InspectorPackagerConnection(
      std::string url,
      std::string deviceName,
      std::string appName,
      std::unique_ptr<InspectorPackagerConnectionDelegate> delegate);
  bool isConnected() const;
  void connect();
  void closeQuietly();
  void sendEventToAllConnections(std::string event);

 private:
  class Impl;

  const std::shared_ptr<Impl> impl_;
};

/**
 * An interface implemented by each supported platform to provide
 * platform-specific functionality required by InspectorPackagerConnection.
 */
class InspectorPackagerConnectionDelegate {
 public:
  virtual ~InspectorPackagerConnectionDelegate() = default;

  /**
   * Creates a new WebSocket connection. The WebSocket must be in a connected
   * state when created, and automatically disconnect when destroyed.
   */
  virtual std::unique_ptr<IWebSocket> connectWebSocket(
      const std::string& url,
      std::weak_ptr<IWebSocketDelegate> delegate) = 0;

  /**
   * Schedules a function to run after a delay. If the function is called
   * asynchronously, the implementer of InspectorPackagerConnectionDelegate
   * is responsible for thread safety and should schedule the callback on
   * the inspector queue. The callback MAY be dropped and never called if no
   * further callbacks are being accepted, e.g. if the application is
   * terminating.
   */
  virtual void scheduleCallback(
      std::function<void(void)> callback,
      std::chrono::milliseconds delayMs) = 0;
};

} // namespace facebook::react::jsinspector_modern
