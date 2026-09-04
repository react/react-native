/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <ReactCommon/RuntimeExecutor.h>
#include <ReactCommon/SchedulerPriority.h>
#include <jsi/jsi.h>
#include <atomic>
#include <mutex>
#include <queue>

namespace facebook::react {

class BufferedRuntimeExecutor {
 public:
  using Work = std::function<void(jsi::Runtime &runtime)>;

  /**
   * Drains one piece of buffered work. Always given a priority; an executor
   * that sits below the RuntimeScheduler, and so has no notion of one, ignores
   * it.
   */
  using Executor = std::function<void(SchedulerPriority, Work &&)>;

  // A utility structure to track pending work in the order of when they arrive.
  struct BufferedWork {
    uint64_t index_;
    Work work_;
    SchedulerPriority priority_;
    bool operator<(const BufferedWork &rhs) const
    {
      // Higher index has lower priority, so this inverted comparison puts
      // the smaller index on top of the queue.
      return index_ > rhs.index_;
    }
  };

  BufferedRuntimeExecutor(Executor executor);

  /** Equivalent to `execute(SchedulerPriority::ImmediatePriority, ...)`. */
  void execute(Work &&callback);

  /**
   * Buffers [callback] alongside work submitted through the other overload,
   * preserving submission order between them, and dispatches it at [priority]
   * once flushed.
   */
  void execute(SchedulerPriority priority, Work &&callback);

  // Flush buffered JS calls and then diable JS buffering
  void flush();

 private:
  // Perform flushing without locking mechanism
  void unsafeFlush();

  Executor executor_;
  std::atomic<bool> isBufferingEnabled_;
  std::mutex lock_;
  std::atomic<uint64_t> lastIndex_;
  std::priority_queue<BufferedWork> queue_;
};

} // namespace facebook::react
