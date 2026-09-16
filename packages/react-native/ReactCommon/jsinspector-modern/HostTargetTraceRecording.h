/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include "HostAgent.h"
#include "HostTarget.h"
#include "InstanceTarget.h"

#include <jsinspector-modern/tracing/FrameTimingSequence.h>
#include <jsinspector-modern/tracing/HostTracingProfile.h>
#include <jsinspector-modern/tracing/TimeWindowedBuffer.h>
#include <jsinspector-modern/tracing/TraceRecordingState.h>
#include <jsinspector-modern/tracing/TracingCategory.h>
#include <react/timing/primitives.h>

#include <optional>
#include <set>

namespace facebook::react::jsinspector_modern {

/**
 * A local representation of the Tracing "session".
 *
 * Owned by the HostTarget and should only be allocated during an active
 * recording.
 *
 * Owns all allocated Tracing Agents. A single Target can have a single active
 * Tracing Agent, but only as a std::weak_ptr.
 */
class HostTargetTraceRecording {
 public:
  HostTargetTraceRecording(
      HostTarget &hostTarget,
      tracing::Mode tracingMode,
      std::set<tracing::Category> enabledCategories,
      std::optional<HighResDuration> windowSize = std::nullopt);

  inline bool isBackgroundInitiated() const
  {
    return tracingMode_ == tracing::Mode::Background;
  }

  inline bool isUserInitiated() const
  {
    return tracingMode_ == tracing::Mode::CDP;
  }

  /**
   * Updates the current traced Instance for this recording.
   */
  void setTracedInstance(InstanceTarget *instanceTarget);

  /**
   * Starts the recording.
   *
   * Will allocate all Tracing Agents for all currently registered Targets.
   */
  void start();

  /**
   * Stops the recording and returns the recorded HostTracingProfile.
   *
   * Will deallocate all Tracing Agents.
   */
  tracing::HostTracingProfile stop();

  /**
   * Adds the frame timing sequence to the current state of this trace recording.
   *
   * The caller guarantees the protection from data races. This is protected by the tracing mutex in HostTarget.
   */
  void recordFrameTimings(tracing::FrameTimingSequence frameTimingSequence);

 private:
  /**
   * The Host for which this Trace Recording is going to happen.
   */
  HostTarget &hostTarget_;

  /**
   * The mode in which this trace recording was initialized.
   */
  tracing::Mode tracingMode_;

  /**
   * The timestamp at which this Trace Recording started.
   */
  std::optional<HighResTimeStamp> startTime_;

  /**
   * The state of the current Trace Recording.
   * Only allocated if the recording is enabled.
   */
  std::optional<tracing::TraceRecordingState> state_;

  /**
   * The TracingAgent of the targeted Host.
   * Only allocated if the recording is enabled.
   */
  std::shared_ptr<HostTracingAgent> hostTracingAgent_;

  /**
   * The list of categories that are enabled for this recording.
   */
  std::set<tracing::Category> enabledCategories_;

  /**
   * The size of the time window for this recording.
   */
  std::optional<HighResDuration> windowSize_;

  /**
   * Frame timings captured on the Host side.
   */
  tracing::TimeWindowedBuffer<tracing::FrameTimingSequence> frameTimings_;
};

} // namespace facebook::react::jsinspector_modern
