/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTargetTraceRecording.h"
#include "HostTarget.h"

#include <oscompat/OSCompat.h>

namespace facebook::react::jsinspector_modern {

HostTargetTraceRecording::HostTargetTraceRecording(
    HostTarget& hostTarget,
    tracing::Mode tracingMode,
    std::set<tracing::Category> enabledCategories,
    std::optional<HighResDuration> windowSize)
    : hostTarget_(hostTarget),
      tracingMode_(tracingMode),
      enabledCategories_(std::move(enabledCategories)),
      windowSize_(windowSize) {
  if (windowSize) {
    frameTimings_ = tracing::TimeWindowedBuffer<tracing::FrameTimingSequence>(
        [](auto& sequence) { return sequence.beginTimestamp; }, *windowSize);
  } else {
    frameTimings_ = tracing::TimeWindowedBuffer<tracing::FrameTimingSequence>();
  };
}

void HostTargetTraceRecording::setTracedInstance(
    InstanceTarget* instanceTarget) {
  // If HostTracingAgent is allocated, it means that there is an active tracing
  // recording session.
  if (hostTracingAgent_ != nullptr) {
    hostTracingAgent_->setTracedInstance(instanceTarget);
  }
}

void HostTargetTraceRecording::start() {
  assert(
      hostTracingAgent_ == nullptr &&
      "Tracing Agent for the HostTarget was already initialized.");

  startTime_ = HighResTimeStamp::now();
  state_ = tracing::TraceRecordingState(
      tracingMode_, enabledCategories_, windowSize_);
  hostTracingAgent_ = hostTarget_.createTracingAgent(*state_);
}

tracing::HostTracingProfile HostTargetTraceRecording::stop() {
  assert(
      hostTracingAgent_ != nullptr &&
      "TracingAgent for the HostTarget has not been initialized.");
  hostTracingAgent_.reset();

  assert(
      state_.has_value() &&
      "The state for this tracing session has not been initialized.");
  auto state = std::move(*state_);
  state_.reset();

  auto startTime = *startTime_;
  startTime_.reset();

  return tracing::HostTracingProfile{
      .processId = oscompat::getCurrentProcessId(),
      .startTime = startTime,
      .frameTimings = frameTimings_.pruneExpiredAndExtract(),
      .instanceTracingProfiles = std::move(state.instanceTracingProfiles),
      .runtimeSamplingProfiles = std::move(state.runtimeSamplingProfiles),
  };
}

void HostTargetTraceRecording::recordFrameTimings(
    tracing::FrameTimingSequence frameTimingSequence) {
  assert(
      state_.has_value() &&
      "The state for this tracing session has not been initialized.");

  frameTimings_.push(frameTimingSequence);
}

} // namespace facebook::react::jsinspector_modern
