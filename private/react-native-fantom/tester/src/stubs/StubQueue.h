/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cxxreact/MessageQueueThread.h>
#include <glog/logging.h>
#include <condition_variable>
#include <queue>

namespace facebook::react {

class StubQueue : public MessageQueueThread {
 public:
  void runOnQueue(std::function<void()>&& func) override;

  void runOnQueueSync(std::function<void()>&& runnable) override;

  void quitSynchronous() override;

  bool hasPendingCallbacks();

  void flush();

 private:
  void tick();

  std::queue<std::function<void()>> callbackQueue_;
};

} // namespace facebook::react
