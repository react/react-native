/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler_Legacy.h"

#ifndef RCT_REMOVE_LEGACY_ARCH

#include "SchedulerPriorityUtils.h"

#include <ReactCommon/RuntimeExecutorSyncUIThreadUtils.h>
#include <cxxreact/TraceSection.h>
#include <react/renderer/consistency/ScopedShadowTreeRevisionLock.h>
#include <utility>

namespace facebook::react {

#pragma mark - Public

RuntimeScheduler_Legacy::RuntimeScheduler_Legacy(
    RuntimeExecutor runtimeExecutor,
    std::function<HighResTimeStamp()> now,
    RuntimeSchedulerTaskErrorHandler onTaskError)
    : runtimeExecutor_(std::move(runtimeExecutor)),
      now_(std::move(now)),
      onTaskError_(std::move(onTaskError)) {}

void RuntimeScheduler_Legacy::scheduleWork(RawCallback&& callback) noexcept {
  TraceSection s("RuntimeScheduler::scheduleWork");

  runtimeAccessRequests_ += 1;

  runtimeExecutor_(
      [this, callback = std::move(callback)](jsi::Runtime& runtime) {
        TraceSection s2("RuntimeScheduler::scheduleWork callback");
        runtimeAccessRequests_ -= 1;
        {
          ScopedShadowTreeRevisionLock revisionLock(
              shadowTreeRevisionConsistencyManager_);
          callback(runtime);
        }
        startWorkLoop(runtime);
      });
}

std::shared_ptr<Task> RuntimeScheduler_Legacy::scheduleTask(
    SchedulerPriority priority,
    jsi::Function&& callback) noexcept {
  TraceSection s(
      "RuntimeScheduler::scheduleTask",
      "priority",
      serialize(priority),
      "callbackType",
      "jsi::Function");

  auto expirationTime = now_() + timeoutForSchedulerPriority(priority);
  auto task =
      std::make_shared<Task>(priority, std::move(callback), expirationTime);
  taskQueue_.push(task);

  scheduleWorkLoopIfNecessary();

  return task;
}

std::shared_ptr<Task> RuntimeScheduler_Legacy::scheduleTask(
    SchedulerPriority priority,
    RawCallback&& callback) noexcept {
  TraceSection s(
      "RuntimeScheduler::scheduleTask",
      "priority",
      serialize(priority),
      "callbackType",
      "RawCallback");

  auto expirationTime = now_() + timeoutForSchedulerPriority(priority);
  auto task =
      std::make_shared<Task>(priority, std::move(callback), expirationTime);
  taskQueue_.push(task);

  scheduleWorkLoopIfNecessary();

  return task;
}

std::shared_ptr<Task> RuntimeScheduler_Legacy::scheduleIdleTask(
    jsi::Function&& /*callback*/,
    HighResDuration /*timeout*/) noexcept {
  // Idle tasks are not supported on Legacy RuntimeScheduler.
  // Because the method is `noexcept`, we return `nullptr` here and handle it
  // on the caller side.
  return nullptr;
}

std::shared_ptr<Task> RuntimeScheduler_Legacy::scheduleIdleTask(
    RawCallback&& /*callback*/,
    HighResDuration /*timeout*/) noexcept {
  // Idle tasks are not supported on Legacy RuntimeScheduler.
  // Because the method is `noexcept`, we return `nullptr` here and handle it
  // on the caller side.
  return nullptr;
}

bool RuntimeScheduler_Legacy::getShouldYield() noexcept {
  return runtimeAccessRequests_ > 0;
}

void RuntimeScheduler_Legacy::cancelTask(Task& task) noexcept {
  task.callback.reset();
}

SchedulerPriority RuntimeScheduler_Legacy::getCurrentPriorityLevel()
    const noexcept {
  return currentPriority_;
}

HighResTimeStamp RuntimeScheduler_Legacy::now() const noexcept {
  return now_();
}

void RuntimeScheduler_Legacy::executeNowOnTheSameThread(
    RawCallback&& callback) {
  TraceSection s("RuntimeScheduler::executeNowOnTheSameThread");

  static thread_local jsi::Runtime* runtimePtr = nullptr;

  if (runtimePtr == nullptr) {
    runtimeAccessRequests_ += 1;
    executeSynchronouslyOnSameThread_CAN_DEADLOCK(
        runtimeExecutor_, [this, &callback](jsi::Runtime& runtime) {
          TraceSection s2(
              "RuntimeScheduler::executeNowOnTheSameThread callback");

          runtimeAccessRequests_ -= 1;
          {
            ScopedShadowTreeRevisionLock revisionLock(
                shadowTreeRevisionConsistencyManager_);
            runtimePtr = &runtime;
            callback(runtime);
            runtimePtr = nullptr;
          }
        });
  } else {
    // Protecting against re-entry into `executeNowOnTheSameThread` from within
    // `executeNowOnTheSameThread`. Without accounting for re-rentry, a deadlock
    // will occur when trying to gain access to the runtime.
    return callback(*runtimePtr);
  }

  // Resume work loop if needed. In synchronous mode
  // only expired tasks are executed. Tasks with lower priority
  // might be still in the queue.
  scheduleWorkLoopIfNecessary();
}

void RuntimeScheduler_Legacy::callExpiredTasks(jsi::Runtime& runtime) {
  TraceSection s("RuntimeScheduler::callExpiredTasks");

  auto previousPriority = currentPriority_;
  try {
    while (!taskQueue_.empty()) {
      auto topPriorityTask = taskQueue_.top();
      auto now = now_();
      auto didUserCallbackTimeout = topPriorityTask->expirationTime <= now;

      if (!didUserCallbackTimeout) {
        break;
      }

      executeTask(runtime, topPriorityTask, didUserCallbackTimeout);
    }
  } catch (jsi::JSError& error) {
    onTaskError_(runtime, error);
  } catch (std::exception& ex) {
    jsi::JSError error(runtime, std::string("Non-js exception: ") + ex.what());
    onTaskError_(runtime, error);
  }

  currentPriority_ = previousPriority;
}

void RuntimeScheduler_Legacy::scheduleRenderingUpdate(
    SurfaceId /*surfaceId*/,
    RuntimeSchedulerRenderingUpdate&& renderingUpdate) {
  TraceSection s("RuntimeScheduler::scheduleRenderingUpdate");

  if (renderingUpdate != nullptr) {
    renderingUpdate();
  }
}

void RuntimeScheduler_Legacy::setShadowTreeRevisionConsistencyManager(
    ShadowTreeRevisionConsistencyManager*
        shadowTreeRevisionConsistencyManager) {
  shadowTreeRevisionConsistencyManager_ = shadowTreeRevisionConsistencyManager;
}

void RuntimeScheduler_Legacy::setPerformanceEntryReporter(
    PerformanceEntryReporter* /*performanceEntryReporter*/) {
  // No-op in the legacy scheduler
}

void RuntimeScheduler_Legacy::setEventTimingDelegate(
    RuntimeSchedulerEventTimingDelegate* /*eventTimingDelegate*/) {
  // No-op in the legacy scheduler
}

void RuntimeScheduler_Legacy::setIntersectionObserverDelegate(
    RuntimeSchedulerIntersectionObserverDelegate*
    /*intersectionObserverDelegate*/) {
  // No-op in the legacy scheduler
}

#pragma mark - Private

void RuntimeScheduler_Legacy::scheduleWorkLoopIfNecessary() {
  if (!isWorkLoopScheduled_ && !isPerformingWork_) {
    isWorkLoopScheduled_ = true;
    runtimeExecutor_([this](jsi::Runtime& runtime) {
      isWorkLoopScheduled_ = false;
      startWorkLoop(runtime);
    });
  }
}

void RuntimeScheduler_Legacy::startWorkLoop(jsi::Runtime& runtime) {
  TraceSection s("RuntimeScheduler::startWorkLoop");

  auto previousPriority = currentPriority_;
  isPerformingWork_ = true;
  try {
    while (!taskQueue_.empty()) {
      auto topPriorityTask = taskQueue_.top();
      auto now = now_();
      auto didUserCallbackTimeout = topPriorityTask->expirationTime <= now;

      if (!didUserCallbackTimeout && getShouldYield()) {
        // This currentTask hasn't expired, and we need to yield.
        break;
      }

      executeTask(runtime, topPriorityTask, didUserCallbackTimeout);
    }
  } catch (jsi::JSError& error) {
    onTaskError_(runtime, error);
  } catch (std::exception& ex) {
    jsi::JSError error(runtime, std::string("Non-js exception: ") + ex.what());
    onTaskError_(runtime, error);
  }

  currentPriority_ = previousPriority;
  isPerformingWork_ = false;
}

void RuntimeScheduler_Legacy::executeTask(
    jsi::Runtime& runtime,
    const std::shared_ptr<Task>& task,
    bool didUserCallbackTimeout) {
  TraceSection s(
      "RuntimeScheduler::executeTask",
      "priority",
      serialize(task->priority),
      "didUserCallbackTimeout",
      didUserCallbackTimeout);

  currentPriority_ = task->priority;

  {
    ScopedShadowTreeRevisionLock revisionLock(
        shadowTreeRevisionConsistencyManager_);

    auto result = task->execute(runtime, didUserCallbackTimeout);

    if (result.isObject() && result.getObject(runtime).isFunction(runtime)) {
      task->callback = result.getObject(runtime).getFunction(runtime);
    } else {
      if (taskQueue_.top() == task) {
        taskQueue_.pop();
      }
    }
  }
}

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH
