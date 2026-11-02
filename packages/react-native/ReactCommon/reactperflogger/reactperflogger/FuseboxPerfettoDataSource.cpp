/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef WITH_PERFETTO

#if defined(__ANDROID__)
#include <android/log.h>
#endif // __ANDROID__
#include <folly/json.h>
#include <hermes/hermes.h>
#include <perfetto.h>
#include <iostream>
#include <sstream>

#include <reactperflogger/fusebox/FuseboxTracer.h>
#include "FuseboxPerfettoDataSource.h"
#include "ReactPerfetto.h"

namespace facebook::react {

namespace {

const std::string JS_SAMPLING_TRACK = "JS Sampling";

const int SAMPLING_HZ = 1000;

#if defined(__ANDROID__)
std::string getApplicationId() {
  pid_t pid = getpid();
  char path[64] = {0};
  snprintf(path, sizeof(path), "/proc/%d/cmdline", pid);
  FILE* cmdline = fopen(path, "r");
  if (cmdline) {
    char application_id[64] = {0};
    fread(application_id, sizeof(application_id), 1, cmdline);
    fclose(cmdline);
    return application_id;
  }
  return "";
}
#endif // __ANDROID__

uint64_t hermesToPerfettoTime(int64_t hermesTs) {
  return (hermesTs / 1000);
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
  for (size_t i = 0; i < stack.size(); i++) {
    const auto& frame = stack[i];
    // Omit elements that are not the first 25 or the last 25
    if (i > 25 && i < stack.size() - 25) {
      if (i == 26) {
        FuseboxTracer::getFuseboxTracer().addEvent(
            "...", start, end, JS_SAMPLING_TRACK);
      }
      continue;
    }
    std::string name = frame["name"].asString();
    FuseboxTracer::getFuseboxTracer().addEvent(
        name, start, end, JS_SAMPLING_TRACK);
  }
}

void logHermesProfileToFusebox(const std::string& traceStr) {
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

void FuseboxPerfettoDataSource::OnStart(const StartArgs&) {
  FuseboxTracer::getFuseboxTracer().startTracing();
  auto* hermesAPI =
      castInterface<hermes::IHermesRootAPI>(hermes::makeHermesRootAPI());
  hermesAPI->enableSamplingProfiler(SAMPLING_HZ);
}

void FuseboxPerfettoDataSource::OnFlush(const FlushArgs&) {}

void FuseboxPerfettoDataSource::OnStop(const StopArgs& a) {
  std::stringstream stream;
  auto* hermesAPI =
      castInterface<hermes::IHermesRootAPI>(hermes::makeHermesRootAPI());
  hermesAPI->dumpSampledTraceToStream(stream);
  std::string trace = stream.str();
  logHermesProfileToFusebox(trace);

#if defined(__ANDROID__)
  // XXX: Adjust the package ID. Writing to other global tmp directories
  // seems to fail.
  std::string appId = getApplicationId();
  __android_log_print(
      ANDROID_LOG_INFO, "FuseboxTracer", "Application ID: %s", appId.c_str());
  FuseboxTracer::getFuseboxTracer().stopTracingAndWriteToFile(
      "/data/data/" + appId + "/cache/hermes_trace.json");
#endif // __ANDROID__
}

} // namespace facebook::react

PERFETTO_DEFINE_DATA_SOURCE_STATIC_MEMBERS(
    facebook::react::FuseboxPerfettoDataSource);

#endif // WITH_PERFETTO
