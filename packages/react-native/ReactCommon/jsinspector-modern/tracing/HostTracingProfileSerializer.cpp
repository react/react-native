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

namespace facebook::react::jsinspector_modern::tracing {

namespace {

/**
 * Hardcoded layer tree ID for all recorded frames.
 * https://chromedevtools.github.io/devtools-protocol/tot/LayerTree/
 */
constexpr int FALLBACK_LAYER_TREE_ID = 1;

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

  for (auto&& frameTimingSequence : frameTimings) {
    // Serialize all events for this frame.
    folly::dynamic frameEvents = folly::dynamic::array();
    size_t totalFrameBytes = 0;

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
  }

  if (!chunk.empty()) {
    chunkCallback(std::move(chunk));
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
