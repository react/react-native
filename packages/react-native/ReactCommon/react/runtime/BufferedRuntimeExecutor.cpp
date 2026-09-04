/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BufferedRuntimeExecutor.h"

namespace facebook::react {

BufferedRuntimeExecutor::BufferedRuntimeExecutor(Executor executor)
    : executor_(std::move(executor)),
      isBufferingEnabled_(true),
      lastIndex_(0) {}

void BufferedRuntimeExecutor::execute(Work&& callback) {
  execute(SchedulerPriority::ImmediatePriority, std::move(callback));
}

void BufferedRuntimeExecutor::execute(
    SchedulerPriority priority,
    Work&& callback) {
  if (!isBufferingEnabled_) {
    // Fast path: Schedule directly to the executor, without locking
    executor_(priority, std::move(callback));
    return;
  }

  /**
   * Note: std::mutex doesn't have a FIFO ordering.
   * To preserve the order of the buffered work, use a priority queue and
   * track the last known work index.
   */
  uint64_t newIndex = lastIndex_++;
  std::scoped_lock guard(lock_);
  if (isBufferingEnabled_) {
    queue_.push(
        {.index_ = newIndex,
         .work_ = std::move(callback),
         .priority_ = priority});
    return;
  }

  // Force flush the queue to maintain the execution order.
  unsafeFlush();

  executor_(priority, std::move(callback));
}

void BufferedRuntimeExecutor::flush() {
  std::scoped_lock guard(lock_);
  unsafeFlush();
  isBufferingEnabled_ = false;
}

void BufferedRuntimeExecutor::unsafeFlush() {
  while (!queue_.empty()) {
    const BufferedWork& bufferedWork = queue_.top();
    Work work = bufferedWork.work_;
    executor_(bufferedWork.priority_, std::move(work));
    queue_.pop();
  }
}

} // namespace facebook::react
