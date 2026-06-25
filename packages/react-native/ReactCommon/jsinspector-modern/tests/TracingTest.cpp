/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TracingTest.h"
#include "engines/JsiIntegrationTestHermesEngineAdapter.h"

#include <folly/executors/QueuedImmediateExecutor.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/networking/NetworkReporter.h>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

class TracingTest : public TracingTestBase<
                        JsiIntegrationTestHermesEngineAdapter,
                        folly::QueuedImmediateExecutor> {
 protected:
  TracingTest() : TracingTestBase() {}

  void SetUp() override {
    JsiIntegrationPortableTestBase::SetUp();
    connect();
    EXPECT_CALL(
        fromPage(),
        onMessage(
            JsonParsed(AllOf(AtJsonPtr("/method", "Debugger.scriptParsed")))))
        .Times(AnyNumber());
  }
};

TEST_F(TracingTest, EnablesSamplingProfilerOnlyCategoryIsSpecified) {
  InSequence s;

  startTracing({});
  auto allTraceEvents = endTracingAndCollectEvents();

  EXPECT_THAT(
      allTraceEvents,
      Not(Contains(AllOf(
          AtJsonPtr("/name", "Profile"),
          AtJsonPtr("/cat", "disabled-by-default-v8.cpu_profiler")))));

  startTracing({tracing::Category::JavaScriptSampling});
  allTraceEvents = endTracingAndCollectEvents();

  EXPECT_THAT(
      allTraceEvents,
      Contains(AllOf(
          AtJsonPtr("/name", "Profile"),
          AtJsonPtr("/cat", "disabled-by-default-v8.cpu_profiler"))));
}

TEST_F(TracingTest, RecordsFrameTimings) {
  InSequence s;

  page_->startTracing(tracing::Mode::Background, {tracing::Category::Timeline});

  auto now = HighResTimeStamp::now();
  auto frameTimingSequence = tracing::FrameTimingSequence(
      1, // id
      11, // threadId
      now,
      now + HighResDuration::fromNanoseconds(50));

  page_->recordFrameTimings(frameTimingSequence);

  auto tracingProfile = page_->stopTracing();
  EXPECT_EQ(tracingProfile.frameTimings.size(), 1u);
  EXPECT_EQ(tracingProfile.frameTimings[0].id, frameTimingSequence.id);
}

TEST_F(TracingTest, EmitsRecordedFrameTimingSequences) {
  InSequence s;

  startTracing();
  auto now = HighResTimeStamp::now();
  page_->recordFrameTimings(
      tracing::FrameTimingSequence(
          1, // id
          11, // threadId
          now,
          now + HighResDuration::fromNanoseconds(50)));

  auto allTraceEvents = endTracingAndCollectEvents();
  EXPECT_THAT(allTraceEvents, Contains(AtJsonPtr("/name", "BeginFrame")));
  EXPECT_THAT(allTraceEvents, Contains(AtJsonPtr("/name", "DrawFrame")));
}

TEST_F(TracingTest, EmitsScreenshotEventWhenScreenshotValuePassed) {
  InSequence s;

  startTracing({tracing::Category::Screenshot});
  auto now = HighResTimeStamp::now();
  page_->recordFrameTimings(
      tracing::FrameTimingSequence(
          1, // id
          11, // threadId
          now,
          now + HighResDuration::fromNanoseconds(50),
          std::vector<uint8_t>{}));

  auto allTraceEvents = endTracingAndCollectEvents();
  EXPECT_THAT(allTraceEvents, Contains(AtJsonPtr("/name", "Screenshot")));
}

TEST_F(
    TracingTest,
    SecondSessionTracingStartIsRejectedWhileFirstSessionIsTracing) {
  auto secondary = connectSecondary();
  InSequence s;

  // Session 1 starts tracing successfully
  startTracing();

  // Session 2 tries to start tracing - should get error
  EXPECT_CALL(
      secondary.fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/id", 2),
          AtJsonPtr("/error/message", "Tracing has already been started")))));
  secondary.toPage().sendMessage(R"({"id": 2, "method": "Tracing.start"})");

  // Session 1 ends tracing normally
  endTracingAndCollectEvents();

  // Now Session 2 can start tracing
  EXPECT_CALL(
      secondary.fromPage(), onMessage(JsonEq(R"({"id": 3, "result": {}})")));
  secondary.toPage().sendMessage(R"({"id": 3, "method": "Tracing.start"})");

  // Clean up - end secondary's tracing
  EXPECT_CALL(
      secondary.fromPage(), onMessage(JsonEq(R"({"id": 4, "result": {}})")));
  EXPECT_CALL(
      secondary.fromPage(),
      onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.dataCollected"))))
      .Times(AtLeast(1));
  EXPECT_CALL(
      secondary.fromPage(),
      onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.tracingComplete"))));
  secondary.toPage().sendMessage(R"({"id": 4, "method": "Tracing.end"})");
}

TEST_F(TracingTest, CDPTracingPreemptsBackgroundTracing) {
  InSequence s;

  // Start background tracing directly
  page_->startTracing(tracing::Mode::Background, {});

  // CDP Tracing.start should preempt background (succeed, not fail)
  startTracing();

  // End tracing normally
  endTracingAndCollectEvents();
}

TEST_F(TracingTest, BackgroundTracingIsRejectedWhileCDPTracingIsRunning) {
  InSequence s;

  // Start CDP tracing
  startTracing();

  // Background tracing should be rejected
  bool started = page_->startTracing(tracing::Mode::Background, {});
  EXPECT_FALSE(started);

  // End CDP tracing
  endTracingAndCollectEvents();

  // Now background tracing should succeed
  started = page_->startTracing(tracing::Mode::Background, {});
  EXPECT_TRUE(started);

  // Clean up
  page_->stopTracing();
}

TEST_F(TracingTest, EmitsToAllSessionsWithReactNativeApplicationDomainEnabled) {
  auto secondaryFusebox = this->connectSecondary();
  auto secondaryNonFusebox = this->connectSecondary();

  // Enable ReactNativeApplication domain on primary and secondaryFusebox
  // sessions (but NOT on secondaryNonFusebox)
  {
    InSequence s;
    EXPECT_CALL(
        this->fromPage(),
        onMessage(JsonParsed(
            AtJsonPtr("/method", "ReactNativeApplication.metadataUpdated"))));
    EXPECT_CALL(
        this->fromPage(), onMessage(JsonEq(R"({"id": 1, "result": {}})")));
  }
  this->toPage_->sendMessage(
      R"({"id": 1, "method": "ReactNativeApplication.enable"})");

  {
    InSequence s;
    EXPECT_CALL(
        secondaryFusebox.fromPage(),
        onMessage(JsonParsed(
            AtJsonPtr("/method", "ReactNativeApplication.metadataUpdated"))));
    EXPECT_CALL(
        secondaryFusebox.fromPage(),
        onMessage(JsonEq(R"({"id": 1, "result": {}})")));
  }
  secondaryFusebox.toPage().sendMessage(
      R"({"id": 1, "method": "ReactNativeApplication.enable"})");

  // Start background tracing
  this->page_->startTracing(
      tracing::Mode::Background, {tracing::Category::Timeline});

  // Record some frame timings
  auto now = HighResTimeStamp::now();
  this->page_->recordFrameTimings(
      tracing::FrameTimingSequence(
          1, // id
          11, // threadId
          now,
          now + HighResDuration::fromNanoseconds(50)));

  // Primary and secondaryFusebox sessions should receive the trace.
  // Events within each session are ordered, but order between sessions is
  // arbitrary.
  Sequence primarySeq;
  Sequence secondarySeq;

  EXPECT_CALL(
      this->fromPage(),
      onMessage(JsonParsed(
          AtJsonPtr("/method", "ReactNativeApplication.traceRequested"))))
      .InSequence(primarySeq);
  EXPECT_CALL(
      this->fromPage(),
      onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.dataCollected"))))
      .Times(AtLeast(1))
      .InSequence(primarySeq);
  EXPECT_CALL(
      this->fromPage(),
      onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.tracingComplete"))))
      .InSequence(primarySeq);

  EXPECT_CALL(
      secondaryFusebox.fromPage(),
      onMessage(JsonParsed(
          AtJsonPtr("/method", "ReactNativeApplication.traceRequested"))))
      .InSequence(secondarySeq);
  EXPECT_CALL(
      secondaryFusebox.fromPage(),
      onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.dataCollected"))))
      .Times(AtLeast(1))
      .InSequence(secondarySeq);
  EXPECT_CALL(
      secondaryFusebox.fromPage(),
      onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.tracingComplete"))))
      .InSequence(secondarySeq);

  // secondaryNonFusebox should NOT receive anything (it did not enable the
  // domain)
  EXPECT_CALL(secondaryNonFusebox.fromPage(), onMessage(_)).Times(0);

  // Stop tracing and emit to all eligible sessions
  EXPECT_TRUE(this->page_->stopAndMaybeEmitBackgroundTrace());
}

TEST_F(TracingTest, StashedTraceIsEmittedOnlyToFirstEligibleSession) {
  // Start background tracing with no sessions having ReactNativeApplication
  // enabled
  this->page_->startTracing(
      tracing::Mode::Background, {tracing::Category::Timeline});

  // Record some frame timings
  auto now = HighResTimeStamp::now();
  this->page_->recordFrameTimings(
      tracing::FrameTimingSequence(
          1, // id
          11, // threadId
          now,
          now + HighResDuration::fromNanoseconds(50)));

  // Stop tracing - no eligible sessions exist, so the trace is stashed
  EXPECT_FALSE(this->page_->stopAndMaybeEmitBackgroundTrace());

  // Now the primary session enables ReactNativeApplication - it should receive
  // the stashed trace. Events within a session are ordered.
  Sequence primarySeq;
  EXPECT_CALL(
      this->fromPage(),
      onMessage(JsonParsed(
          AtJsonPtr("/method", "ReactNativeApplication.metadataUpdated"))))
      .InSequence(primarySeq);
  EXPECT_CALL(
      this->fromPage(),
      onMessage(JsonParsed(
          AtJsonPtr("/method", "ReactNativeApplication.traceRequested"))))
      .InSequence(primarySeq);
  EXPECT_CALL(
      this->fromPage(),
      onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.dataCollected"))))
      .Times(AtLeast(1))
      .InSequence(primarySeq);
  EXPECT_CALL(
      this->fromPage(),
      onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.tracingComplete"))))
      .InSequence(primarySeq);
  EXPECT_CALL(this->fromPage(), onMessage(JsonEq(R"({"id": 1, "result": {}})")))
      .InSequence(primarySeq);
  this->toPage_->sendMessage(
      R"({"id": 1, "method": "ReactNativeApplication.enable"})");

  // Connect a secondary session and enable ReactNativeApplication - it should
  // NOT receive the already-emitted stashed trace
  auto secondary = this->connectSecondary();
  Sequence secondarySeq;
  EXPECT_CALL(
      secondary.fromPage(),
      onMessage(JsonParsed(
          AtJsonPtr("/method", "ReactNativeApplication.metadataUpdated"))))
      .InSequence(secondarySeq);
  // No traceRequested, dataCollected, or tracingComplete expected for
  // secondary
  EXPECT_CALL(
      secondary.fromPage(), onMessage(JsonEq(R"({"id": 1, "result": {}})")))
      .InSequence(secondarySeq);
  secondary.toPage().sendMessage(
      R"({"id": 1, "method": "ReactNativeApplication.enable"})");
}

} // namespace facebook::react::jsinspector_modern
