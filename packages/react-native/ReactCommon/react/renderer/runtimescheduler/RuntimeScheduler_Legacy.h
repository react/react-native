/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/consistency/ShadowTreeRevisionConsistencyManager.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <atomic>
#include <memory>
#include <queue>

namespace facebook::react {

class RuntimeScheduler_Legacy final : public RuntimeSchedulerBase {
 public:
  explicit RuntimeScheduler_Legacy(
      RuntimeExecutor runtimeExecutor,
      std::function<HighResTimeStamp()> now,
      RuntimeSchedulerTaskErrorHandler onTaskError);

  /*
   * Not copyable.
   */
  RuntimeScheduler_Legacy(const RuntimeScheduler_Legacy &) = delete;
  RuntimeScheduler_Legacy &operator=(const RuntimeScheduler_Legacy &) = delete;

  /*
   * Not movable.
   */
  RuntimeScheduler_Legacy(RuntimeScheduler_Legacy &&) = delete;
  RuntimeScheduler_Legacy &operator=(RuntimeScheduler_Legacy &&) = delete;

  void scheduleWork(RawCallback &&callback) noexcept override;

  /// IEventLoopControl implementation. No-op for legacy scheduler.
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
   * Adds a JavaScript callback to priority queue with given priority.
   * Triggers workloop if needed.
   *
   * Thread synchronization must be enforced externally.
   */
  std::shared_ptr<Task> scheduleTask(SchedulerPriority priority, jsi::Function &&callback) noexcept override;

  std::shared_ptr<Task> scheduleTask(SchedulerPriority priority, RawCallback &&callback) noexcept override;

  /*
   * Adds a JavaScript callback to the idle queue with the given timeout.
   * Triggers workloop if needed.
   */
  std::shared_ptr<Task> scheduleIdleTask(
      jsi::Function &&callback,
      HighResDuration timeout = timeoutForSchedulerPriority(SchedulerPriority::IdlePriority)) noexcept override;

  /*
   * Adds a custom callback to the idle queue with the given timeout.
   * Triggers workloop if needed.
   */
  std::shared_ptr<Task> scheduleIdleTask(
      RawCallback &&callback,
      HighResDuration timeout = timeoutForSchedulerPriority(SchedulerPriority::IdlePriority)) noexcept override;

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
   * Thread synchronization must be enforced externally.
   */
  HighResTimeStamp now() const noexcept override;

  /*
   * Expired task is a task that should have been already executed. Designed to
   * be called in the event pipeline after an event is dispatched to React.
   * React may schedule events with immediate priority which need to be handled
   * before the next event is sent to React.
   *
   * Thread synchronization must be enforced externally.
   */
  void callExpiredTasks(jsi::Runtime &runtime) override;

  void scheduleRenderingUpdate(SurfaceId surfaceId, RuntimeSchedulerRenderingUpdate &&renderingUpdate) override;

  void setShadowTreeRevisionConsistencyManager(
      ShadowTreeRevisionConsistencyManager *shadowTreeRevisionConsistencyManager) override;

  void setPerformanceEntryReporter(PerformanceEntryReporter *performanceEntryReporter) override;

  void setEventTimingDelegate(RuntimeSchedulerEventTimingDelegate *eventTimingDelegate) override;

  void setIntersectionObserverDelegate(
      RuntimeSchedulerIntersectionObserverDelegate *intersectionObserverDelegate) override;

 private:
  std::priority_queue<std::shared_ptr<Task>, std::vector<std::shared_ptr<Task>>, TaskPriorityComparer> taskQueue_;

  const RuntimeExecutor runtimeExecutor_;
  SchedulerPriority currentPriority_{SchedulerPriority::NormalPriority};

  /*
   * Counter indicating how many access to the runtime have been requested.
   */
  std::atomic<uint_fast8_t> runtimeAccessRequests_{0};

  std::atomic_bool isSynchronous_{false};

  void startWorkLoop(jsi::Runtime &runtime);

  /*
   * Schedules a work loop unless it has been already scheduled
   * This is to avoid unnecessary calls to `runtimeExecutor`.
   */
  void scheduleWorkLoopIfNecessary();

  void executeTask(jsi::Runtime &runtime, const std::shared_ptr<Task> &task, bool didUserCallbackTimeout);

  /*
   * Returns a time point representing the current point in time. May be called
   * from multiple threads.
   */
  std::function<HighResTimeStamp()> now_;

  /*
   * Flag indicating if callback on JavaScript queue has been
   * scheduled.
   */
  std::atomic_bool isWorkLoopScheduled_{false};

  /*
   * This flag is set while performing work, to prevent re-entrancy.
   */
  std::atomic_bool isPerformingWork_{false};

  std::atomic<ShadowTreeRevisionConsistencyManager *> shadowTreeRevisionConsistencyManager_{nullptr};

  RuntimeSchedulerTaskErrorHandler onTaskError_;
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH
