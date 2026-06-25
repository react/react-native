/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MessageQueueThreadImpl.h"

#include <functional>

namespace facebook::react {

void MessageQueueThreadImpl::runOnQueue(std::function<void()>&& runnable) {
  if (!taskDispatchThread_.isRunning()) {
    return;
  }
  taskDispatchThread_.runAsync(std::move(runnable));
}

void MessageQueueThreadImpl::runOnQueueSync(std::function<void()>&& runnable) {
  if (!taskDispatchThread_.isRunning()) {
    return;
  }
  if (taskDispatchThread_.isOnThread()) {
    runnable();
  } else {
    taskDispatchThread_.runSync(std::move(runnable));
  }
}

void MessageQueueThreadImpl::quitSynchronous() {
  taskDispatchThread_.quit();
}

} // namespace facebook::react
