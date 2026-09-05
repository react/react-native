/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include "InspectorInterfaces.h"

// Utilities that are useful when integrating with InspectorInterfaces.h but
// do not need to be exported.

namespace facebook::react::jsinspector_modern {

/**
 * Wraps a callback function in ILocalConnection.
 */
class CallbackLocalConnection : public ILocalConnection {
 public:
  /**
   * Creates a new Connection that uses the given callback to send messages to
   * the backend.
   */
  explicit CallbackLocalConnection(std::function<void(std::string)> handler);

  void sendMessage(std::string message) override;

  void disconnect() override;

 private:
  std::function<void(std::string)> handler_;
};

/**
 * Wraps a callback function in IRemoteConnection.
 */
class CallbackRemoteConnection : public IRemoteConnection {
 public:
  /**
   * Creates a new Connection that uses the given callback to receive messages
   * from the backend.
   */
  explicit CallbackRemoteConnection(std::function<void(std::string)> handler);

  void onMessage(std::string message) override;

  void onDisconnect() override {}

 private:
  std::function<void(std::string)> handler_;
};

/**
 * Wraps an IRemoteConnection in a simpler interface that calls `onDisconnect`
 * implicitly upon destruction.
 */
class RAIIRemoteConnection {
 public:
  explicit RAIIRemoteConnection(std::unique_ptr<IRemoteConnection> remote);

  void onMessage(std::string message);

  ~RAIIRemoteConnection();

 private:
  std::unique_ptr<IRemoteConnection> remote_;
};

/**
 * An \c IRemoteConnection that does nothing.
 */
class NullRemoteConnection : public IRemoteConnection {
  inline void onMessage(std::string /*message*/) override {}
  inline void onDisconnect() override {}
};

} // namespace facebook::react::jsinspector_modern
