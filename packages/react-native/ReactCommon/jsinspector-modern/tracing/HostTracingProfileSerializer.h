/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "FrameTimingSequence.h"
#include "HostTracingProfile.h"
#include "TraceEvent.h"

#include <folly/dynamic.h>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * A serializer for HostTracingProfile that can be used for transforming the
 * profile into sequence of serialized Trace Events.
 */
class HostTracingProfileSerializer {
 public:
  /**
   * Transforms the profile into a sequence of serialized Trace Events, which
   * is split in chunks of at most \p maxChunkBytes serialized bytes or
   * \p profileTraceEventsChunkSize events, depending on type, and sent with
   * \p chunkCallback.
   */
  static void emitAsDataCollectedChunks(
      HostTracingProfile &&hostTracingProfile,
      const std::function<void(folly::dynamic &&chunk)> &chunkCallback,
      size_t maxChunkBytes,
      uint16_t profileTraceEventsChunkSize);

  static void emitPerformanceTraceEvents(
      std::vector<TraceEvent> &&events,
      const std::function<void(folly::dynamic &&chunk)> &chunkCallback,
      size_t maxChunkBytes);

  static void emitFrameTimings(
      std::vector<FrameTimingSequence> &&frameTimings,
      ProcessId processId,
      HighResTimeStamp recordingStartTimestamp,
      const std::function<void(folly::dynamic &&chunk)> &chunkCallback,
      size_t maxChunkBytes);
};

} // namespace facebook::react::jsinspector_modern::tracing
