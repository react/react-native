/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <hermes/inspector-modern/chrome/HermesRuntimeSamplingProfileSerializer.h>

#include <hermes/Public/SamplingProfiler.h>

#include <gtest/gtest.h>

#include <deque>
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

namespace fhsp = facebook::hermes::sampling_profiler;

using Kind = RuntimeSamplingProfile::SampleCallStackFrame::Kind;

namespace {

fhsp::Profile makeProfile(std::vector<fhsp::ProfileSample> samples) {
  return fhsp::Profile{
      std::move(samples), std::make_unique<std::deque<std::string>>()};
}

fhsp::ProfileSample makeSample(
    uint64_t timestamp,
    uint64_t threadId,
    std::vector<fhsp::ProfileSampleCallStackFrame> callStack) {
  return fhsp::ProfileSample{timestamp, threadId, std::move(callStack)};
}

} // namespace

TEST(
    HermesRuntimeSamplingProfileSerializerTest,
    serializesJSFunctionFrameAndConvertsLineAndColumnToZeroBased) {
  std::vector<fhsp::ProfileSampleCallStackFrame> callStack;
  // Hermes reports 1-based line/column numbers.
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackJSFunctionFrame{
          "myFunction",
          /* scriptId */ 42,
          /* scriptUrl */ "app.js",
          /* lineNumber */ 10,
          /* columnNumber */ 5});

  std::vector<fhsp::ProfileSample> samples;
  samples.emplace_back(makeSample(1000, 7, std::move(callStack)));

  auto profile =
      HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
          makeProfile(std::move(samples)));

  EXPECT_EQ(profile.runtimeName, "Hermes");
  ASSERT_EQ(profile.samples.size(), 1);

  const auto& sample = profile.samples[0];
  EXPECT_EQ(sample.timestamp, 1000u);
  EXPECT_EQ(sample.threadId, 7u);
  ASSERT_EQ(sample.callStack.size(), 1);

  const auto& frame = sample.callStack[0];
  EXPECT_EQ(frame.kind, Kind::JSFunction);
  EXPECT_EQ(frame.scriptId, 42u);
  EXPECT_EQ(frame.functionName, std::string_view{"myFunction"});
  ASSERT_TRUE(frame.scriptURL.has_value());
  EXPECT_EQ(*frame.scriptURL, std::string_view{"app.js"});
  // 1-based -> 0-based conversion.
  ASSERT_TRUE(frame.lineNumber.has_value());
  EXPECT_EQ(*frame.lineNumber, 9u);
  ASSERT_TRUE(frame.columnNumber.has_value());
  EXPECT_EQ(*frame.columnNumber, 4u);
}

TEST(
    HermesRuntimeSamplingProfileSerializerTest,
    serializesJSFunctionFrameWithoutSourceLocationLeavesOptionalsEmpty) {
  std::vector<fhsp::ProfileSampleCallStackFrame> callStack;
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackJSFunctionFrame{
          "anonymous", /* scriptId */ 3});

  std::vector<fhsp::ProfileSample> samples;
  samples.emplace_back(makeSample(500, 1, std::move(callStack)));

  auto profile =
      HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
          makeProfile(std::move(samples)));

  ASSERT_EQ(profile.samples.size(), 1);
  ASSERT_EQ(profile.samples[0].callStack.size(), 1);

  const auto& frame = profile.samples[0].callStack[0];
  EXPECT_EQ(frame.kind, Kind::JSFunction);
  EXPECT_EQ(frame.scriptId, 3u);
  EXPECT_EQ(frame.functionName, std::string_view{"anonymous"});
  EXPECT_FALSE(frame.scriptURL.has_value());
  EXPECT_FALSE(frame.lineNumber.has_value());
  EXPECT_FALSE(frame.columnNumber.has_value());
}

TEST(
    HermesRuntimeSamplingProfileSerializerTest,
    serializesNativeAndHostFramesWithFallbackScriptId) {
  std::vector<fhsp::ProfileSampleCallStackFrame> callStack;
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackNativeFunctionFrame{"arrayPrototypeMap"});
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackHostFunctionFrame{"nativeLog"});

  std::vector<fhsp::ProfileSample> samples;
  samples.emplace_back(makeSample(1, 1, std::move(callStack)));

  auto profile =
      HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
          makeProfile(std::move(samples)));

  ASSERT_EQ(profile.samples.size(), 1);
  const auto& frames = profile.samples[0].callStack;
  ASSERT_EQ(frames.size(), 2);

  EXPECT_EQ(frames[0].kind, Kind::NativeFunction);
  EXPECT_EQ(frames[0].functionName, std::string_view{"arrayPrototypeMap"});
  // Native functions are implemented by the VM, no script to reference.
  EXPECT_EQ(frames[0].scriptId, 0u);
  EXPECT_FALSE(frames[0].scriptURL.has_value());

  EXPECT_EQ(frames[1].kind, Kind::HostFunction);
  EXPECT_EQ(frames[1].functionName, std::string_view{"nativeLog"});
  EXPECT_EQ(frames[1].scriptId, 0u);
  EXPECT_FALSE(frames[1].scriptURL.has_value());
}

TEST(
    HermesRuntimeSamplingProfileSerializerTest,
    serializesGarbageCollectorSuspendFrame) {
  std::vector<fhsp::ProfileSampleCallStackFrame> callStack;
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackSuspendFrame{
          fhsp::ProfileSampleCallStackSuspendFrame::SuspendFrameKind::GC});

  std::vector<fhsp::ProfileSample> samples;
  samples.emplace_back(makeSample(1, 1, std::move(callStack)));

  auto profile =
      HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
          makeProfile(std::move(samples)));

  ASSERT_EQ(profile.samples.size(), 1);
  // GC suspend frames are surfaced (unlike other suspend frames).
  ASSERT_EQ(profile.samples[0].callStack.size(), 1);
  EXPECT_EQ(profile.samples[0].callStack[0].kind, Kind::GarbageCollector);
}

TEST(
    HermesRuntimeSamplingProfileSerializerTest,
    filtersOutNonGarbageCollectorSuspendFrames) {
  std::vector<fhsp::ProfileSampleCallStackFrame> callStack;
  // Debugger and Multiple suspend frames must be dropped, GC and JS kept.
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackSuspendFrame{
          fhsp::ProfileSampleCallStackSuspendFrame::SuspendFrameKind::
              Debugger});
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackSuspendFrame{
          fhsp::ProfileSampleCallStackSuspendFrame::SuspendFrameKind::
              Multiple});
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackSuspendFrame{
          fhsp::ProfileSampleCallStackSuspendFrame::SuspendFrameKind::GC});
  callStack.emplace_back(
      fhsp::ProfileSampleCallStackJSFunctionFrame{"keptFn", /* scriptId */ 8});

  std::vector<fhsp::ProfileSample> samples;
  samples.emplace_back(makeSample(1, 1, std::move(callStack)));

  auto profile =
      HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
          makeProfile(std::move(samples)));

  ASSERT_EQ(profile.samples.size(), 1);
  const auto& frames = profile.samples[0].callStack;
  ASSERT_EQ(frames.size(), 2);
  EXPECT_EQ(frames[0].kind, Kind::GarbageCollector);
  EXPECT_EQ(frames[1].kind, Kind::JSFunction);
  EXPECT_EQ(frames[1].functionName, std::string_view{"keptFn"});
}

TEST(
    HermesRuntimeSamplingProfileSerializerTest,
    preservesSampleOrderAndPerSampleMetadata) {
  std::vector<fhsp::ProfileSample> samples;
  {
    std::vector<fhsp::ProfileSampleCallStackFrame> callStack;
    callStack.emplace_back(
        fhsp::ProfileSampleCallStackJSFunctionFrame{"first", /* scriptId */ 1});
    samples.emplace_back(makeSample(100, 11, std::move(callStack)));
  }
  {
    std::vector<fhsp::ProfileSampleCallStackFrame> callStack;
    callStack.emplace_back(
        fhsp::ProfileSampleCallStackJSFunctionFrame{
            "second", /* scriptId */ 2});
    samples.emplace_back(makeSample(200, 22, std::move(callStack)));
  }

  auto profile =
      HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
          makeProfile(std::move(samples)));

  ASSERT_EQ(profile.samples.size(), 2);

  EXPECT_EQ(profile.samples[0].timestamp, 100u);
  EXPECT_EQ(profile.samples[0].threadId, 11u);
  ASSERT_EQ(profile.samples[0].callStack.size(), 1);
  EXPECT_EQ(
      profile.samples[0].callStack[0].functionName, std::string_view{"first"});

  EXPECT_EQ(profile.samples[1].timestamp, 200u);
  EXPECT_EQ(profile.samples[1].threadId, 22u);
  ASSERT_EQ(profile.samples[1].callStack.size(), 1);
  EXPECT_EQ(
      profile.samples[1].callStack[0].functionName, std::string_view{"second"});
}

} // namespace facebook::react::jsinspector_modern::tracing
