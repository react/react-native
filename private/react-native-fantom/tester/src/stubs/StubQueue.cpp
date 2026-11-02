/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubQueue.h"

namespace facebook::react {

void StubQueue::runOnQueue(std::function<void()>&& func) {
  auto callback = std::make_unique<std::function<void()>>(std::move(func));
  {
    std::lock_guard lock(mutex_);
    callbackQueue_.push(std::move(callback));
  }
}

void StubQueue::runOnQueueSync(std::function<void()>&& runnable) {
  flush();
  runnable();
}

void StubQueue::quitSynchronous() {
  flush();
}

void StubQueue::flush() {
  while (tick()) {
  }
}

bool StubQueue::hasPendingCallbacks() {
  std::lock_guard lock(mutex_);
  return !callbackQueue_.empty();
}

bool StubQueue::tick() {
  std::unique_ptr<std::function<void()>> callback;
  {
    std::lock_guard lock(mutex_);
    if (callbackQueue_.empty()) {
      return false;
    }
    callback = std::move(callbackQueue_.front());
    callbackQueue_.pop();
  }
  if (*callback) {
    (*callback)();
  }
  return true;
}

} // namespace facebook::react
