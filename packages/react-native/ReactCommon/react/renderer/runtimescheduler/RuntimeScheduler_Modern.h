/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/consistency/ShadowTreeRevisionConsistencyManager.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <atomic>
#include <memory>
#include <queue>
#include <shared_mutex>

namespace facebook::react {

class RuntimeScheduler_Modern final : public RuntimeSchedulerBase {
 public:
  explicit RuntimeScheduler_Modern(
      RuntimeExecutor runtimeExecutor,
      std::function<HighResTimeStamp()> now,
      RuntimeSchedulerTaskErrorHandler onTaskError);

  /*
   * Not copyable.
   */
  RuntimeScheduler_Modern(const RuntimeScheduler_Modern &) = delete;
  RuntimeScheduler_Modern &operator=(const RuntimeScheduler_Modern &) = delete;

  /*
   * Not movable.
   */
  RuntimeScheduler_Modern(RuntimeScheduler_Modern &&) = delete;
  RuntimeScheduler_Modern &operator=(RuntimeScheduler_Modern &&) = delete;

  /*
   * Alias for scheduleTask with immediate priority.
   *
   * To be removed when we finish testing this implementation.
   * All callers should use scheduleTask with the right priority after that.
   */
  void scheduleWork(RawCallback &&callback) noexcept override;

  /// IEventLoopControl implementation. \p task is always scheduled as an idle
  /// task.
  void scheduleTask(const std::function<void()> &task) override;

  uint64_t registerTaskQueueSource() override;

  void unregisterTaskQueueSource(uint64_t sourceId) override;

  /*
   * Grants access to the runtime synchronously on the caller's thread.
   *
   * Shouldn't be called directly. it is expected to be used
   * by dispatching a synchronous event via event emitter in your native
   * component.
   */
  void executeNowOnTheSameThread(RawCallback &&callback) override;

  /*
   * Adds a JavaScript callback to the priority queue with the given priority.
   * Triggers event loop if needed.
   */
  std::shared_ptr<Task> scheduleTask(SchedulerPriority priority, jsi::Function &&callback) noexcept override;

  /*
   * Adds a custom callback to the priority queue with the given priority.
   * Triggers event loop if needed.
   */
  std::shared_ptr<Task> scheduleTask(SchedulerPriority priority, RawCallback &&callback) noexcept override;

  /*
   * Adds a JavaScript callback to the idle queue with the given timeout.
   * Triggers event loop if needed.
   */
  std::shared_ptr<Task> scheduleIdleTask(
      jsi::Function &&callback,
      HighResDuration customTimeout = timeoutForSchedulerPriority(SchedulerPriority::IdlePriority)) noexcept override;

  /*
   * Adds a custom callback to the idle queue with the given timeout.
   * Triggers event loop if needed.
   */
  std::shared_ptr<Task> scheduleIdleTask(
      RawCallback &&callback,
      HighResDuration customTimeout = timeoutForSchedulerPriority(SchedulerPriority::IdlePriority)) noexcept override;

  /*
   * Cancelled task will never be executed.
   *
   * Operates on JSI object.
   * Thread synchronization must be enforced externally.
   */
  void cancelTask(Task &task) noexcept override;

  /*
   * Return value indicates if host platform has a pending access to the
   * runtime.
   *
   * Can be called from any thread.
   */
  bool getShouldYield() noexcept override;

  /*
   * Returns value of currently executed task. Designed to be called from React.
   *
   * Thread synchronization must be enforced externally.
   */
  SchedulerPriority getCurrentPriorityLevel() const noexcept override;

  /*
   * Returns current monotonic time. This time is not related to wall clock
   * time.
   *
   * Can be called from any thread.
   */
  HighResTimeStamp now() const noexcept override;

  /*
   * Expired task is a task that should have been already executed. Designed to
   * be called in the event pipeline after an event is dispatched to React.
   * React may schedule events with immediate priority which need to be handled
   * before the next event is sent to React.
   *
   * Thread synchronization must be enforced externally.
   *
   * TODO remove when we add support for microtasks
   */
  void callExpiredTasks(jsi::Runtime &runtime) override;

  /**
   * Schedules a function that notifies or applies UI changes in the host
   * platform, to be executed during the "Update the rendering" step of the
   * event loop. If the step is not enabled, the function is executed
   * immediately.
   */
  void scheduleRenderingUpdate(SurfaceId surfaceId, RuntimeSchedulerRenderingUpdate &&renderingUpdate) override;

  void setShadowTreeRevisionConsistencyManager(
      ShadowTreeRevisionConsistencyManager *shadowTreeRevisionConsistencyManager) override;

  void setPerformanceEntryReporter(PerformanceEntryReporter *performanceEntryReporter) override;

  void setEventTimingDelegate(RuntimeSchedulerEventTimingDelegate *eventTimingDelegate) override;

  void setIntersectionObserverDelegate(
      RuntimeSchedulerIntersectionObserverDelegate *intersectionObserverDelegate) override;

 private:
  /// Monotonic counter handing out IDs for IEventLoopControl task queue
  /// sources.
  std::atomic<uint64_t> nextTaskQueueSourceId_{0};

  std::atomic<uint_fast8_t> syncTaskRequests_{0};

  std::priority_queue<std::shared_ptr<Task>, std::vector<std::shared_ptr<Task>>, TaskPriorityComparer> taskQueue_;

  Task *currentTask_{};
  HighResTimeStamp lastYieldingOpportunity_;
  HighResDuration longestPeriodWithoutYieldingOpportunity_;

  void markYieldingOpportunity(HighResTimeStamp currentTime);

  /**
   * This protects the access to `taskQueue_` and `isevent loopScheduled_`.
   */
  mutable std::shared_mutex schedulingMutex_;

  const RuntimeExecutor runtimeExecutor_;
  SchedulerPriority currentPriority_{SchedulerPriority::NormalPriority};

  void scheduleEventLoop();
  void runEventLoop(jsi::Runtime &runtime);

  std::shared_ptr<Task> selectTask();

  void scheduleTask(std::shared_ptr<Task> task);

  /**
   * Follows all the steps necessary to execute the given task.
   * Depending on feature flags, this could also execute its microtasks.
   * In the future, this will include other steps in the Web event loop, like
   * updating the UI in native, executing resize observer callbacks, etc.
   */
  void runEventLoopTick(jsi::Runtime &runtime, Task &task);

  void executeTask(jsi::Runtime &runtime, Task &task, bool didUserCallbackTimeout);

  void updateRendering(HighResTimeStamp taskEndTime);

  void handleTaskError(jsi::Runtime &runtime, jsi::JSError &error);

  void clearQueues();

  bool performingMicrotaskCheckpoint_{false};
  void performMicrotaskCheckpoint(jsi::Runtime &runtime);

  void reportLongTasks(const Task &task, HighResTimeStamp startTime, HighResTimeStamp endTime);

  /*
   * Returns a time point representing the current point in time. May be called
   * from multiple threads.
   */
  std::function<HighResTimeStamp()> now_;

  /*
   * Flag indicating if callback on JavaScript queue has been
   * scheduled.
   */
  bool isEventLoopScheduled_{false};

  std::queue<RuntimeSchedulerRenderingUpdate> pendingRenderingUpdates_;
  std::unordered_set<SurfaceId> surfaceIdsWithPendingRenderingUpdates_;

  // TODO(T227212654) eventTimingDelegate_ is only set once during startup, so
  // the real fix here would be to delay runEventLoop until
  // setEventTimingDelegate.
  std::atomic<ShadowTreeRevisionConsistencyManager *> shadowTreeRevisionConsistencyManager_{nullptr};
  std::atomic<RuntimeSchedulerEventTimingDelegate *> eventTimingDelegate_{nullptr};

  PerformanceEntryReporter *performanceEntryReporter_{nullptr};
  RuntimeSchedulerIntersectionObserverDelegate *intersectionObserverDelegate_{nullptr};

  RuntimeSchedulerTaskErrorHandler onTaskError_;
};

} // namespace facebook::react
