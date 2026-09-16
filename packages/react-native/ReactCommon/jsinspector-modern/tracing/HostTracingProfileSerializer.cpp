/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTracingProfileSerializer.h"
#include "RuntimeSamplingProfileTraceEventSerializer.h"
#include "TraceEventGenerator.h"
#include "TraceEventSerializer.h"

#include <algorithm>

namespace facebook::react::jsinspector_modern::tracing {

namespace {

/**
 * Hardcoded layer tree ID for all recorded frames.
 * https://chromedevtools.github.io/devtools-protocol/tot/LayerTree/
 */
constexpr int FALLBACK_LAYER_TREE_ID = 1;

// Default vsync interval (60 Hz), used as a fallback when the device's
// actual refresh rate is unknown (e.g. the initial synthetic frame).
const auto DEFAULT_VSYNC_INTERVAL =
    HighResDuration::fromNanoseconds(16'667'000);

} // namespace

/* static */ void HostTracingProfileSerializer::emitAsDataCollectedChunks(
    HostTracingProfile&& hostTracingProfile,
    const std::function<void(folly::dynamic&&)>& chunkCallback,
    size_t maxChunkBytes,
    uint16_t profileTraceEventsChunkSize) {
  emitFrameTimings(
      std::move(hostTracingProfile.frameTimings),
      hostTracingProfile.processId,
      hostTracingProfile.startTime,
      chunkCallback,
      maxChunkBytes);

  auto instancesProfiles =
      std::move(hostTracingProfile.instanceTracingProfiles);
  IdGenerator profileIdGenerator;

  for (auto& instanceProfile : instancesProfiles) {
    emitPerformanceTraceEvents(
        std::move(instanceProfile.performanceTraceEvents),
        chunkCallback,
        maxChunkBytes);
  }

  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(hostTracingProfile.runtimeSamplingProfiles),
      profileIdGenerator,
      hostTracingProfile.startTime,
      chunkCallback,
      profileTraceEventsChunkSize);
}

/* static */ void HostTracingProfileSerializer::emitPerformanceTraceEvents(
    std::vector<TraceEvent>&& events,
    const std::function<void(folly::dynamic&&)>& chunkCallback,
    size_t maxChunkBytes) {
  folly::dynamic chunk = folly::dynamic::array();
  size_t currentChunkBytes = 0;

  for (auto& event : events) {
    auto serializedEvent = TraceEventSerializer::serialize(std::move(event));
    size_t eventBytes = TraceEventSerializer::estimateJsonSize(serializedEvent);

    if (currentChunkBytes + eventBytes > maxChunkBytes && !chunk.empty()) {
      chunkCallback(std::move(chunk));
      chunk = folly::dynamic::array();
      currentChunkBytes = 0;
    }

    chunk.push_back(std::move(serializedEvent));
    currentChunkBytes += eventBytes;
  }

  if (!chunk.empty()) {
    chunkCallback(std::move(chunk));
  }
}

/* static */ void HostTracingProfileSerializer::emitFrameTimings(
    std::vector<FrameTimingSequence>&& frameTimings,
    ProcessId processId,
    HighResTimeStamp recordingStartTimestamp,
    const std::function<void(folly::dynamic&& chunk)>& chunkCallback,
    size_t maxChunkBytes) {
  if (frameTimings.empty()) {
    return;
  }

  folly::dynamic chunk = folly::dynamic::array();
  size_t currentChunkBytes = 0;

  auto setLayerTreeIdEvent = TraceEventGenerator::createSetLayerTreeIdEvent(
      "", // Hardcoded frame name for the default (and only) layer.
      FALLBACK_LAYER_TREE_ID,
      processId,
      frameTimings.front().threadId,
      recordingStartTimestamp);
  auto serializedSetLayerTreeId =
      TraceEventSerializer::serialize(std::move(setLayerTreeIdEvent));
  currentChunkBytes +=
      TraceEventSerializer::estimateJsonSize(serializedSetLayerTreeId);
  chunk.push_back(std::move(serializedSetLayerTreeId));

  // Filter out frames that started before recording began. On Android,
  // FrameMetrics may deliver frames from app startup that predate the recording
  // session; on iOS the first CADisplayLink callback reports sender.timestamp
  // (the previous vsync) which can be before the recording start. These would
  // otherwise appear as large pre-recording render frames in the timeline.
  frameTimings.erase(
      std::remove_if(
          frameTimings.begin(),
          frameTimings.end(),
          [&recordingStartTimestamp](const FrameTimingSequence& ft) {
            return ft.beginTimestamp < recordingStartTimestamp;
          }),
      frameTimings.end());

  if (frameTimings.empty()) {
    chunkCallback(std::move(chunk));
    return;
  }

  // Sort frames by beginTimestamp to handle out-of-order arrivals caused by
  // async screenshot encoding. The initial synthetic frame may arrive in the
  // buffer after real frames because its screenshot encoding takes longer than
  // one vsync (~16ms). Sorting ensures the idle-gap detection loop below sees
  // frames in chronological order.
  std::sort(
      frameTimings.begin(),
      frameTimings.end(),
      [](const FrameTimingSequence& a, const FrameTimingSequence& b) {
        return a.beginTimestamp < b.beginTimestamp;
      });

  // Compute the next available sequence ID for synthetic frames (idle frames
  // and dropped frames).
  FrameSequenceId nextSyntheticSeqId = 0;
  for (const auto& ft : frameTimings) {
    nextSyntheticSeqId = std::max(nextSyntheticSeqId, ft.id + 1);
  }

  std::optional<HighResTimeStamp> prevEndTimestamp;

  for (auto&& frameTimingSequence : frameTimings) {
    // Serialize all events for this frame.
    folly::dynamic frameEvents = folly::dynamic::array();
    size_t totalFrameBytes = 0;

    // Detect idle period: gap between previous frame's end and this frame's
    // begin exceeding one vsync interval. Emit NeedsBeginFrameChanged +
    // BeginFrame to fill the gap. Chrome DevTools renders a BeginFrame
    // without a corresponding DrawFrame as an "Idle frame".
    auto minIdleGap =
        frameTimingSequence.vsyncInterval > HighResDuration::zero()
        ? frameTimingSequence.vsyncInterval
        : DEFAULT_VSYNC_INTERVAL;
    if (prevEndTimestamp.has_value() &&
        (frameTimingSequence.beginTimestamp - *prevEndTimestamp) > minIdleGap) {
      auto needsBeginFrameEvent =
          TraceEventGenerator::createNeedsBeginFrameChangedEvent(
              FALLBACK_LAYER_TREE_ID,
              *prevEndTimestamp,
              processId,
              frameTimingSequence.threadId);
      auto serializedNeedsBeginFrame =
          TraceEventSerializer::serialize(std::move(needsBeginFrameEvent));
      totalFrameBytes +=
          TraceEventSerializer::estimateJsonSize(serializedNeedsBeginFrame);
      frameEvents.push_back(std::move(serializedNeedsBeginFrame));

      auto idleBeginEvent = TraceEventGenerator::createIdleBeginFrameEvent(
          nextSyntheticSeqId++,
          FALLBACK_LAYER_TREE_ID,
          *prevEndTimestamp,
          processId,
          frameTimingSequence.threadId);

      auto serializedIdleBegin =
          TraceEventSerializer::serialize(std::move(idleBeginEvent));
      totalFrameBytes +=
          TraceEventSerializer::estimateJsonSize(serializedIdleBegin);
      frameEvents.push_back(std::move(serializedIdleBegin));
    }

    auto [beginDrawingEvent, endDrawingEvent] =
        TraceEventGenerator::createFrameTimingsEvents(
            frameTimingSequence.id,
            FALLBACK_LAYER_TREE_ID,
            frameTimingSequence.beginTimestamp,
            frameTimingSequence.endTimestamp,
            processId,
            frameTimingSequence.threadId);

    auto serializedBegin =
        TraceEventSerializer::serialize(std::move(beginDrawingEvent));
    totalFrameBytes += TraceEventSerializer::estimateJsonSize(serializedBegin);
    frameEvents.push_back(std::move(serializedBegin));

    auto serializedEnd =
        TraceEventSerializer::serialize(std::move(endDrawingEvent));
    totalFrameBytes += TraceEventSerializer::estimateJsonSize(serializedEnd);
    frameEvents.push_back(std::move(serializedEnd));

    if (frameTimingSequence.screenshot.has_value()) {
      auto screenshotEvent = TraceEventGenerator::createScreenshotEvent(
          frameTimingSequence.id,
          FALLBACK_LAYER_TREE_ID,
          std::move(frameTimingSequence.screenshot.value()),
          frameTimingSequence.endTimestamp,
          processId,
          frameTimingSequence.threadId);

      auto serializedScreenshot =
          TraceEventSerializer::serialize(std::move(screenshotEvent));
      totalFrameBytes +=
          TraceEventSerializer::estimateJsonSize(serializedScreenshot);
      frameEvents.push_back(std::move(serializedScreenshot));
    }

    // Flush current chunk if adding this frame would exceed the limit.
    if (currentChunkBytes + totalFrameBytes > maxChunkBytes && !chunk.empty()) {
      chunkCallback(std::move(chunk));
      chunk = folly::dynamic::array();
      currentChunkBytes = 0;
    }

    for (auto& frameEvent : frameEvents) {
      chunk.push_back(std::move(frameEvent));
    }
    currentChunkBytes += totalFrameBytes;

    prevEndTimestamp = frameTimingSequence.endTimestamp;
  }

  if (!chunk.empty()) {
    chunkCallback(std::move(chunk));
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
