/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactPerfettoLogger.h"

#if defined(WITH_PERFETTO)
#include "ReactPerfetto.h"
#elif defined(WITH_FBSYSTRACE)
#include <fbsystrace.h>
#endif

namespace facebook::react {

namespace {

#if defined(WITH_PERFETTO)
const HighResTimeStamp PROGRAM_INIT_TIME = HighResTimeStamp::now();
const std::string PERFETTO_DEFAULT_TRACK_NAME = "# Web Performance";

std::string toPerfettoTrackName(
    const std::optional<std::string_view>& trackName,
    const std::optional<std::string_view>& trackGroup) {
  std::string perfettoTrackName = PERFETTO_DEFAULT_TRACK_NAME;

  if (trackName || trackGroup) {
    perfettoTrackName += ": ";

    if (trackGroup) {
      perfettoTrackName += *trackGroup;
      if (trackName) {
        perfettoTrackName += " | ";
      }
    }

    if (trackName) {
      perfettoTrackName += *trackName;
    }
  }

  return perfettoTrackName;
}
#elif defined(WITH_FBSYSTRACE)
int64_t getDeltaNanos(HighResTimeStamp jsTime) {
  auto now = HighResTimeStamp::now();
  return (jsTime - now).toNanoseconds();
}
#endif

} // namespace

/* static */ bool ReactPerfettoLogger::isTracing() {
#if defined(WITH_PERFETTO)
  return TRACE_EVENT_CATEGORY_ENABLED("react-native");
#elif defined(WITH_FBSYSTRACE)
  return fbsystrace_is_tracing(TRACE_TAG_REACT);
#else
  return false;
#endif
}

/* static */ void ReactPerfettoLogger::measure(
    const std::string_view& eventName,
    HighResTimeStamp startTime,
    HighResTimeStamp endTime,
    const std::optional<std::string_view>& trackName,
    const std::optional<std::string_view>& trackGroup) {
#if defined(WITH_PERFETTO)
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    if (startTime < PROGRAM_INIT_TIME || endTime < PROGRAM_INIT_TIME) {
      return;
    }

    auto track = getPerfettoWebPerfTrackAsync(
        toPerfettoTrackName(trackName, trackGroup));
    TRACE_EVENT_BEGIN(
        "react-native",
        perfetto::DynamicString(eventName.data(), eventName.size()),
        track,
        highResTimeStampToPerfettoTraceTime(startTime));
    TRACE_EVENT_END(
        "react-native", track, highResTimeStampToPerfettoTraceTime(endTime));
  }
#elif defined(WITH_FBSYSTRACE)
  static int cookie = 0;
  fbsystrace_begin_async_section_with_timedelta(
      TRACE_TAG_REACT, eventName.data(), cookie, getDeltaNanos(startTime));
  fbsystrace_end_async_section_with_timedelta(
      TRACE_TAG_REACT, eventName.data(), cookie, getDeltaNanos(endTime));
  cookie++;
#endif
}

/* static */ void ReactPerfettoLogger::mark(
    const std::string_view& eventName,
    HighResTimeStamp startTime,
    const std::optional<std::string_view>& trackName,
    const std::optional<std::string_view>& trackGroup) {
#if defined(WITH_PERFETTO)
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    TRACE_EVENT_INSTANT(
        "react-native",
        perfetto::DynamicString(eventName.data(), eventName.size()),
        getPerfettoWebPerfTrackSync(toPerfettoTrackName(trackName, trackGroup)),
        highResTimeStampToPerfettoTraceTime(startTime));
  }
#elif defined(WITH_FBSYSTRACE)
  static const char* kTrackName = "# Web Performance: Markers";
  fbsystrace_instant_for_track_with_timedelta(
      TRACE_TAG_REACT, kTrackName, eventName.data(), getDeltaNanos(startTime));
#endif
}

} // namespace facebook::react
