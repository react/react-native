/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/timing/primitives.h>

#include <optional>
#include <string>
#include <variant>

namespace facebook::react {

using PerformanceEntryInteractionId = uint32_t;

enum class PerformanceEntryType {
  // We need to preserve these values for backwards compatibility.
  MARK = 1,
  MEASURE = 2,
  EVENT = 3,
  LONGTASK = 4,
  RESOURCE = 5,
  _NEXT = 6,
};

struct AbstractPerformanceEntry {
  std::string name;
  HighResTimeStamp startTime;
  HighResDuration duration = HighResDuration::zero();
};

struct PerformanceMark : AbstractPerformanceEntry {
  static constexpr PerformanceEntryType entryType = PerformanceEntryType::MARK;
};

struct PerformanceMeasure : AbstractPerformanceEntry {
  static constexpr PerformanceEntryType entryType = PerformanceEntryType::MEASURE;
};

struct PerformanceEventTiming : AbstractPerformanceEntry {
  static constexpr PerformanceEntryType entryType = PerformanceEntryType::EVENT;
  HighResTimeStamp processingStart;
  HighResTimeStamp processingEnd;
  // Custom RN extension not exposed to JS for now.
  // It's the same "taskEndTime" defined in the spec for the Event Loop:
  // https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
  HighResTimeStamp taskEndTime;
  PerformanceEntryInteractionId interactionId;
};

struct PerformanceLongTaskTiming : AbstractPerformanceEntry {
  static constexpr PerformanceEntryType entryType = PerformanceEntryType::LONGTASK;
};

struct PerformanceResourceTiming : AbstractPerformanceEntry {
  static constexpr PerformanceEntryType entryType = PerformanceEntryType::RESOURCE;
  /** Aligns with `startTime`. */
  HighResTimeStamp fetchStart;
  HighResTimeStamp requestStart;
  std::optional<HighResTimeStamp> connectStart;
  std::optional<HighResTimeStamp> connectEnd;
  std::optional<HighResTimeStamp> responseStart;
  /** Aligns with `duration`. */
  std::optional<HighResTimeStamp> responseEnd;
  int responseStatus;
  std::string contentType;
  int encodedBodySize;
  int decodedBodySize;
};

using PerformanceEntry = std::variant<
    PerformanceMark,
    PerformanceMeasure,
    PerformanceEventTiming,
    PerformanceLongTaskTiming,
    PerformanceResourceTiming>;

struct PerformanceEntrySorter {
  bool operator()(const PerformanceEntry &lhs, const PerformanceEntry &rhs) const
  {
    return std::visit(
        [](const auto &left, const auto &right) {
          if (left.startTime != right.startTime) {
            return left.startTime < right.startTime;
          }
          return left.duration < right.duration;
        },
        lhs,
        rhs);
  }
};

} // namespace facebook::react
