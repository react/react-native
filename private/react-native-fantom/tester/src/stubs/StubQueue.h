/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cxxreact/MessageQueueThread.h>
#include <memory>
#include <mutex>
#include <queue>

namespace facebook::react {

class StubQueue : public MessageQueueThread {
 public:
  void runOnQueue(std::function<void()> &&func) override;

  void runOnQueueSync(std::function<void()> &&runnable) override;

  void quitSynchronous() override;

  bool hasPendingCallbacks();

  // Draining belongs to the single consumer thread.
  void flush();

 private:
  bool tick();

  std::mutex mutex_;
  std::queue<std::unique_ptr<std::function<void()>>> callbackQueue_;
};

} // namespace facebook::react
