/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <jsi/hermes-interfaces.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/renderer/consistency/ShadowTreeRevisionConsistencyManager.h>
#include <react/renderer/runtimescheduler/SchedulerPriorityUtils.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <react/timing/primitives.h>
#include "RuntimeSchedulerEventTimingDelegate.h"
#include "RuntimeSchedulerIntersectionObserverDelegate.h"

namespace facebook::react {

using RuntimeSchedulerRenderingUpdate = std::function<void()>;
using SurfaceId = int32_t;

using RuntimeSchedulerTaskErrorHandler = std::function<void(jsi::Runtime &runtime, jsi::JSError &error)>;

extern const char RuntimeSchedulerKey[];

// This is a temporary abstract class for RuntimeScheduler forks to implement
// (and use them interchangeably).
class RuntimeSchedulerBase : public facebook::hermes::IEventLoopControl {
 public:
  virtual ~RuntimeSchedulerBase() = default;

  using facebook::hermes::IEventLoopControl::scheduleTask;

  virtual void scheduleWork(RawCallback &&callback) noexcept = 0;
  virtual void executeNowOnTheSameThread(RawCallback &&callback) = 0;
  virtual std::shared_ptr<Task> scheduleTask(SchedulerPriority priority, jsi::Function &&callback) noexcept = 0;
  virtual std::shared_ptr<Task> scheduleTask(SchedulerPriority priority, RawCallback &&callback) noexcept = 0;
  virtual std::shared_ptr<Task> scheduleIdleTask(
      jsi::Function &&callback,
      HighResDuration timeout = timeoutForSchedulerPriority(SchedulerPriority::IdlePriority)) noexcept = 0;
  virtual std::shared_ptr<Task> scheduleIdleTask(
      RawCallback &&callback,
      HighResDuration timeout = timeoutForSchedulerPriority(SchedulerPriority::IdlePriority)) noexcept = 0;
  virtual void cancelTask(Task &task) noexcept = 0;
  virtual bool getShouldYield() noexcept = 0;
  virtual SchedulerPriority getCurrentPriorityLevel() const noexcept = 0;
  virtual HighResTimeStamp now() const noexcept = 0;
  virtual void callExpiredTasks(jsi::Runtime &runtime) = 0;
  virtual void scheduleRenderingUpdate(SurfaceId surfaceId, RuntimeSchedulerRenderingUpdate &&renderingUpdate) = 0;
  virtual void setShadowTreeRevisionConsistencyManager(ShadowTreeRevisionConsistencyManager *provider) = 0;
  virtual void setPerformanceEntryReporter(PerformanceEntryReporter *reporter) = 0;
  virtual void setEventTimingDelegate(RuntimeSchedulerEventTimingDelegate *eventTimingDelegate) = 0;
  virtual void setIntersectionObserverDelegate(
      RuntimeSchedulerIntersectionObserverDelegate *intersectionObserverDelegate) = 0;
};

// This is a proxy for RuntimeScheduler implementation, which will be selected
// at runtime based on a feature flag.
class RuntimeScheduler final : public RuntimeSchedulerBase {
 public:
  explicit RuntimeScheduler(
      RuntimeExecutor runtimeExecutor,
      std::function<HighResTimeStamp()> now = HighResTimeStamp::now,
      RuntimeSchedulerTaskErrorHandler onTaskError = handleTaskErrorDefault);

  /*
   * Not copyable.
   */
  RuntimeScheduler(const RuntimeScheduler &) = delete;
  RuntimeScheduler &operator=(const RuntimeScheduler &) = delete;

  /*
   * Not movable.
   */
  RuntimeScheduler(RuntimeScheduler &&) = delete;
  RuntimeScheduler &operator=(RuntimeScheduler &&) = delete;

  void scheduleWork(RawCallback &&callback) noexcept override;

  /// IEventLoopControl implementation, forwarded to the underlying fork.
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

  std::shared_ptr<Task> scheduleIdleTask(
      jsi::Function &&callback,
      HighResDuration timeout = timeoutForSchedulerPriority(SchedulerPriority::IdlePriority)) noexcept override;

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

  void setPerformanceEntryReporter(PerformanceEntryReporter *reporter) override;

  void setEventTimingDelegate(RuntimeSchedulerEventTimingDelegate *eventTimingDelegate) override;

  void setIntersectionObserverDelegate(
      RuntimeSchedulerIntersectionObserverDelegate *intersectionObserverDelegate) override;

 private:
  // Actual implementation, stored as a unique pointer to simplify memory
  // management.
  std::unique_ptr<RuntimeSchedulerBase> runtimeSchedulerImpl_;

  static void handleTaskErrorDefault(jsi::Runtime &runtime, jsi::JSError &error);
};

} // namespace facebook::react
