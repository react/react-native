/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <ReactCommon/SchedulerPriority.h>
#include <jsi/jsi.h>
#include <atomic>
#include <memory>
#include <mutex>
#include <vector>

namespace facebook::react {

class BufferedRuntimeExecutor : public std::enable_shared_from_this<BufferedRuntimeExecutor> {
 public:
  using Work = std::function<void(jsi::Runtime &runtime)>;

  // Drains one piece of buffered work, priority may be ignored
  using Executor = std::function<void(SchedulerPriority, Work &&)>;

  BufferedRuntimeExecutor(Executor executor);

  void execute(Work &&callback)
  {
    execute(SchedulerPriority::ImmediatePriority, std::move(callback));
  }

  /**
   * Buffers [callback] alongside work submitted through the other overload,
   * preserving submission order between them, and dispatches it at [priority]
   * once flushed.
   */
  void execute(SchedulerPriority priority, Work &&callback);

  /**
   * RuntimeExecutor, keeping this class alive for as long as the result is
   * held.
   */
  RuntimeExecutor asRuntimeExecutor();

  /**
   * RuntimeExecutor, keeping a weak reference to this class, so it does not
   * keep the runtime alive unnecessarily.
   */
  RuntimeExecutor asWeakRuntimeExecutor();

  // Flush buffered JS calls and then diable JS buffering
  void flush();

 private:
  // Perform flushing without locking mechanism
  void unsafeFlush();

  // A utility structure to track pending work in the order of when they arrive.
  struct BufferedWork {
    uint64_t index_;
    Work work_;
    SchedulerPriority priority_;
  };

  Executor executor_;
  std::atomic<bool> isBufferingEnabled_;
  std::mutex lock_;
  std::atomic<uint64_t> lastIndex_;
  std::vector<BufferedWork> queue_;
};

} // namespace facebook::react
