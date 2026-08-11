/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "RuntimeSamplingProfile.h"

#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern::tracing {

namespace {

/**
 * Maximum number of samples per chunk.
 */
constexpr uint16_t PROFILE_CHUNK_SIZE = 100;

/**
 * Maximum number of unique nodes per chunk.
 */
constexpr uint16_t MAX_UNIQUE_NODES_PER_CHUNK = 50;

} // namespace

struct IdGenerator {
 public:
  uint32_t getNext() {
    return ++counter_;
  }

 private:
  uint32_t counter_ = 0;
};

/**
 * Serializes RuntimeSamplingProfile into collection of specific Trace Events,
 * which represent Profile information on a timeline.
 */
class RuntimeSamplingProfileTraceEventSerializer {
 public:
  /**
   * \param profile What we will be serializing.
   * \param profileIdGenerator A reference to an IdGenerator, which will be
   * used for generating unique ids for ProfileChunks.
   * \param tracingStartTime A timestamp of when tracing started, will be used
   * as a starting reference point of JavaScript samples recording.
   * \param dispatchCallback A reference to a callback, which is called when a
   * chunk of trace events is ready to be sent.
   * \param traceEventChunkSize The maximum number of ProfileChunk trace events
   * that can be sent in a single CDP Tracing.dataCollected message.
   * \param profileChunkSize The maximum number of ProfileChunk trace events
   * that can be sent in a single ProfileChunk trace event.
   */
  static void serializeAndDispatch(
      RuntimeSamplingProfile&& profile,
      IdGenerator& profileIdGenerator,
      HighResTimeStamp tracingStartTime,
      const std::function<void(folly::dynamic&& traceEventsChunk)>&
          dispatchCallback,
      uint16_t traceEventChunkSize,
      uint16_t profileChunkSize = PROFILE_CHUNK_SIZE,
      uint16_t maxUniqueNodesPerChunk = MAX_UNIQUE_NODES_PER_CHUNK);

  static void serializeAndDispatch(
      std::vector<RuntimeSamplingProfile>&& profiles,
      IdGenerator& profileIdGenerator,
      HighResTimeStamp tracingStartTime,
      const std::function<void(folly::dynamic&& traceEventsChunk)>&
          dispatchCallback,
      uint16_t traceEventChunkSize,
      uint16_t profileChunkSize = PROFILE_CHUNK_SIZE,
      uint16_t maxUniqueNodesPerChunk = MAX_UNIQUE_NODES_PER_CHUNK);
};

} // namespace facebook::react::jsinspector_modern::tracing
