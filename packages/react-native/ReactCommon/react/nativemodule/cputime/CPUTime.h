/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if defined USE_POSIX_TIME
#include <time.h>
#elif defined __MACH__
#include <mach/mach_time.h>
#else
#include <chrono>
#endif

#ifdef USE_POSIX_TIME

namespace {
const double NANOSECONDS_IN_A_SECOND = 1000000000;
} // namespace

#endif

#ifdef __MACH__

namespace {
inline double getConversionFactor() {
  double conversionFactor;
  mach_timebase_info_data_t info;
  mach_timebase_info(&info);
  conversionFactor = static_cast<double>(info.numer) / info.denom;
  return conversionFactor;
}
} // namespace

#endif

namespace facebook::react {

#if defined USE_POSIX_TIME

inline double getCPUTimeNanos() {
  struct timespec time {};
  clock_gettime(CLOCK_THREAD_CPUTIME_ID, &time);
  return static_cast<double>(time.tv_sec) * NANOSECONDS_IN_A_SECOND +
      static_cast<double>(time.tv_nsec);
}

inline bool hasAccurateCPUTimeNanosForBenchmarks() {
  return true;
}

#elif defined __MACH__

inline double getCPUTimeNanos() {
  static auto conversionFactor = getConversionFactor();
  uint64_t time = mach_absolute_time();
  return static_cast<double>(time) * conversionFactor;
}

inline bool hasAccurateCPUTimeNanosForBenchmarks() {
  return true;
}

#else

inline double getCPUTimeNanos() {
  auto now = std::chrono::steady_clock::now();
  return static_cast<double>(
      std::chrono::duration_cast<std::chrono::nanoseconds>(
          now.time_since_epoch())
          .count());
}

inline bool hasAccurateCPUTimeNanosForBenchmarks() {
  return false;
}

#endif

} // namespace facebook::react
