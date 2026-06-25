/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TraceEvent.h"

#include <jsinspector-modern/tracing/FrameTimingSequence.h>
#include <react/timing/primitives.h>

#include <cstdint>
#include <utility>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * This class encapsulates the logic for generating canonical trace events that will be serialized and sent as part of
 * Tracing.dataCollected CDP message.
 */
class TraceEventGenerator {
 public:
  /**
   * Creates canonical "SetLayerTreeId" trace event.
   */
  static TraceEvent createSetLayerTreeIdEvent(
      std::string frame,
      int layerTreeId,
      ProcessId processId,
      ThreadId threadId,
      HighResTimeStamp timestamp);

  /**
   * Creates canonical "BeginFrame", "Commit", "DrawFrame" trace events.
   */
  static std::pair<TraceEvent, TraceEvent> createFrameTimingsEvents(
      FrameSequenceId sequenceId,
      int layerTreeId,
      HighResTimeStamp beginTimestamp,
      HighResTimeStamp endTimestamp,
      ProcessId processId,
      ThreadId threadId);

  /**
   * Creates canonical "Screenshot" trace event.
   */
  static TraceEvent createScreenshotEvent(
      FrameSequenceId frameSequenceId,
      int sourceId,
      std::vector<uint8_t> &&snapshot,
      HighResTimeStamp expectedDisplayTime,
      ProcessId processId,
      ThreadId threadId);
};

}; // namespace facebook::react::jsinspector_modern::tracing
