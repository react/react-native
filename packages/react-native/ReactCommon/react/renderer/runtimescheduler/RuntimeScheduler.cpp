/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"
#include "RuntimeScheduler_Modern.h"
#ifndef RCT_REMOVE_LEGACY_ARCH
#include "RuntimeScheduler_Legacy.h"
#endif

#include <cxxreact/ErrorUtils.h>
#include <cxxreact/TraceSection.h>
#ifndef RCT_REMOVE_LEGACY_ARCH
#include <react/featureflags/ReactNativeFeatureFlags.h>
#endif
#include <utility>

namespace facebook::react {

extern const char RuntimeSchedulerKey[] = "RuntimeScheduler";

namespace {
std::unique_ptr<RuntimeSchedulerBase> getRuntimeSchedulerImplementation(
    RuntimeExecutor runtimeExecutor,
    std::function<HighResTimeStamp()> now,
    RuntimeSchedulerTaskErrorHandler onTaskError) {
#ifndef RCT_REMOVE_LEGACY_ARCH
  if (ReactNativeFeatureFlags::enableBridgelessArchitecture()) {
#endif
    return std::make_unique<RuntimeScheduler_Modern>(
        std::move(runtimeExecutor), std::move(now), std::move(onTaskError));
#ifndef RCT_REMOVE_LEGACY_ARCH
  } else {
    return std::make_unique<RuntimeScheduler_Legacy>(
        std::move(runtimeExecutor), std::move(now), std::move(onTaskError));
  }
#endif
}

} // namespace

RuntimeScheduler::RuntimeScheduler(
    RuntimeExecutor runtimeExecutor,
    std::function<HighResTimeStamp()> now,
    RuntimeSchedulerTaskErrorHandler onTaskError)
    : runtimeSchedulerImpl_(getRuntimeSchedulerImplementation(
          std::move(runtimeExecutor),
          std::move(now),
          std::move(onTaskError))) {}

/* static */ void RuntimeScheduler::handleTaskErrorDefault(
    jsi::Runtime& runtime,
    jsi::JSError& error) {
  handleJSError(runtime, error, true);
}

void RuntimeScheduler::scheduleWork(RawCallback&& callback) noexcept {
  return runtimeSchedulerImpl_->scheduleWork(std::move(callback));
}

void RuntimeScheduler::scheduleTask(const std::function<void()>& task) {
  return runtimeSchedulerImpl_->scheduleTask(task);
}

uint64_t RuntimeScheduler::registerTaskQueueSource() {
  return runtimeSchedulerImpl_->registerTaskQueueSource();
}

void RuntimeScheduler::unregisterTaskQueueSource(uint64_t sourceId) {
  return runtimeSchedulerImpl_->unregisterTaskQueueSource(sourceId);
}

std::shared_ptr<Task> RuntimeScheduler::scheduleTask(
    SchedulerPriority priority,
    jsi::Function&& callback) noexcept {
  return runtimeSchedulerImpl_->scheduleTask(priority, std::move(callback));
}

std::shared_ptr<Task> RuntimeScheduler::scheduleTask(
    SchedulerPriority priority,
    RawCallback&& callback) noexcept {
  return runtimeSchedulerImpl_->scheduleTask(priority, std::move(callback));
}

std::shared_ptr<Task> RuntimeScheduler::scheduleIdleTask(
    jsi::Function&& callback,
    HighResDuration timeout) noexcept {
  return runtimeSchedulerImpl_->scheduleIdleTask(std::move(callback), timeout);
}

std::shared_ptr<Task> RuntimeScheduler::scheduleIdleTask(
    RawCallback&& callback,
    HighResDuration timeout) noexcept {
  return runtimeSchedulerImpl_->scheduleIdleTask(std::move(callback), timeout);
}

bool RuntimeScheduler::getShouldYield() noexcept {
  return runtimeSchedulerImpl_->getShouldYield();
}

void RuntimeScheduler::cancelTask(Task& task) noexcept {
  return runtimeSchedulerImpl_->cancelTask(task);
}

SchedulerPriority RuntimeScheduler::getCurrentPriorityLevel() const noexcept {
  return runtimeSchedulerImpl_->getCurrentPriorityLevel();
}

HighResTimeStamp RuntimeScheduler::now() const noexcept {
  return runtimeSchedulerImpl_->now();
}

void RuntimeScheduler::executeNowOnTheSameThread(RawCallback&& callback) {
  return runtimeSchedulerImpl_->executeNowOnTheSameThread(std::move(callback));
}

void RuntimeScheduler::callExpiredTasks(jsi::Runtime& runtime) {
  return runtimeSchedulerImpl_->callExpiredTasks(runtime);
}

void RuntimeScheduler::scheduleRenderingUpdate(
    SurfaceId surfaceId,
    RuntimeSchedulerRenderingUpdate&& renderingUpdate) {
  return runtimeSchedulerImpl_->scheduleRenderingUpdate(
      surfaceId, std::move(renderingUpdate));
}

void RuntimeScheduler::setShadowTreeRevisionConsistencyManager(
    ShadowTreeRevisionConsistencyManager*
        shadowTreeRevisionConsistencyManager) {
  return runtimeSchedulerImpl_->setShadowTreeRevisionConsistencyManager(
      shadowTreeRevisionConsistencyManager);
}

void RuntimeScheduler::setPerformanceEntryReporter(
    PerformanceEntryReporter* performanceEntryReporter) {
  return runtimeSchedulerImpl_->setPerformanceEntryReporter(
      performanceEntryReporter);
}

void RuntimeScheduler::setEventTimingDelegate(
    RuntimeSchedulerEventTimingDelegate* eventTimingDelegate) {
  return runtimeSchedulerImpl_->setEventTimingDelegate(eventTimingDelegate);
}

void RuntimeScheduler::setIntersectionObserverDelegate(
    RuntimeSchedulerIntersectionObserverDelegate*
        intersectionObserverDelegate) {
  return runtimeSchedulerImpl_->setIntersectionObserverDelegate(
      intersectionObserverDelegate);
}

} // namespace facebook::react
