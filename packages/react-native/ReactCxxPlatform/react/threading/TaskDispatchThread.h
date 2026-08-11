/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>
#include <condition_variable>
#include <functional>
#include <future>
#include <mutex>
#include <queue>
#include <thread>

namespace facebook::react {

/**
 * Representation of a thread looper which can add tasks to a queue and handle
 * the synchronization of callers.
 */
class TaskDispatchThread {
 public:
  using TaskFn = std::function<void()>;
  using TimePoint = std::chrono::time_point<std::chrono::system_clock>;

  TaskDispatchThread(
      std::string_view threadName = "",
      int priorityOffset = 0) noexcept;

  ~TaskDispatchThread() noexcept;

  /** Return true if the current thread is the same as this looper's thread. */
  bool isOnThread() noexcept;

  /** Return true until TaskDispatchThread.quit() is called  */
  bool isRunning() noexcept;

  /** Add task to the queue and return immediately. */
  void runAsync(
      TaskFn&& task,
      std::chrono::milliseconds delayMs =
          std::chrono::milliseconds::zero()) noexcept;

  /** Add task to the queue and wait until it has completed. */
  void runSync(TaskFn&& task) noexcept;

  /** Shut down and clean up the thread. */
  void quit() noexcept;

 protected:
  struct Task {
    TimePoint dispatchTime;
    TaskFn fn;

    Task(TimePoint dispatchTime, TaskFn&& fn)
        : dispatchTime(dispatchTime), fn(std::move(fn)) {}

    bool operator<(const Task& other) const {
      // Have the earliest tasks be at the front of the queue.
      return dispatchTime > other.dispatchTime;
    }
  };

  void loop() noexcept;

  std::mutex mutex_;
  std::condition_variable loopCv_;
  std::priority_queue<Task> queue_;
  std::atomic<bool> running_{true};
  std::string threadName_;
  std::thread thread_;

  std::promise<void> loopStoppedPromise_;
};

} // namespace facebook::react
