/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TraceEventSerializer.h"
#include "Timing.h"
#include "TracingCategory.h"

#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern::tracing {

/* static */ folly::dynamic TraceEventSerializer::serialize(
    TraceEvent&& event) {
  folly::dynamic result = folly::dynamic::object;

  if (event.id.has_value()) {
    std::array<char, 16> buffer{};
    snprintf(buffer.data(), buffer.size(), "0x%x", event.id.value());
    result["id"] = buffer.data();
  }
  result["name"] = std::move(event.name);
  result["cat"] = serializeTracingCategories(event.cat);
  result["ph"] = std::string(1, event.ph);
  result["ts"] = highResTimeStampToTracingClockTimeStamp(event.ts);
  result["pid"] = event.pid;
  if (event.s.has_value()) {
    result["s"] = std::string(1, event.s.value());
  }
  result["tid"] = event.tid;
  result["args"] = std::move(event.args);
  if (event.dur.has_value()) {
    result["dur"] = highResDurationToTracingClockDuration(event.dur.value());
  }

  return result;
}

/* static */ folly::dynamic TraceEventSerializer::serializeProfileChunk(
    TraceEventProfileChunk&& profileChunk) {
  return folly::dynamic::object(
      "cpuProfile",
      serializeProfileChunkCPUProfile(std::move(profileChunk.cpuProfile)))(
      "timeDeltas",
      serializeProfileChunkTimeDeltas(std::move(profileChunk.timeDeltas)));
}

/* static */ folly::dynamic
TraceEventSerializer::serializeProfileChunkTimeDeltas(
    TraceEventProfileChunk::TimeDeltas&& deltas) {
  auto value = folly::dynamic::array();
  value.reserve(deltas.size());

  for (auto& delta : deltas) {
    value.push_back(highResDurationToTracingClockDuration(delta));
  }
  return value;
}

/* static */ folly::dynamic
TraceEventSerializer::serializeProfileChunkCPUProfile(
    TraceEventProfileChunk::CPUProfile&& cpuProfile) {
  folly::dynamic dynamicNodes = folly::dynamic::array();
  dynamicNodes.reserve(cpuProfile.nodes.size());
  for (auto& node : cpuProfile.nodes) {
    dynamicNodes.push_back(
        serializeProfileChunkCPUProfileNode(std::move(node)));
  }
  folly::dynamic dynamicSamples = folly::dynamic::array(
      std::make_move_iterator(cpuProfile.samples.begin()),
      std::make_move_iterator(cpuProfile.samples.end()));

  return folly::dynamic::object("nodes", std::move(dynamicNodes))(
      "samples", std::move(dynamicSamples));
}

/* static */ folly::dynamic
TraceEventSerializer::serializeProfileChunkCPUProfileNode(
    TraceEventProfileChunk::CPUProfile::Node&& node) {
  folly::dynamic dynamicNode = folly::dynamic::object();

  dynamicNode["callFrame"] =
      serializeProfileChunkCPUProfileNodeCallFrame(std::move(node.callFrame));
  dynamicNode["id"] = node.id;
  if (node.parentId.has_value()) {
    dynamicNode["parent"] = node.parentId.value();
  }

  return dynamicNode;
}

/* static */ folly::dynamic
TraceEventSerializer::serializeProfileChunkCPUProfileNodeCallFrame(
    TraceEventProfileChunk::CPUProfile::Node::CallFrame&& callFrame) {
  folly::dynamic dynamicCallFrame = folly::dynamic::object();
  dynamicCallFrame["codeType"] = std::move(callFrame.codeType);
  dynamicCallFrame["scriptId"] = callFrame.scriptId;
  dynamicCallFrame["functionName"] = std::move(callFrame.functionName);
  if (callFrame.url.has_value()) {
    dynamicCallFrame["url"] = std::move(callFrame.url.value());
  }
  if (callFrame.lineNumber.has_value()) {
    dynamicCallFrame["lineNumber"] = callFrame.lineNumber.value();
  }
  if (callFrame.columnNumber.has_value()) {
    dynamicCallFrame["columnNumber"] = callFrame.columnNumber.value();
  }

  return dynamicCallFrame;
}

/* static */ size_t TraceEventSerializer::estimateJsonSize(
    const folly::dynamic& value) {
  switch (value.type()) {
    case folly::dynamic::Type::NULLT:
      return 4; // null
    case folly::dynamic::Type::BOOL:
      return 5; // false
    case folly::dynamic::Type::INT64:
    case folly::dynamic::Type::DOUBLE:
      return 20; // conservative max for numeric values
    case folly::dynamic::Type::STRING:
      return value.stringPiece().size() + 2; // quotes
    case folly::dynamic::Type::ARRAY: {
      size_t size = 2; // []
      bool first = true;
      for (const auto& element : value) {
        if (!first) {
          size += 1; // comma
        }
        first = false;
        size += estimateJsonSize(element);
      }
      return size;
    }
    case folly::dynamic::Type::OBJECT: {
      size_t size = 2; // {}
      bool first = true;
      for (const auto& [key, val] : value.items()) {
        if (!first) {
          size += 1; // comma
        }
        first = false;
        // key size + quotes + colon
        size += key.stringPiece().size() + 3;
        size += estimateJsonSize(val);
      }
      return size;
    }
  }
  return 0;
}

} // namespace facebook::react::jsinspector_modern::tracing
