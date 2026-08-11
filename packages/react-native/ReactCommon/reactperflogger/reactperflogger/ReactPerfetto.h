/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef WITH_PERFETTO

#include <perfetto.h>
#include <react/timing/primitives.h>
#include <reactperflogger/ReactPerfettoCategories.h>
#include <string>

namespace facebook::react {

void initializePerfetto();

perfetto::Track getPerfettoWebPerfTrackSync(const std::string& trackName);
perfetto::Track getPerfettoWebPerfTrackAsync(const std::string& trackName);

uint64_t highResTimeStampToPerfettoTraceTime(HighResTimeStamp timestamp);

} // namespace facebook::react

#endif // WITH_PERFETTO
