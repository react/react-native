/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>

#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern::tracing {

// The Tracing Clock time origin is the steady_clock epoch. This is mostly done
// to replicate Chromium's behavior, but also saves us from aligning custom
// DOMHighResTimeStamps that can be specified in performance.mark /
// performance.measure calls: these should not extend the timeline window, this
// is the current approach in Chromium.
constexpr HighResTimeStamp TRACING_TIME_ORIGIN =
    HighResTimeStamp::fromChronoSteadyClockTimePoint(
        std::chrono::steady_clock::time_point());

// Tracing timestamps are represented a time value in microseconds since
// arbitrary time origin (epoch) with no fractional part.
inline uint64_t highResTimeStampToTracingClockTimeStamp(
    HighResTimeStamp timestamp) {
  assert(
      timestamp >= TRACING_TIME_ORIGIN &&
      "Provided timestamp is before time origin");
  auto duration = timestamp - TRACING_TIME_ORIGIN;
  return static_cast<uint64_t>(
      static_cast<double>(duration.toNanoseconds()) / 1e3);
}

inline int64_t highResDurationToTracingClockDuration(HighResDuration duration) {
  return static_cast<int64_t>(
      static_cast<double>(duration.toNanoseconds()) / 1e3);
}

} // namespace facebook::react::jsinspector_modern::tracing
