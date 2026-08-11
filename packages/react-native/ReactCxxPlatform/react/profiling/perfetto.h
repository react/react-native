/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/profiling/tracy_noop.h>

#include <cstdint>

#ifndef WITH_PERFETTO
#define WITH_PERFETTO 0
#endif

#if WITH_PERFETTO
#include <perfetto.h>

PERFETTO_DEFINE_CATEGORIES_IN_NAMESPACE(
    facebook::react,
    perfetto::Category("rncxx").SetDescription("Events from RN/Granite"));

void initializePerfetto();

inline uint64_t getCurrentPerfettoTimestamp() {
  return std::chrono::duration_cast<std::chrono::nanoseconds>(
             std::chrono::high_resolution_clock::now().time_since_epoch())
      .count();
}

#else
#define TRACE_EVENT(category, name, ...) SCOPED_TRACE_CPU((category "_" name))
#define TRACE_COUNTER(category, name, value, ...)

inline void initializePerfetto() {}
#endif // WITH_PERFETTO
