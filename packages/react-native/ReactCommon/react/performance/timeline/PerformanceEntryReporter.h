/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include "PerformanceEntryCircularBuffer.h"
#include "PerformanceEntryKeyedBuffer.h"
#include "PerformanceEntryReporterListeners.h"
#include "PerformanceObserverRegistry.h"

#include <folly/dynamic.h>
#include <react/timing/primitives.h>

#include <memory>
#include <optional>
#include <shared_mutex>
#include <vector>

namespace facebook::react {

// Aligned with maxBufferSize implemented by browsers
// https://w3c.github.io/timing-entrytypes-registry/#registry
constexpr size_t EVENT_BUFFER_SIZE = 150;
constexpr size_t LONG_TASK_BUFFER_SIZE = 200;
constexpr size_t RESOURCE_TIMING_BUFFER_SIZE = 250;

constexpr HighResDuration LONG_TASK_DURATION_THRESHOLD = HighResDuration::fromMilliseconds(50);

class PerformanceEntryReporter {
 public:
  PerformanceEntryReporter();

  // NOTE: This class is not thread safe, make sure that the calls are made from
  // the same thread.
  // TODO: Consider passing it as a parameter to the corresponding modules at
  // creation time instead of having the singleton.
  static std::shared_ptr<PerformanceEntryReporter> &getInstance();

  PerformanceObserverRegistry &getObserverRegistry()
  {
    return *observerRegistry_;
  }

  std::vector<PerformanceEntry> getEntries() const;
  void getEntries(std::vector<PerformanceEntry> &dest) const;

  std::vector<PerformanceEntry> getEntries(PerformanceEntryType entryType) const;
  void getEntries(std::vector<PerformanceEntry> &dest, PerformanceEntryType entryType) const;

  std::vector<PerformanceEntry> getEntries(PerformanceEntryType entryType, const std::string &entryName) const;
  void getEntries(std::vector<PerformanceEntry> &dest, PerformanceEntryType entryType, const std::string &entryName)
      const;

  void clearEntries();
  void clearEntries(PerformanceEntryType entryType);
  void clearEntries(PerformanceEntryType entryType, const std::string &entryName);

  void addEventListener(PerformanceEntryReporterEventListener *listener);
  void removeEventListener(PerformanceEntryReporterEventListener *listener);

  static std::vector<PerformanceEntryType> getSupportedEntryTypes();

  uint32_t getDroppedEntriesCount(PerformanceEntryType type) const noexcept;

  const std::unordered_map<std::string, uint32_t> &getEventCounts() const
  {
    return eventCounts_;
  }

  void clearEventCounts();

  std::optional<HighResTimeStamp> getMarkTime(const std::string &markName) const;

  using UserTimingDetailProvider = std::function<folly::dynamic()>;

  void
  reportMark(const std::string &name, HighResTimeStamp startTime, UserTimingDetailProvider &&detailProvider = nullptr);

  void reportMeasure(
      const std::string &name,
      HighResTimeStamp startTime,
      HighResDuration duration,
      const std::optional<UserTimingDetailProvider> &detailProvider = std::nullopt);

  void reportEvent(
      const std::string &name,
      HighResTimeStamp startTime,
      HighResDuration duration,
      HighResTimeStamp processingStart,
      HighResTimeStamp processingEnd,
      HighResTimeStamp taskEndTime,
      uint32_t interactionId);

  void reportLongTask(HighResTimeStamp startTime, HighResDuration duration);

  void reportResourceTiming(
      const std::string &url,
      HighResTimeStamp fetchStart,
      HighResTimeStamp requestStart,
      std::optional<HighResTimeStamp> connectStart,
      std::optional<HighResTimeStamp> connectEnd,
      HighResTimeStamp responseStart,
      HighResTimeStamp responseEnd,
      int responseStatus,
      const std::string &contentType,
      int encodedBodySize,
      int decodedBodySize);

 private:
  std::unique_ptr<PerformanceObserverRegistry> observerRegistry_;

  mutable std::shared_mutex buffersMutex_;
  PerformanceEntryCircularBuffer eventBuffer_{EVENT_BUFFER_SIZE};
  PerformanceEntryCircularBuffer longTaskBuffer_{LONG_TASK_BUFFER_SIZE};
  PerformanceEntryCircularBuffer resourceTimingBuffer_{RESOURCE_TIMING_BUFFER_SIZE};
  PerformanceEntryKeyedBuffer markBuffer_;
  PerformanceEntryKeyedBuffer measureBuffer_;

  std::unordered_map<std::string, uint32_t> eventCounts_;

  mutable std::shared_mutex listenersMutex_;
  std::vector<PerformanceEntryReporterEventListener *> eventListeners_{};

  const inline PerformanceEntryBuffer &getBuffer(PerformanceEntryType entryType) const
  {
    switch (entryType) {
      case PerformanceEntryType::EVENT:
        return eventBuffer_;
      case PerformanceEntryType::MARK:
        return markBuffer_;
      case PerformanceEntryType::MEASURE:
        return measureBuffer_;
      case PerformanceEntryType::LONGTASK:
        return longTaskBuffer_;
      case PerformanceEntryType::RESOURCE:
        return resourceTimingBuffer_;
      case PerformanceEntryType::_NEXT:
        throw std::logic_error("Cannot get buffer for _NEXT entry type");
      default:
        throw std::logic_error("Unhandled PerformanceEntryType");
    }
  }

  inline PerformanceEntryBuffer &getBufferRef(PerformanceEntryType entryType)
  {
    switch (entryType) {
      case PerformanceEntryType::EVENT:
        return eventBuffer_;
      case PerformanceEntryType::MARK:
        return markBuffer_;
      case PerformanceEntryType::MEASURE:
        return measureBuffer_;
      case PerformanceEntryType::LONGTASK:
        return longTaskBuffer_;
      case PerformanceEntryType::RESOURCE:
        return resourceTimingBuffer_;
      case PerformanceEntryType::_NEXT:
        throw std::logic_error("Cannot get buffer for _NEXT entry type");
      default:
        throw std::logic_error("Unhandled PerformanceEntryType");
    }
  }

  void traceMark(const PerformanceMark &entry, UserTimingDetailProvider &&detailProvider) const;
  void traceMeasure(const PerformanceMeasure &entry, const std::optional<UserTimingDetailProvider> &detailProvider)
      const;
  void traceResourceTiming(
      const PerformanceResourceTiming &entry,
      const std::optional<std::string> &devtoolsRequestId,
      const std::optional<std::string> &requestMethod,
      const std::optional<std::string> &resourceType) const;
};

} // namespace facebook::react
