/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include "ConsoleTimeStamp.h"
#include "TraceEvent.h"
#include "TraceEventProfile.h"

#include <react/timing/primitives.h>

#include <folly/dynamic.h>
#include <atomic>
#include <functional>
#include <map>
#include <mutex>
#include <optional>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

// TODO: Review how this API is integrated into jsinspector_modern (singleton
// design is copied from earlier FuseboxTracer prototype).

using Headers = std::map<std::string, std::string>;

/**
 * [Experimental] An interface for logging performance trace events to the
 * modern debugger server.
 */
class PerformanceTracer {
 public:
  static PerformanceTracer &getInstance();

  /**
   * Starts a tracing session. Returns `false` if already tracing.
   */
  bool startTracing();

  /**
   * Starts a tracing session with a maximum duration (events older than this
   * duration are dropped). Returns `false` if already tracing.
   */
  bool startTracing(HighResDuration maxDuration);

  /**
   * If there is a current tracing session, it stops tracing and returns all
   * collected events. Otherwise, it returns empty.
   */
  std::optional<std::vector<TraceEvent>> stopTracing();

  /**
   * Returns whether the tracer is currently tracing. This can be useful to
   * avoid doing expensive work (like formatting strings) if tracing is not
   * enabled.
   */
  inline bool isTracing() const
  {
    return tracingAtomic_;
  }

  /**
   * Record a `Performance.mark()` event - a labelled timestamp. If not
   * currently tracing, this is a no-op.
   *
   * See https://w3c.github.io/user-timing/#mark-method.
   */
  void reportMark(const std::string &name, HighResTimeStamp start, folly::dynamic &&detail = nullptr);

  /**
   * Record a `Performance.measure()` event - a labelled duration. If not
   * currently tracing, this is a no-op.
   *
   * See https://w3c.github.io/user-timing/#measure-method.
   */
  void reportMeasure(
      const std::string &name,
      HighResTimeStamp start,
      HighResDuration duration,
      folly::dynamic &&detail = nullptr,
      std::optional<folly::dynamic> stackTrace = nullptr);

  /**
   * Record a "TimeStamp" Trace Event - a labelled entry on Performance
   * timeline. The only required argument is `name`. Optional arguments, if not
   * provided, won't be recorded in the serialized Trace Event.
   * @see
   https://developer.chrome.com/docs/devtools/performance/extension#inject_your_data_with_consoletimestamp
   */
  void reportTimeStamp(
      const std::string &name,
      std::optional<ConsoleTimeStampEntry> start = std::nullopt,
      std::optional<ConsoleTimeStampEntry> end = std::nullopt,
      std::optional<std::string> trackName = std::nullopt,
      std::optional<std::string> trackGroup = std::nullopt,
      std::optional<ConsoleTimeStampColor> color = std::nullopt,
      std::optional<folly::dynamic> detail = std::nullopt,
      std::optional<folly::dynamic> stackTrace = std::nullopt);

  /**
   * Record an Event Loop tick, which will be represented as an Event Loop task
   * on a timeline view and grouped with JavaScript samples.
   */
  void reportEventLoopTask(HighResTimeStamp start, HighResTimeStamp end);

  /**
   * Record Microtasks phase of the Event Loop tick. Will be represented as a
   * "Run Microtasks" block under a task.
   */
  void reportEventLoopMicrotasks(HighResTimeStamp start, HighResTimeStamp end);

  /**
   * Record a "ResourceWillSendRequest" event. Paired with other "Resource*"
   * events, renders a network request timeline in the Performance panel Network
   * track.
   *
   * If not currently tracing, this is a no-op.
   */
  void reportResourceWillSendRequest(const std::string &devtoolsRequestId, HighResTimeStamp start);

  /**
   * Record a "ResourceSendRequest" event. Paired with other "Resource*"
   * events, renders a network request timeline in the Performance panel Network
   * track.
   *
   * If not currently tracing, this is a no-op.
   */
  void reportResourceSendRequest(
      const std::string &devtoolsRequestId,
      HighResTimeStamp start,
      const std::string &url,
      const std::string &requestMethod,
      const Headers &headers);

  /**
   * Record a "ResourceReceivedData" event.
   * If not currently tracing, this is a no-op.
   */
  void reportResourceReceivedData(const std::string &devtoolsRequestId, HighResTimeStamp start, int encodedDataLength);

  /**
   * Record a "ResourceReceiveResponse" event. Paired with other "Resource*"
   * events, renders a network request timeline in the Performance panel Network
   * track.
   *
   * If not currently tracing, this is a no-op.
   */
  void reportResourceReceiveResponse(
      const std::string &devtoolsRequestId,
      HighResTimeStamp start,
      int statusCode,
      const Headers &headers,
      int encodedDataLength,
      folly::dynamic timingData);

  /**
   * Record a "ResourceFinish" event. Paired with other "Resource*" events,
   * renders a network request timeline in the Performance panel Network track.
   *
   * If not currently tracing, this is a no-op.
   */
  void reportResourceFinish(
      const std::string &devtoolsRequestId,
      HighResTimeStamp start,
      int encodedDataLength,
      int decodedBodyLength);

  /**
   * Creates "Profile" Trace Event.
   *
   * Can be serialized to JSON with TraceEventSerializer::serialize.
   */
  static TraceEvent constructRuntimeProfileTraceEvent(
      RuntimeProfileId profileId,
      ProcessId processId,
      ThreadId threadId,
      HighResTimeStamp profileTimestamp);

  /**
   * Creates "ProfileChunk" Trace Event.
   *
   * Can be serialized to JSON with TraceEventSerializer::serialize.
   */
  static TraceEvent constructRuntimeProfileChunkTraceEvent(
      RuntimeProfileId profileId,
      ProcessId processId,
      ProcessId threadId,
      HighResTimeStamp chunkTimestamp,
      TraceEventProfileChunk &&traceEventProfileChunk);

  /**
   * Callback function type for tracing state changes.
   * @param isTracing true if tracing has started, false if tracing has stopped
   */
  using TracingStateCallback = std::function<void(bool isTracing)>;

  /**
   * Subscribe to tracing state changes (start/stop events).
   * Tracing start state is reported after tracing has started, so callbacks can
   * report events immediately.
   * Tracing stop state is reported before tracing has stopped, so callbacks
   * can report final events.
   * @param callback Function to call when tracing starts or stops
   * @return A unique identifier for the subscription that can be used to unsubscribe
   */
  uint32_t subscribeToTracingStateChanges(TracingStateCallback callback);

  /**
   * Unsubscribe from tracing state changes.
   * @param subscriptionId The identifier returned from subscribeToTracingStateChanges
   */
  void unsubscribeFromTracingStateChanges(uint32_t subscriptionId);

 private:
  PerformanceTracer();
  PerformanceTracer(const PerformanceTracer &) = delete;
  PerformanceTracer &operator=(const PerformanceTracer &) = delete;
  ~PerformanceTracer() = default;

#pragma mark - Internal trace event types

  struct PerformanceTracerEventEventLoopTask {
    HighResTimeStamp start;
    HighResTimeStamp end;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerEventEventLoopMicrotask {
    HighResTimeStamp start;
    HighResTimeStamp end;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerEventMark {
    std::string name;
    HighResTimeStamp start;
    folly::dynamic detail;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerEventMeasure {
    std::string name;
    HighResTimeStamp start;
    HighResDuration duration;
    folly::dynamic detail;
    ThreadId threadId;
    std::optional<folly::dynamic> stackTrace;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerEventTimeStamp {
    std::string name;
    std::optional<ConsoleTimeStampEntry> start;
    std::optional<ConsoleTimeStampEntry> end;
    std::optional<std::string> trackName;
    std::optional<std::string> trackGroup;
    std::optional<ConsoleTimeStampColor> color;
    std::optional<folly::dynamic> detail;
    std::optional<folly::dynamic> stackTrace;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerResourceSendRequest {
    std::string requestId;
    std::string url;
    HighResTimeStamp start;
    std::string requestMethod;
    std::string resourceType;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerResourceFinish {
    std::string requestId;
    HighResTimeStamp start;
    int encodedDataLength;
    int decodedBodyLength;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerResourceReceivedData {
    std::string requestId;
    HighResTimeStamp start;
    int encodedDataLength;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  struct PerformanceTracerResourceReceiveResponse {
    std::string requestId;
    HighResTimeStamp start;
    int encodedDataLength;
    Headers headers;
    std::string mimeType;
    std::string protocol;
    int statusCode;
    folly::dynamic timing;
    ThreadId threadId;
    HighResTimeStamp createdAt = HighResTimeStamp::now();
  };

  using PerformanceTracerEvent = std::variant<
      PerformanceTracerEventTimeStamp,
      PerformanceTracerEventEventLoopTask,
      PerformanceTracerEventEventLoopMicrotask,
      PerformanceTracerEventMark,
      PerformanceTracerEventMeasure,
      PerformanceTracerResourceSendRequest,
      PerformanceTracerResourceReceiveResponse,
      PerformanceTracerResourceReceivedData,
      PerformanceTracerResourceFinish>;

#pragma mark - Private fields and methods

  const ProcessId processId_;

  /**
   * The flag is atomic in order to enable any thread to read it (via
   * isTracing()) without holding the mutex.
   * Within this class, both reads and writes MUST be protected by the mutex to
   * avoid false positives and data races.
   */
  std::atomic<bool> tracingAtomic_{false};
  /**
   * The counter for recorded User Timing "measure" events.
   * Used for generating unique IDs for each measure event inside a specific
   * Trace.
   * Does not need to be atomic, because it is always accessed within the mutex
   * lock.
   */
  uint32_t performanceMeasureCount_{0};

  HighResTimeStamp currentTraceStartTime_;

  std::optional<HighResDuration> currentTraceMaxDuration_;

  std::vector<PerformanceTracerEvent> buffer_;

  // These fields are only used when setting a max duration on the trace.
  std::vector<PerformanceTracerEvent> altBuffer_;
  std::vector<PerformanceTracerEvent> *currentBuffer_ = &buffer_;
  std::vector<PerformanceTracerEvent> *previousBuffer_{};
  HighResTimeStamp currentBufferStartTime_;

  // A flag that is used to ensure we only emit one auxiliary entry for the
  // ordering of Scheduler / Component tracks.
  bool alreadyEmittedEntryForComponentsTrackOrdering_ = false;

  /**
   * Protects data members of this class for concurrent access, including
   * the tracingAtomic_, in order to eliminate potential "logic" races.
   */
  std::mutex mutex_;

  // Callback management
  std::map<uint32_t, TracingStateCallback> tracingStateCallbacks_;
  uint32_t nextCallbackId_{0};

  bool startTracingImpl(std::optional<HighResDuration> maxDuration = std::nullopt);

  std::vector<TraceEvent> collectEventsAndClearBuffers(HighResTimeStamp currentTraceEndTime);
  void collectEventsAndClearBuffer(
      std::vector<TraceEvent> &events,
      std::vector<PerformanceTracerEvent> &buffer,
      HighResTimeStamp currentTraceEndTime);
  bool isInTracingWindow(HighResTimeStamp now, HighResTimeStamp timeStampToCheck) const;
  void enqueueEvent(PerformanceTracerEvent &&event);

  HighResTimeStamp getCreatedAt(const PerformanceTracerEvent &event) const;

  void enqueueTraceEventsFromPerformanceTracerEvent(std::vector<TraceEvent> &events, PerformanceTracerEvent &&event);
};

} // namespace facebook::react::jsinspector_modern::tracing
