/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>
#include <type_traits>

namespace facebook::react {

/*
 * Represents a monotonic clock suitable for measuring intervals.
 */
using TelemetryClock = std::chrono::steady_clock;

/*
 * Represents a point in time satisfied the requirements of TelemetryClock.
 */
using TelemetryTimePoint = TelemetryClock::time_point;

/*
 * Represents a time interval satisfied the requirements of TelemetryClock.
 */
using TelemetryDuration = std::chrono::nanoseconds;

/*
 * Represents a time point which never happens.
 */
static const TelemetryTimePoint kTelemetryUndefinedTimePoint = TelemetryTimePoint::max();

/*
 * Returns a time point representing the current point in time.
 */
static inline TelemetryTimePoint telemetryTimePointNow()
{
  return TelemetryClock::now();
}

/*
 * Returns a number of milliseconds that passed from some epoch starting time
 * point to a given time point. The epoch starting time point is not specified
 * but stays the same for an application run.
 */
static inline int64_t telemetryTimePointToMilliseconds(TelemetryTimePoint timePoint)
{
  return std::chrono::duration_cast<std::chrono::milliseconds>(timePoint - TelemetryTimePoint{}).count();
}

/*
 * Returns a number of seconds that passed from "Steady Clock" epoch starting
 * time point to a given time point.
 */
static inline double telemetryTimePointToSteadyClockSeconds(TelemetryTimePoint timePoint)
{
  static_assert(
      std::is_same<decltype(timePoint), std::chrono::steady_clock::time_point>::value,
      "`TelemetryClock` must be `std::chrono::steady_clock` to make the "
      "following implementation work correctly.");

  auto nanoseconds = std::chrono::duration_cast<std::chrono::nanoseconds>(timePoint.time_since_epoch()).count();
  return (double)nanoseconds / 1.0e9;
}

/*
 * Converts a time point on one clock to a time point on a different clock.
 */
template <
    typename DestinationTimePointT,
    typename SourceTimePointT,
    typename DestnationClockT = typename DestinationTimePointT::clock,
    typename SourceClockT = typename SourceTimePointT::clock>
DestinationTimePointT clockCast(SourceTimePointT timePoint)
{
  auto sourseClockNow = SourceClockT::now();
  auto destinationClockNow = DestnationClockT::now();
  return std::chrono::time_point_cast<typename DestnationClockT::duration>(
      timePoint - sourseClockNow + destinationClockNow);
}

/*
 * Returns a number of milliseconds that represents the given duration object.
 */
static inline int64_t telemetryDurationToMilliseconds(TelemetryDuration duration)
{
  return std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();
}

} // namespace facebook::react
