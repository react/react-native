/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>

#include "perfetto.h"

#define RENDER_FRAME_EVENT()      \
  TRACE_EVENT("rncxx", "render"); \
  facebook::react::FrameStatsBlock __frameStatsBlock_##__LINE__;

#define PROCESS_FRAME_EVENT()    \
  TRACE_EVENT("rncxx", "frame"); \
  facebook::react::FrameStatsBlock __frameStatsBlock_##__LINE__;

namespace facebook::react {
class TimeSeries;

void enableFrameStatsPrinting(bool enable = true);
void logFrameStats(double timeStampMs, double durationMs);

inline double getTimeStampMs() {
  return std::chrono::duration_cast<std::chrono::nanoseconds>(
             std::chrono::high_resolution_clock::now().time_since_epoch())
             .count() /
      1000000.0;
}

class FrameStatsBlock {
 public:
  FrameStatsBlock() : startTimeStamp_(getTimeStampMs()) {}

  ~FrameStatsBlock() {
    logFrameStats(startTimeStamp_, getTimeStampMs() - startTimeStamp_);
  }

 private:
  double startTimeStamp_;
};

} // namespace facebook::react
