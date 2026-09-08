/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BufferedRuntimeExecutor.h"

#include <algorithm>
#include <utility>

namespace facebook::react {

BufferedRuntimeExecutor::BufferedRuntimeExecutor(Executor executor)
    : executor_(std::move(executor)),
      isBufferingEnabled_(true),
      lastIndex_(0) {}

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
    queue_.push_back(
        {.index_ = newIndex,
         .work_ = std::move(callback),
         .priority_ = priority});
    return;
  }

  // Force flush the queue to maintain the execution order.
  unsafeFlush();

  executor_(priority, std::move(callback));
}

RuntimeExecutor BufferedRuntimeExecutor::asRuntimeExecutor() {
  return [self = shared_from_this()](Work&& callback) {
    self->execute(SchedulerPriority::ImmediatePriority, std::move(callback));
  };
}

RuntimeExecutor BufferedRuntimeExecutor::asWeakRuntimeExecutor() {
  return [weakSelf = weak_from_this()](Work&& callback) {
    if (auto self = weakSelf.lock()) {
      self->execute(SchedulerPriority::ImmediatePriority, std::move(callback));
    }
  };
}

void BufferedRuntimeExecutor::flush() {
  std::scoped_lock guard(lock_);
  unsafeFlush();
  isBufferingEnabled_ = false;
}

void BufferedRuntimeExecutor::unsafeFlush() {
  // Indices are handed out before the lock is taken, so arrival order can
  // differ from submission order. Sorting once here restores it, and costs less
  // than a heap did: nothing sifts on the way in, and each callback is moved
  // out rather than copied.
  auto batch = std::move(queue_);
  queue_.clear();
  std::sort(
      batch.begin(),
      batch.end(),
      [](const BufferedWork& lhs, const BufferedWork& rhs) {
        return lhs.index_ < rhs.index_;
      });
  for (auto& bufferedWork : batch) {
    executor_(bufferedWork.priority_, std::move(bufferedWork.work_));
  }
}

} // namespace facebook::react
