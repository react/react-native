/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <jsi/jsi.h>
#include <atomic>
#include <mutex>
#include <queue>

namespace facebook::react {

class BufferedRuntimeExecutor {
 public:
  using Work = std::function<void(jsi::Runtime& runtime)>;

  // A utility structure to track pending work in the order of when they arrive.
  struct BufferedWork {
    uint64_t index_;
    Work work_;
    bool operator<(const BufferedWork& rhs) const {
      // Higher index has lower priority, so this inverted comparison puts
      // the smaller index on top of the queue.
      return index_ > rhs.index_;
    }
  };

  BufferedRuntimeExecutor(RuntimeExecutor runtimeExecutor);

  void execute(Work&& callback);

  // Flush buffered JS calls and then diable JS buffering
  void flush();

 private:
  // Perform flushing without locking mechanism
  void unsafeFlush();

  RuntimeExecutor runtimeExecutor_;
  std::atomic<bool> isBufferingEnabled_;
  std::mutex lock_;
  std::atomic<uint64_t> lastIndex_;
  std::priority_queue<BufferedWork> queue_;
};

} // namespace facebook::react
