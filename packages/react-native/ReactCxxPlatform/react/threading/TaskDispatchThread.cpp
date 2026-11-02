/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TaskDispatchThread.h"

#include <folly/portability/SysResource.h>
#include <folly/system/ThreadName.h>
#include <cassert>
#include <chrono>
#include <future>
#include <utility>

#ifdef ANDROID
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <sys/syscall.h>
#endif

namespace facebook::react {

TaskDispatchThread::TaskDispatchThread(
    std::string_view threadName,
    int priorityOffset) noexcept
    : threadName_(threadName) {
#ifdef ANDROID
  // Attaches the thread to JVM just in case anything calls out to Java.
  // Capture priorityOffset by value: it is a constructor parameter whose
  // storage dies when the constructor returns, and the thread body reads it
  // asynchronously.
  thread_ = std::thread([this, priorityOffset]() {
    facebook::jni::ThreadScope::WithClassLoader([this, priorityOffset]() {
      int result = setpriority(
          PRIO_PROCESS,
          static_cast<pid_t>(::syscall(SYS_gettid)),
          priorityOffset);

      if (result != 0) {
        LOG(INFO) << " setCurrentThreadPriority failed with pri errno: "
                  << errno;
      }

      loop();
    });
  });

#else
  thread_ = std::thread(&TaskDispatchThread::loop, this);
#endif
  threadId_ = thread_.get_id();
}

TaskDispatchThread::~TaskDispatchThread() noexcept {
  quit();
}

bool TaskDispatchThread::isOnThread() noexcept {
  return !loopStopped_ && std::this_thread::get_id() == threadId_;
}

bool TaskDispatchThread::isRunning() noexcept {
  return running_;
}

void TaskDispatchThread::runAsync(
    TaskFn&& task,
    std::chrono::milliseconds delayMs) noexcept {
  auto ownedTask = std::make_unique<TaskFn>(std::move(task));
  std::lock_guard<std::mutex> guard(mutex_);
  if (!running_) {
    return;
  }
  auto dispatchTime = std::chrono::system_clock::now() + delayMs;
  queue_.emplace(dispatchTime, std::move(ownedTask));
  loopCv_.notify_one();
}

void TaskDispatchThread::runSync(TaskFn&& task) noexcept {
  // Calling runSync from the dispatch thread would deadlock, as the thread
  // would wait for itself to execute the task it just queued.
  assert(!isOnThread());

  // Use shared_ptr to ensure the promise outlives both the caller and the
  // queued task. The destructor guard ensures the promise is fulfilled even
  // if the task is destroyed without executing (e.g., when quit() clears the
  // queue during shutdown).
  auto promise = std::make_shared<std::promise<void>>();
  auto guard = std::shared_ptr<void>(
      nullptr, [promise](void*) { promise->set_value(); });

  runAsync([guard = std::move(guard), task = std::move(task)]() { task(); });
  promise->get_future().wait();
}

void TaskDispatchThread::cancelPendingTasks() noexcept {
  std::priority_queue<Task> discarded;
  {
    std::lock_guard<std::mutex> lock(mutex_);
    queue_.swap(discarded);
  }
  loopCv_.notify_one();
}

void TaskDispatchThread::quit() noexcept {
  const bool onThread = isOnThread();
  {
    std::lock_guard<std::mutex> lock(mutex_);
    running_ = false;
  }
  loopCv_.notify_one();
  if (!onThread) {
    {
      std::lock_guard<std::mutex> lock(joinMutex_);
      if (thread_.joinable()) {
        thread_.join();
      }
    }
  }
  cancelPendingTasks();
}

void TaskDispatchThread::loop() noexcept {
  if (!threadName_.empty()) {
    folly::setThreadName(threadName_);
  }
  std::unique_lock<std::mutex> lock(mutex_);
  while (running_) {
    loopCv_.wait(lock, [&]() { return !running_ || !queue_.empty(); });
    if (!running_) {
      break;
    }
    const auto dispatchTime = queue_.top().dispatchTime;
    if (dispatchTime > std::chrono::system_clock::now()) {
      loopCv_.wait_until(lock, dispatchTime, [this, dispatchTime]() {
        return !running_ || queue_.empty() ||
            queue_.top().dispatchTime != dispatchTime;
      });
      continue;
    }
    {
      auto fn = std::move(queue_.top().fn);
      queue_.pop();
      lock.unlock();
      if (running_) {
        (*fn)();
      }
    }
    lock.lock();
  }
  loopStopped_ = true;
}

} //  namespace facebook::react
