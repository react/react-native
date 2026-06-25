/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTarget.h"
#include "HostTargetTraceRecording.h"

namespace facebook::react::jsinspector_modern {

namespace {

// The size of the timeline for the trace recording that happened in the
// background.
constexpr HighResDuration kBackgroundTraceWindowSize =
    HighResDuration::fromMilliseconds(20000);

} // namespace

bool HostTargetController::startTracing(
    tracing::Mode tracingMode,
    std::set<tracing::Category> enabledCategories) {
  return target_.startTracing(tracingMode, std::move(enabledCategories));
}

tracing::HostTracingProfile HostTargetController::stopTracing() {
  return target_.stopTracing();
}

std::shared_ptr<HostTracingAgent> HostTarget::createTracingAgent(
    tracing::TraceRecordingState& state) {
  auto agent = std::make_shared<HostTracingAgent>(state);
  agent->setTracedInstance(currentInstance_.get());
  return agent;
}

bool HostTarget::startTracing(
    tracing::Mode tracingMode,
    std::set<tracing::Category> enabledCategories) {
  std::lock_guard lock(tracingMutex_);

  if (traceRecording_ != nullptr) {
    if (traceRecording_->isBackgroundInitiated() &&
        tracingMode == tracing::Mode::CDP) {
      if (auto tracingDelegate = delegate_.getTracingDelegate()) {
        tracingDelegate->onTracingStopped();
      }

      traceRecording_->stop();
      traceRecording_.reset();
    } else {
      return false;
    }
  }

  auto timeWindow = tracingMode == tracing::Mode::Background
      ? std::make_optional(kBackgroundTraceWindowSize)
      : std::nullopt;
  auto screenshotsCategoryEnabled =
      enabledCategories.contains(tracing::Category::Screenshot);

  traceRecording_ = std::make_unique<HostTargetTraceRecording>(
      *this, tracingMode, std::move(enabledCategories), timeWindow);
  traceRecording_->setTracedInstance(currentInstance_.get());
  traceRecording_->start();

  if (auto tracingDelegate = delegate_.getTracingDelegate()) {
    tracingDelegate->onTracingStarted(tracingMode, screenshotsCategoryEnabled);
  }

  return true;
}

tracing::HostTracingProfile HostTarget::stopTracing() {
  std::lock_guard lock(tracingMutex_);

  assert(traceRecording_ != nullptr && "No tracing in progress");

  if (auto tracingDelegate = delegate_.getTracingDelegate()) {
    tracingDelegate->onTracingStopped();
  }

  auto profile = traceRecording_->stop();
  traceRecording_.reset();

  return profile;
}

void HostTarget::recordFrameTimings(
    tracing::FrameTimingSequence frameTimingSequence) {
  std::lock_guard lock(tracingMutex_);

  if (traceRecording_) {
    traceRecording_->recordFrameTimings(std::move(frameTimingSequence));
  } else {
    assert(
        false &&
        "The HostTarget is not being profiled. Did you call recordFrameTimings() from the native Host side when there is no tracing in progress?");
  }
}

} // namespace facebook::react::jsinspector_modern
