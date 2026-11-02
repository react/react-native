/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef WITH_PERFETTO

#include <folly/json.h>
#include <hermes/hermes.h>
#include <perfetto.h>
#include <iostream>
#include <sstream>

#include "HermesPerfettoDataSource.h"
#include "ReactPerfetto.h"

namespace facebook::react {

namespace {

const int SAMPLING_HZ = 100;

int64_t hermesDeltaTime = 0;

uint64_t hermesToPerfettoTime(int64_t hermesTs) {
  if (hermesDeltaTime == 0) {
    hermesDeltaTime = TrackEvent::GetTraceTimeNs() -
        std::chrono::steady_clock::now().time_since_epoch().count();
  }
  return (hermesTs * 1000 + hermesDeltaTime);
}

std::vector<folly::dynamic> getStack(
    const folly::dynamic& trace,
    const folly::dynamic& sample) {
  std::vector<folly::dynamic> stack;

  auto stackFrameId = sample["sf"];
  auto stackFrame = trace["stackFrames"][stackFrameId.asString()];

  while (!stackFrame.isNull()) {
    stack.push_back(stackFrame);
    auto parentStackFrameId = stackFrame["parent"];
    if (parentStackFrameId.isNull()) {
      break; // No more parents, we're done with this stack frame
    }
    stackFrame = trace["stackFrames"][parentStackFrameId.asString()];
  }
  std::reverse(stack.begin(), stack.end());
  return stack;
}

void flushSample(
    const std::vector<folly::dynamic>& stack,
    uint64_t start,
    uint64_t end) {
  auto track = getPerfettoWebPerfTrackSync("JS Sampling");
  for (size_t i = 0; i < stack.size(); i++) {
    const auto& frame = stack[i];
    // Omit elements that are not the first 25 or the last 25
    if (i > 25 && i < stack.size() - 25) {
      if (i == 26) {
        TRACE_EVENT_BEGIN(
            "react-native", perfetto::DynamicString{"..."}, track, start);
        TRACE_EVENT_END("react-native", track, end);
      }
      continue;
    }
    std::string name = frame["name"].asString();
    TRACE_EVENT_BEGIN(
        "react-native", perfetto::DynamicString{name}, track, start);
    TRACE_EVENT_END("react-native", track, end);
  }
}

void logHermesProfileToPerfetto(const std::string& traceStr) {
  auto trace = folly::parseJson(traceStr);
  auto samples = trace["samples"];

  std::vector previousStack = std::vector<folly::dynamic>();
  uint64_t previousStartTS = 0;
  uint64_t previousEndTS = 0;
  for (const auto& sample : samples) {
    auto perfettoTS = hermesToPerfettoTime(sample["ts"].asInt());

    // Flush previous sample
    if (previousStack.size() > 0) {
      flushSample(
          previousStack,
          previousStartTS,
          std::min(previousEndTS, perfettoTS - 1));
    }

    previousStack = getStack(trace, sample);
    previousStartTS = perfettoTS;
    previousEndTS = previousStartTS + 1000000000 / SAMPLING_HZ;
  }
  if (previousStack.size() > 0) {
    flushSample(previousStack, previousStartTS, previousEndTS);
  }
}

} // namespace

void HermesPerfettoDataSource::OnStart(const StartArgs&) {
  auto* hermesAPI =
      castInterface<hermes::IHermesRootAPI>(hermes::makeHermesRootAPI());
  hermesAPI->enableSamplingProfiler(SAMPLING_HZ);
  TRACE_EVENT_INSTANT(
      "react-native",
      perfetto::DynamicString{"Profiling Started"},
      getPerfettoWebPerfTrackSync("JS Sampling"),
      TrackEvent::GetTraceTimeNs());
}

void HermesPerfettoDataSource::OnFlush(const FlushArgs&) {
  // NOTE: We write data during OnFlush and not OnStop because we can't
  //       use the TRACE_EVENT macros in OnStop.
  auto* hermesAPI =
      castInterface<hermes::IHermesRootAPI>(hermes::makeHermesRootAPI());
  std::stringstream stream;
  hermesAPI->dumpSampledTraceToStream(stream);
  std::string trace = stream.str();
  logHermesProfileToPerfetto(trace);
}

void HermesPerfettoDataSource::OnStop(const StopArgs& a) {
  auto* hermesAPI =
      castInterface<hermes::IHermesRootAPI>(hermes::makeHermesRootAPI());
  hermesAPI->disableSamplingProfiler();
}

} // namespace facebook::react

PERFETTO_DEFINE_DATA_SOURCE_STATIC_MEMBERS(
    facebook::react::HermesPerfettoDataSource);

#endif // WITH_PERFETTO
