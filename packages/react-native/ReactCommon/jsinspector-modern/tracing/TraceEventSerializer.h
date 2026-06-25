/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TraceEvent.h"
#include "TraceEventProfile.h"

#include <folly/dynamic.h>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * This class is only responsible for serializing a local TraceEvent
 * representation into JSON, that should be ready to be dispatched over the
 * protocol.
 */
class TraceEventSerializer {
 public:
  /**
   * Serializes a TraceEvent to a folly::dynamic object.
   *
   * \param event rvalue reference to the TraceEvent object.
   * \return A folly::dynamic object that represents a serialized into JSON
   * Trace Event for CDP.
   */
  static folly::dynamic serialize(TraceEvent &&event);

  /**
   * Serialize a TraceEventProfileChunk to a folly::dynamic object.
   *
   * \param profileChunk rvalue reference to the TraceEventProfileChunk object.
   * \return A folly::dynamic object that represents a serialized into JSON
   * "ProfileChunk" Trace Event for CDP.
   */
  static folly::dynamic serializeProfileChunk(TraceEventProfileChunk &&profileChunk);

  /**
   * Serialize a TraceEventProfileChunk::TimeDeltas to a folly::dynamic
   * object.
   *
   * \param deltas rvalue reference to the TraceEventProfileChunk::TimeDeltas
   * object.
   * \return A folly::dynamic object that represents a serialized "timeDeltas"
   * property of "ProfileChunk" Trace Event for CDP.
   */
  static folly::dynamic serializeProfileChunkTimeDeltas(TraceEventProfileChunk::TimeDeltas &&deltas);

  /**
   * Serialize a TraceEventProfileChunk::CPUProfile into a folly::dynamic
   * object.
   *
   * \param cpuProfile rvalue reference to the
   * TraceEventProfileChunk::CPUProfile object.
   * \return A folly::dynamic object that represents a serialized "cpuProfile"
   * property of "ProfileChunk" Trace Event for CDP.
   */
  static folly::dynamic serializeProfileChunkCPUProfile(TraceEventProfileChunk::CPUProfile &&cpuProfile);

  /**
   * Serialize a TraceEventProfileChunk::CPUProfile::Node into a folly::dynamic
   * object.
   *
   * \param node rvalue reference to the
   * TraceEventProfileChunk::CPUProfile::Node object.
   * \return A folly::dynamic object that represents a serialized
   * "cpuProfile.nodes[i]" property of "ProfileChunk" Trace Event for CDP.
   */
  static folly::dynamic serializeProfileChunkCPUProfileNode(TraceEventProfileChunk::CPUProfile::Node &&node);

  /**
   * Serialize a TraceEventProfileChunk::CPUProfile::Node::CallFrame into a
   * folly::dynamic object.
   *
   * \param callFrame rvalue reference to the
   * TraceEventProfileChunk::CPUProfile::Node::CallFrame object.
   * \return A folly::dynamic object that represents a serialized
   * "cpuProfile.nodes[i].callFrame" property of "ProfileChunk" Trace Event for
   * CDP.
   */
  static folly::dynamic serializeProfileChunkCPUProfileNodeCallFrame(
      TraceEventProfileChunk::CPUProfile::Node::CallFrame &&callFrame);

  /**
   * Estimates the JSON-serialized byte size of a folly::dynamic value.
   * This is a rough but conservative estimate to avoid the cost of
   * double-serialization (once to measure, once to emit).
   */
  static size_t estimateJsonSize(const folly::dynamic &value);
};

} // namespace facebook::react::jsinspector_modern::tracing
