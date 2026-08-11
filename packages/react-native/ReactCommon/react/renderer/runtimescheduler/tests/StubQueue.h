/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <condition_variable>
#include <queue>

class StubQueue {
 public:
  void runOnQueue(std::function<void()>&& func) {
    {
      std::lock_guard<std::mutex> lock(mutex_);
      callbackQueue_.push(func);
    }

    signal_.notify_one();
  }

  void flush() {
    while (size() > 0) {
      tick();
    }
  }

  void tick() {
    std::function<void()> callback;
    {
      std::lock_guard<std::mutex> lock(mutex_);
      if (!callbackQueue_.empty()) {
        callback = callbackQueue_.front();
        callbackQueue_.pop();
      }
    }

    if (callback) {
      callback();
    }
  }

  size_t size() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return callbackQueue_.size();
  }

  bool waitForTask() const {
    std::unique_lock<std::mutex> lock(mutex_);
    return signal_.wait_for(
        lock, StubQueue::timeout, [this]() { return !callbackQueue_.empty(); });
  }

  bool waitForTasks(std::size_t numberOfTasks) const {
    std::unique_lock<std::mutex> lock(mutex_);
    return signal_.wait_for(lock, StubQueue::timeout, [this, numberOfTasks]() {
      return numberOfTasks == callbackQueue_.size();
    });
  }

 private:
  mutable std::condition_variable signal_;
  mutable std::mutex mutex_;
  std::queue<std::function<void()>> callbackQueue_;

  static constexpr std::chrono::duration<double> timeout =
      std::chrono::milliseconds(100);
};
