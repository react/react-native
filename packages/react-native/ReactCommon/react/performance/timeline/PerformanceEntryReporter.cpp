/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryReporter.h"

#include <jsinspector-modern/ConsoleTaskOrchestrator.h>
#include <jsinspector-modern/tracing/PerformanceTracer.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/timing/primitives.h>
#include <reactperflogger/ReactPerfettoLogger.h>

#ifdef WITH_PERFETTO
#include <reactperflogger/ReactPerfetto.h>
#endif

#include <variant>

namespace facebook::react {

namespace {

std::vector<PerformanceEntryType> getSupportedEntryTypesInternal() {
  std::vector<PerformanceEntryType> supportedEntryTypes{
      PerformanceEntryType::MARK,
      PerformanceEntryType::MEASURE,
      PerformanceEntryType::EVENT,
      PerformanceEntryType::LONGTASK,
      PerformanceEntryType::RESOURCE,
  };

  return supportedEntryTypes;
}

std::optional<std::string> getTrackFromDetail(folly::dynamic& detail) {
  if (!detail.isObject()) {
    return std::nullopt;
  }

  auto maybeDevtools = detail["devtools"];
  if (!maybeDevtools.isObject()) {
    return std::nullopt;
  }

  auto maybeTrack = maybeDevtools["track"];
  if (!maybeTrack.isString()) {
    return std::nullopt;
  }

  return maybeTrack.asString();
}

std::optional<std::string> getTrackGroupFromDetail(folly::dynamic& detail) {
  if (!detail.isObject()) {
    return std::nullopt;
  }

  auto maybeDevtools = detail["devtools"];
  if (!maybeDevtools.isObject()) {
    return std::nullopt;
  }

  auto maybeTrackGroup = maybeDevtools["trackGroup"];
  if (!maybeTrackGroup.isString()) {
    return std::nullopt;
  }

  return maybeTrackGroup.asString();
}

} // namespace

std::shared_ptr<PerformanceEntryReporter>&
PerformanceEntryReporter::getInstance() {
  static auto instance = std::make_shared<PerformanceEntryReporter>();
  return instance;
}

PerformanceEntryReporter::PerformanceEntryReporter()
    : observerRegistry_(std::make_unique<PerformanceObserverRegistry>()) {
#ifdef WITH_PERFETTO
  initializePerfetto();
#endif
}

void PerformanceEntryReporter::addEventListener(
    PerformanceEntryReporterEventListener* listener) {
  std::unique_lock lock(listenersMutex_);
  eventListeners_.push_back(listener);
}

void PerformanceEntryReporter::removeEventListener(
    PerformanceEntryReporterEventListener* listener) {
  std::unique_lock lock(listenersMutex_);
  auto it = std::find(eventListeners_.begin(), eventListeners_.end(), listener);
  if (it != eventListeners_.end()) {
    eventListeners_.erase(it);
  }
}

std::vector<PerformanceEntryType>
PerformanceEntryReporter::getSupportedEntryTypes() {
  static std::vector<PerformanceEntryType> supportedEntries =
      getSupportedEntryTypesInternal();
  return supportedEntries;
}

uint32_t PerformanceEntryReporter::getDroppedEntriesCount(
    PerformanceEntryType entryType) const noexcept {
  std::shared_lock lock(buffersMutex_);

  return (uint32_t)getBuffer(entryType).droppedEntriesCount;
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntries() const {
  std::vector<PerformanceEntry> entries;
  getEntries(entries);
  return entries;
}

void PerformanceEntryReporter::getEntries(
    std::vector<PerformanceEntry>& dest) const {
  std::shared_lock lock(buffersMutex_);

  for (auto entryType : getSupportedEntryTypes()) {
    getBuffer(entryType).getEntries(dest);
  }
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntries(
    PerformanceEntryType entryType) const {
  std::vector<PerformanceEntry> dest;
  getEntries(dest, entryType);
  return dest;
}

void PerformanceEntryReporter::getEntries(
    std::vector<PerformanceEntry>& dest,
    PerformanceEntryType entryType) const {
  std::shared_lock lock(buffersMutex_);

  getBuffer(entryType).getEntries(dest);
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntries(
    PerformanceEntryType entryType,
    const std::string& entryName) const {
  std::vector<PerformanceEntry> entries;
  getEntries(entries, entryType, entryName);
  return entries;
}

void PerformanceEntryReporter::getEntries(
    std::vector<PerformanceEntry>& dest,
    PerformanceEntryType entryType,
    const std::string& entryName) const {
  std::shared_lock lock(buffersMutex_);

  getBuffer(entryType).getEntries(dest, entryName);
}

void PerformanceEntryReporter::clearEntries() {
  std::unique_lock lock(buffersMutex_);

  for (auto entryType : getSupportedEntryTypes()) {
    getBufferRef(entryType).clear();
  }
}

void PerformanceEntryReporter::clearEntries(PerformanceEntryType entryType) {
  std::unique_lock lock(buffersMutex_);

  getBufferRef(entryType).clear();
}

void PerformanceEntryReporter::clearEntries(
    PerformanceEntryType entryType,
    const std::string& entryName) {
  std::unique_lock lock(buffersMutex_);

  getBufferRef(entryType).clear(entryName);
}

void PerformanceEntryReporter::reportMark(
    const std::string& name,
    const HighResTimeStamp startTime,
    UserTimingDetailProvider&& detailProvider) {
  const auto entry = PerformanceMark{{.name = name, .startTime = startTime}};

  traceMark(entry, std::move(detailProvider));

  // Add to buffers & notify observers
  {
    std::unique_lock lock(buffersMutex_);
    markBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

void PerformanceEntryReporter::reportMeasure(
    const std::string& name,
    HighResTimeStamp startTime,
    HighResDuration duration,
    const std::optional<UserTimingDetailProvider>& detailProvider) {
  const auto entry = PerformanceMeasure{
      {.name = std::string(name),
       .startTime = startTime,
       .duration = duration}};

  traceMeasure(entry, detailProvider);

  // Add to buffers & notify observers
  {
    std::unique_lock lock(buffersMutex_);
    measureBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);

  std::vector<PerformanceEntryReporterEventListener*> listenersCopy;
  {
    std::shared_lock lock(listenersMutex_);
    listenersCopy = eventListeners_;
  }

  for (auto* listener : listenersCopy) {
    listener->onMeasureEntry(entry, detailProvider);
  }
}

void PerformanceEntryReporter::clearEventCounts() {
  eventCounts_.clear();
}

std::optional<HighResTimeStamp> PerformanceEntryReporter::getMarkTime(
    const std::string& markName) const {
  std::shared_lock lock(buffersMutex_);

  if (auto it = markBuffer_.find(markName); it) {
    return std::visit(
        [](const auto& entryData) { return entryData.startTime; }, *it);
  }

  return std::nullopt;
}

void PerformanceEntryReporter::reportEvent(
    const std::string& name,
    HighResTimeStamp startTime,
    HighResDuration duration,
    HighResTimeStamp processingStart,
    HighResTimeStamp processingEnd,
    HighResTimeStamp taskEndTime,
    uint32_t interactionId) {
  eventCounts_[name]++;

  if (duration < eventBuffer_.durationThreshold) {
    // The entries duration is lower than the desired reporting threshold,
    // skip
    return;
  }

  const auto entry = PerformanceEventTiming{
      {.name = name, .startTime = startTime, .duration = duration},
      processingStart,
      processingEnd,
      taskEndTime,
      interactionId};

  {
    std::unique_lock lock(buffersMutex_);
    eventBuffer_.add(entry);
  }

  // TODO(T198982346): Log interaction events to jsinspector_modern
  observerRegistry_->queuePerformanceEntry(entry);

  std::vector<PerformanceEntryReporterEventListener*> listenersCopy;
  {
    std::shared_lock lock(listenersMutex_);
    listenersCopy = eventListeners_;
  }

  for (auto* listener : listenersCopy) {
    listener->onEventTimingEntry(entry);
  }
}

void PerformanceEntryReporter::reportLongTask(
    HighResTimeStamp startTime,
    HighResDuration duration) {
  const auto entry = PerformanceLongTaskTiming{
      {.name = std::string{"self"},
       .startTime = startTime,
       .duration = duration}};

  {
    std::unique_lock lock(buffersMutex_);
    longTaskBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

void PerformanceEntryReporter::reportResourceTiming(
    const std::string& url,
    HighResTimeStamp fetchStart,
    HighResTimeStamp requestStart,
    std::optional<HighResTimeStamp> connectStart,
    std::optional<HighResTimeStamp> connectEnd,
    HighResTimeStamp responseStart,
    HighResTimeStamp responseEnd,
    int responseStatus,
    const std::string& contentType,
    int encodedBodySize,
    int decodedBodySize) {
  const auto entry = PerformanceResourceTiming{
      {.name = url, .startTime = fetchStart},
      fetchStart,
      requestStart,
      connectStart,
      connectEnd,
      responseStart,
      responseEnd,
      responseStatus,
      contentType,
      encodedBodySize,
      decodedBodySize,
  };

  // Add to buffers & notify observers
  {
    std::unique_lock lock(buffersMutex_);
    resourceTimingBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

void PerformanceEntryReporter::traceMark(
    const PerformanceMark& entry,
    UserTimingDetailProvider&& detailProvider) const {
  auto& performanceTracer =
      jsinspector_modern::tracing::PerformanceTracer::getInstance();

  if (ReactPerfettoLogger::isTracing()) {
    ReactPerfettoLogger::mark(entry.name, entry.startTime);
  }

  if (performanceTracer.isTracing()) {
    performanceTracer.reportMark(
        entry.name,
        entry.startTime,
        detailProvider != nullptr ? detailProvider() : nullptr);
  }
}

void PerformanceEntryReporter::traceMeasure(
    const PerformanceMeasure& entry,
    const std::optional<UserTimingDetailProvider>& detailProvider) const {
  auto& performanceTracer =
      jsinspector_modern::tracing::PerformanceTracer::getInstance();
  if (performanceTracer.isTracing() || ReactPerfettoLogger::isTracing()) {
    auto detail = detailProvider && detailProvider.has_value()
        ? (*detailProvider)()
        : nullptr;

    if (ReactPerfettoLogger::isTracing()) {
      ReactPerfettoLogger::measure(
          entry.name,
          entry.startTime,
          entry.startTime + entry.duration,
          detail != nullptr ? getTrackFromDetail(detail) : std::nullopt,
          detail != nullptr ? getTrackGroupFromDetail(detail) : std::nullopt);
    }

    if (performanceTracer.isTracing()) {
      auto taskContext =
          jsinspector_modern::ConsoleTaskOrchestrator::getInstance().top();

      performanceTracer.reportMeasure(
          entry.name,
          entry.startTime,
          entry.duration,
          std::move(detail),
          taskContext ? taskContext->getSerializedStackTrace() : nullptr);
    }
  }
}

} // namespace facebook::react
