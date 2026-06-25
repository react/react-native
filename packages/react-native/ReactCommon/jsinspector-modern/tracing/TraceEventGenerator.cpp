/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TraceEventGenerator.h"
#include "Timing.h"
#include "TracingCategory.h"

#include <react/utils/Base64.h>

namespace facebook::react::jsinspector_modern::tracing {

/* static */ TraceEvent TraceEventGenerator::createSetLayerTreeIdEvent(
    std::string frame,
    int layerTreeId,
    ProcessId processId,
    ThreadId threadId,
    HighResTimeStamp timestamp) {
  folly::dynamic data = folly::dynamic::object("frame", std::move(frame))(
      "layerTreeId", layerTreeId);

  return TraceEvent{
      .name = "SetLayerTreeId",
      .cat = {Category::HiddenTimeline},
      .ph = 'I',
      .ts = timestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = folly::dynamic::object("data", std::move(data)),
  };
}

/* static */ std::pair<TraceEvent, TraceEvent>
TraceEventGenerator::createFrameTimingsEvents(
    uint64_t sequenceId,
    int layerTreeId,
    HighResTimeStamp beginTimestamp,
    HighResTimeStamp endTimestamp,
    ProcessId processId,
    ThreadId threadId) {
  folly::dynamic args = folly::dynamic::object("frameSeqId", sequenceId)(
      "layerTreeId", layerTreeId);

  auto beginEvent = TraceEvent{
      .name = "BeginFrame",
      .cat = {Category::Frame},
      .ph = 'I',
      .ts = beginTimestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = args,
  };
  auto drawEvent = TraceEvent{
      .name = "DrawFrame",
      .cat = {Category::Frame},
      .ph = 'I',
      .ts = endTimestamp,
      .pid = processId,
      .s = 't',
      .tid = threadId,
      .args = args,
  };

  return {std::move(beginEvent), std::move(drawEvent)};
}

/* static */ TraceEvent TraceEventGenerator::createScreenshotEvent(
    FrameSequenceId frameSequenceId,
    int sourceId,
    std::vector<uint8_t>&& snapshot,
    HighResTimeStamp expectedDisplayTime,
    ProcessId processId,
    ThreadId threadId) {
  // Convert binary data to string for Base64 encoding
  std::string snapshotBytes(snapshot.begin(), snapshot.end());
  std::string base64Snapshot = base64Encode(snapshotBytes);

  folly::dynamic args =
      folly::dynamic::object("snapshot", std::move(base64Snapshot))(
          "source_id", sourceId)("frame_sequence", frameSequenceId)(
          "expected_display_time",
          highResTimeStampToTracingClockTimeStamp(expectedDisplayTime));

  return TraceEvent{
      .name = "Screenshot",
      .cat = {Category::Screenshot},
      .ph = 'O',
      .ts = expectedDisplayTime,
      .pid = processId,
      .tid = threadId,
      .args = std::move(args),
  };
}

}; // namespace facebook::react::jsinspector_modern::tracing
