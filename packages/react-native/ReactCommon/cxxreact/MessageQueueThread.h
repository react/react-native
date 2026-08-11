/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

namespace facebook::react {

class MessageQueueThread {
 public:
  virtual ~MessageQueueThread() = default;
  virtual void runOnQueue(std::function<void()>&&) = 0;
  // runOnQueueSync and quitSynchronous are dangerous.  They should only be
  // used for initialization and cleanup.
  virtual void runOnQueueSync(std::function<void()>&&) = 0;
  // Once quitSynchronous() returns, no further work should run on the queue.
  virtual void quitSynchronous() = 0;
};

} // namespace facebook::react
