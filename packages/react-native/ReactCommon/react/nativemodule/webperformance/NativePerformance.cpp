/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativePerformance.h"

#include <memory>
#include <unordered_map>
#include <variant>

#include <cxxreact/JSExecutor.h>
#include <cxxreact/ReactMarker.h>
#include <jsi/JSIDynamic.h>
#include <jsi/instrumentation.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/performance/timeline/PerformanceObserver.h>

#include "NativePerformance.h"

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule> NativePerformanceModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativePerformance>(
      std::move(jsInvoker));
}

namespace facebook::react {

namespace {

/**
 * Default `durationThreshold` (in milliseconds) applied to `event` entries when
 * the JS API does not provide an explicit value. Per the W3C Event Timing
 * spec, observers for `event` entries default to a 104ms threshold:
 * https://www.w3.org/TR/event-timing/#sec-modifications-perf-timeline
 */
constexpr HighResDuration DEFAULT_EVENT_DURATION_THRESHOLD =
    HighResDuration::fromMilliseconds(104);

class PerformanceObserverWrapper : public jsi::NativeState {
 public:
  explicit PerformanceObserverWrapper(
      const std::shared_ptr<PerformanceObserver> observer)
      : observer(observer) {}

  const std::shared_ptr<PerformanceObserver> observer;
};

void sortEntries(std::vector<PerformanceEntry>& entries) {
  return std::stable_sort(
      entries.begin(), entries.end(), PerformanceEntrySorter{});
}

NativePerformanceEntry toNativePerformanceEntry(const PerformanceEntry& entry) {
  auto nativeEntry = std::visit(
      [](const auto& entryData) -> NativePerformanceEntry {
        return {
            .name = entryData.name,
            .entryType = entryData.entryType,
            .startTime = entryData.startTime,
            .duration = entryData.duration,
        };
      },
      entry);

  if (std::holds_alternative<PerformanceEventTiming>(entry)) {
    auto eventEntry = std::get<PerformanceEventTiming>(entry);
    nativeEntry.processingStart = eventEntry.processingStart;
    nativeEntry.processingEnd = eventEntry.processingEnd;
    nativeEntry.interactionId = eventEntry.interactionId;
  }
  if (std::holds_alternative<PerformanceResourceTiming>(entry)) {
    auto resourceEntry = std::get<PerformanceResourceTiming>(entry);
    nativeEntry.fetchStart = resourceEntry.fetchStart;
    nativeEntry.requestStart = resourceEntry.requestStart;
    nativeEntry.connectStart = resourceEntry.connectStart;
    nativeEntry.connectEnd = resourceEntry.connectEnd;
    nativeEntry.responseStart = resourceEntry.responseStart;
    nativeEntry.responseEnd = resourceEntry.responseEnd;
    nativeEntry.responseStatus = resourceEntry.responseStatus;
    nativeEntry.contentType = resourceEntry.contentType;
    nativeEntry.encodedBodySize = resourceEntry.encodedBodySize;
    nativeEntry.decodedBodySize = resourceEntry.decodedBodySize;
  }

  return nativeEntry;
}

std::vector<NativePerformanceEntry> toNativePerformanceEntries(
    std::vector<PerformanceEntry>& entries) {
  std::vector<NativePerformanceEntry> result;
  result.reserve(entries.size());

  for (auto& entry : entries) {
    result.emplace_back(toNativePerformanceEntry(entry));
  }

  return result;
}

const std::array<PerformanceEntryType, 2> ENTRY_TYPES_AVAILABLE_FROM_TIMELINE{
    {PerformanceEntryType::MARK, PerformanceEntryType::MEASURE}};

bool isAvailableFromTimeline(PerformanceEntryType entryType) {
  return entryType == PerformanceEntryType::MARK ||
      entryType == PerformanceEntryType::MEASURE;
}

std::shared_ptr<PerformanceObserver> tryGetObserver(
    jsi::Runtime& rt,
    jsi::Object& observerObj) {
  if (!observerObj.hasNativeState(rt)) {
    return nullptr;
  }

  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));
  return observerWrapper ? observerWrapper->observer : nullptr;
}

PerformanceEntryReporter::UserTimingDetailProvider getDetailProviderFromEntry(
    jsi::Runtime& rt,
    jsi::Value& entry) {
  return [&rt, &entry]() -> folly::dynamic {
    try {
      auto detail = entry.asObject(rt).getProperty(rt, "detail");
      return jsi::dynamicFromValue(rt, detail);
    } catch (jsi::JSIException&) {
      return nullptr;
    }
  };
}

} // namespace

NativePerformance::NativePerformance(std::shared_ptr<CallInvoker> jsInvoker)
    : NativePerformanceCxxSpec(std::move(jsInvoker)) {}

HighResTimeStamp NativePerformance::now(jsi::Runtime& /*rt*/) {
  // This is not spec-compliant, as this is the duration from system boot to
  // now, instead of from app startup to now.
  // This should be carefully changed eventually.
  return HighResTimeStamp::now();
}

HighResDuration NativePerformance::timeOrigin(jsi::Runtime& /*rt*/) {
  // This is not spec-compliant, as this is an approximation from Unix epoch to
  // system boot, instead of a precise duration from Unix epoch to app startup.
  return HighResTimeStamp::unsafeOriginFromUnixTimeStamp();
}

void NativePerformance::reportMark(
    jsi::Runtime& rt,
    const std::string& name,
    HighResTimeStamp startTime,
    jsi::Value entry) {
  PerformanceEntryReporter::getInstance()->reportMark(
      name, startTime, getDetailProviderFromEntry(rt, entry));
}

void NativePerformance::reportMeasure(
    jsi::Runtime& rt,
    const std::string& name,
    HighResTimeStamp startTime,
    HighResDuration duration,
    jsi::Value entry) {
  PerformanceEntryReporter::getInstance()->reportMeasure(
      name, startTime, duration, getDetailProviderFromEntry(rt, entry));
}

std::optional<double> NativePerformance::getMarkTime(
    jsi::Runtime& /*rt*/,
    const std::string& name) {
  auto markTime = PerformanceEntryReporter::getInstance()->getMarkTime(name);
  return markTime ? std::optional{(*markTime).toDOMHighResTimeStamp()}
                  : std::nullopt;
}

void NativePerformance::clearMarks(
    jsi::Runtime& /*rt*/,
    std::optional<std::string> entryName) {
  if (entryName) {
    PerformanceEntryReporter::getInstance()->clearEntries(
        PerformanceEntryType::MARK, *entryName);
  } else {
    PerformanceEntryReporter::getInstance()->clearEntries(
        PerformanceEntryType::MARK);
  }
}

void NativePerformance::clearMeasures(
    jsi::Runtime& /*rt*/,
    std::optional<std::string> entryName) {
  if (entryName) {
    PerformanceEntryReporter::getInstance()->clearEntries(
        PerformanceEntryType::MEASURE, *entryName);
  } else {
    PerformanceEntryReporter::getInstance()->clearEntries(
        PerformanceEntryType::MEASURE);
  }
}

std::vector<NativePerformanceEntry> NativePerformance::getEntries(
    jsi::Runtime& /*rt*/) {
  std::vector<PerformanceEntry> entries;

  for (auto entryType : ENTRY_TYPES_AVAILABLE_FROM_TIMELINE) {
    PerformanceEntryReporter::getInstance()->getEntries(entries, entryType);
  }

  sortEntries(entries);

  return toNativePerformanceEntries(entries);
}

std::vector<NativePerformanceEntry> NativePerformance::getEntriesByName(
    jsi::Runtime& /*rt*/,
    const std::string& entryName,
    std::optional<PerformanceEntryType> entryType) {
  std::vector<PerformanceEntry> entries;

  if (entryType) {
    if (isAvailableFromTimeline(*entryType)) {
      PerformanceEntryReporter::getInstance()->getEntries(
          entries, *entryType, entryName);
    }
  } else {
    for (auto type : ENTRY_TYPES_AVAILABLE_FROM_TIMELINE) {
      PerformanceEntryReporter::getInstance()->getEntries(
          entries, type, entryName);
    }
  }

  sortEntries(entries);

  return toNativePerformanceEntries(entries);
}

std::vector<NativePerformanceEntry> NativePerformance::getEntriesByType(
    jsi::Runtime& /*rt*/,
    PerformanceEntryType entryType) {
  std::vector<PerformanceEntry> entries;

  if (isAvailableFromTimeline(entryType)) {
    PerformanceEntryReporter::getInstance()->getEntries(entries, entryType);
  }

  sortEntries(entries);

  return toNativePerformanceEntries(entries);
}

std::vector<std::pair<std::string, uint32_t>> NativePerformance::getEventCounts(
    jsi::Runtime& /*rt*/) {
  const auto& eventCounts =
      PerformanceEntryReporter::getInstance()->getEventCounts();
  return {eventCounts.begin(), eventCounts.end()};
}

std::unordered_map<std::string, double> NativePerformance::getSimpleMemoryInfo(
    jsi::Runtime& rt) {
  auto heapInfo = rt.instrumentation().getHeapInfo(false);
  std::unordered_map<std::string, double> heapInfoToJs;
  for (auto& entry : heapInfo) {
    heapInfoToJs[entry.first] = static_cast<double>(entry.second);
  }
  return heapInfoToJs;
}

std::unordered_map<std::string, double>
NativePerformance::getReactNativeStartupTiming(jsi::Runtime& /*rt*/) {
  std::unordered_map<std::string, double> result;

  ReactMarker::StartupLogger& startupLogger =
      ReactMarker::StartupLogger::getInstance();
  if (!std::isnan(startupLogger.getAppStartupStartTime())) {
    result["startTime"] = startupLogger.getAppStartupStartTime();
  } else if (!std::isnan(startupLogger.getInitReactRuntimeStartTime())) {
    result["startTime"] = startupLogger.getInitReactRuntimeStartTime();
  }

  if (!std::isnan(startupLogger.getInitReactRuntimeStartTime())) {
    result["initializeRuntimeStart"] =
        startupLogger.getInitReactRuntimeStartTime();
  }

  if (!std::isnan(startupLogger.getRunJSBundleStartTime())) {
    result["executeJavaScriptBundleEntryPointStart"] =
        startupLogger.getRunJSBundleStartTime();
  }

  if (!std::isnan(startupLogger.getAppStartupEndTime())) {
    result["endTime"] = startupLogger.getAppStartupEndTime();
  }

  return result;
}

jsi::Object NativePerformance::createObserver(
    jsi::Runtime& rt,
    NativePerformancePerformanceObserverCallback callback) {
  // The way we dispatch performance observer callbacks is a bit different from
  // the spec. The specification requires us to queue a single task that
  // dispatches observer callbacks. Instead, we are queuing all callbacks as
  // separate tasks in the scheduler.
  PerformanceObserverCallback cb = [callback = std::move(callback)]() {
    callback.callWithPriority(SchedulerPriority::IdlePriority);
  };

  auto& registry =
      PerformanceEntryReporter::getInstance()->getObserverRegistry();

  auto observer = PerformanceObserver::create(registry, std::move(cb));
  auto observerWrapper = std::make_shared<PerformanceObserverWrapper>(observer);
  jsi::Object observerObj{rt};
  observerObj.setNativeState(rt, observerWrapper);
  return observerObj;
}

double NativePerformance::getDroppedEntriesCount(
    jsi::Runtime& rt,
    jsi::Object observerObj) {
  auto observer = tryGetObserver(rt, observerObj);

  if (!observer) {
    return 0;
  }

  return observer->getDroppedEntriesCount();
}

void NativePerformance::observe(
    jsi::Runtime& rt,
    jsi::Object observerObj,
    NativePerformancePerformanceObserverObserveOptions options) {
  auto observer = tryGetObserver(rt, observerObj);

  if (!observer) {
    return;
  }

  auto durationThreshold =
      options.durationThreshold.value_or(DEFAULT_EVENT_DURATION_THRESHOLD);

  // observer of type multiple
  if (options.entryTypes.has_value()) {
    std::unordered_set<PerformanceEntryType> entryTypes;
    auto rawTypes = options.entryTypes.value();

    for (auto rawType : rawTypes) {
      entryTypes.insert(Bridging<PerformanceEntryType>::fromJs(rt, rawType));
    }

    observer->observe(entryTypes);
  } else { // single
    auto buffered = options.buffered.value_or(false);
    if (options.type.has_value()) {
      observer->observe(
          static_cast<PerformanceEntryType>(options.type.value()),
          {.buffered = buffered, .durationThreshold = durationThreshold});
    }
  }
}

void NativePerformance::disconnect(jsi::Runtime& rt, jsi::Object observerObj) {
  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));

  if (!observerWrapper) {
    return;
  }

  auto observer = observerWrapper->observer;
  observer->disconnect();
}

std::vector<NativePerformanceEntry> NativePerformance::takeRecords(
    jsi::Runtime& rt,
    jsi::Object observerObj,
    bool sort) {
  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));

  if (!observerWrapper) {
    return {};
  }

  auto observer = observerWrapper->observer;
  auto records = observer->takeRecords();
  if (sort) {
    sortEntries(records);
  }
  return toNativePerformanceEntries(records);
}

std::vector<PerformanceEntryType>
NativePerformance::getSupportedPerformanceEntryTypes(jsi::Runtime& /*rt*/) {
  auto supportedEntryTypes = PerformanceEntryReporter::getSupportedEntryTypes();
  return {supportedEntryTypes.begin(), supportedEntryTypes.end()};
}

#pragma mark - Testing

void NativePerformance::clearEventCountsForTesting(jsi::Runtime& /*rt*/) {
  PerformanceEntryReporter::getInstance()->clearEventCounts();
}

} // namespace facebook::react
