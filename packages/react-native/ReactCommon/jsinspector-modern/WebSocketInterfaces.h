/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string>
#include <string_view>

namespace facebook::react::jsinspector_modern {

/**
 * Simplified interface to a WebSocket connection.
 */
class IWebSocket {
 public:
  /**
   * If still connected when destroyed, the socket MUST automatically send an
   * "end of session" message and disconnect.
   */
  virtual ~IWebSocket() = default;

  /**
   * Sends a message over the socket. This function may be called on any thread
   * without synchronization.
   * \param message Message to send, in UTF-8 encoding.
   */
  virtual void send(std::string_view message) = 0;
};

class IWebSocketDelegate {
 public:
  virtual ~IWebSocketDelegate() = default;

  /**
   * Called when the socket has encountered an error.
   * This method must be called on the inspector queue, and the
   * WebSocketDelegate may not be destroyed while it is executing.
   * \param posixCode POSIX errno value if available, otherwise nullopt.
   * \param error Error description.
   */
  virtual void didFailWithError(
      std::optional<int> posixCode,
      std::string error) = 0;

  /**
   * Called when a message has been received from the socket.
   * This method must be called on the inspector queue, and the
   * WebSocketDelegate may not be destroyed while it is executing.
   * \param message Message received, in UTF-8 encoding.
   */
  virtual void didReceiveMessage(std::string_view message) = 0;

  /**
   * Called when the socket has been opened.
   * This method must be called on the inspector queue, and the
   * WebSocketDelegate may not be destroyed while it is executing.
   */
  virtual void didOpen() = 0;

  /**
   * Called when the socket has been closed. The call is not required if
   * didFailWithError was called instead.
   * This method must be called on the inspector queue, and the
   * WebSocketDelegate may not be destroyed while it is executing.
   */
  virtual void didClose() = 0;
};

} // namespace facebook::react::jsinspector_modern
