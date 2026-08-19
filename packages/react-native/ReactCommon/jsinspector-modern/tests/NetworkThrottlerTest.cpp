/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <jsinspector-modern/network/NetworkThrottler.h>

#include <chrono>

using namespace std::chrono_literals;

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * Records the result of a throttled operation for assertions.
 */
struct RecordedCallback {
  bool released{false};
  bool disconnected{false};
  int64_t bytes{0};

  NetworkThrottler::ThrottleCallback callback() {
    return [this](bool disconnectedArg, int64_t bytesArg) {
      released = true;
      disconnected = disconnectedArg;
      bytes = bytesArg;
    };
  }
};

} // namespace

/**
 * Tests for the throttling algorithm, driven by a fake clock. Scenarios
 * mirror Chromium's throttling_controller_unittest.cc.
 */
class NetworkThrottlerTest : public ::testing::Test {
 protected:
  NetworkThrottlerTest() : throttler_([this] { return now_; }) {
    now_ += 1h; // Arbitrary non-zero baseline
  }

  void advance(NetworkThrottler::Clock::duration duration) {
    now_ += duration;
    throttler_.onTimerFired();
  }

  NetworkThrottler::TimePoint now_{};
  NetworkThrottler throttler_;
};

TEST_F(NetworkThrottlerTest, testUnthrottledPassThrough) {
  RecordedCallback callback;
  EXPECT_EQ(
      throttler_.startThrottle(
          throttler_.createRecordToken(),
          1000,
          now_,
          true,
          false,
          callback.callback()),
      NetworkThrottler::StartResult::PassThrough);
  EXPECT_FALSE(callback.released);
  EXPECT_FALSE(throttler_.isThrottling());
  // No read clamp when download throttling is inactive
  EXPECT_EQ(throttler_.getReadBufLen(65536), 65536);
}

TEST_F(NetworkThrottlerTest, testSingleDownloadCompletesAtThroughputRate) {
  // 150,000 B/s = one 1500-byte packet per 10ms tick
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});
  EXPECT_EQ(throttler_.getReadBufLen(65536), NetworkThrottler::kPacketSize);

  RecordedCallback callback;
  EXPECT_EQ(
      throttler_.startThrottle(
          throttler_.createRecordToken(),
          15000,
          now_,
          false,
          false,
          callback.callback()),
      NetworkThrottler::StartResult::Pending);

  // 15,000 bytes at 150,000 B/s ≈ 100ms
  advance(90ms);
  EXPECT_FALSE(callback.released);
  advance(30ms);
  EXPECT_TRUE(callback.released);
  EXPECT_FALSE(callback.disconnected);
  EXPECT_LT(callback.bytes, 0);
}

TEST_F(NetworkThrottlerTest, testConcurrentDownloadsShareBandwidthEvenly) {
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  RecordedCallback first;
  RecordedCallback second;
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      15000,
      now_,
      false,
      false,
      first.callback());
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      15000,
      now_,
      false,
      false,
      second.callback());

  // Two equal transfers at half bandwidth each ≈ 200ms; neither is starved.
  advance(150ms);
  EXPECT_FALSE(first.released);
  EXPECT_FALSE(second.released);
  advance(80ms);
  EXPECT_TRUE(first.released);
  EXPECT_TRUE(second.released);
}

TEST_F(NetworkThrottlerTest, testSmallTransferFinishesFirst) {
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  RecordedCallback small;
  RecordedCallback large;
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      3000,
      now_,
      false,
      false,
      small.callback());
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      30000,
      now_,
      false,
      false,
      large.callback());

  // The small transfer needs ~3000B at half bandwidth ≈ 40ms.
  advance(60ms);
  EXPECT_TRUE(small.released);
  EXPECT_FALSE(large.released);

  // The large transfer then gets full bandwidth.
  advance(200ms);
  EXPECT_TRUE(large.released);
}

TEST_F(NetworkThrottlerTest, testLatencyIsAMinimumDurationFloor) {
  throttler_.updateConditions(
      NetworkConditions{.offline = false, .latencyMs = 500});

  RecordedCallback callback;
  EXPECT_EQ(
      throttler_.startThrottle(
          throttler_.createRecordToken(),
          0,
          now_,
          true,
          false,
          callback.callback()),
      NetworkThrottler::StartResult::Pending);

  advance(250ms);
  EXPECT_FALSE(callback.released);
  advance(300ms);
  // Released from suspension into the (unlimited-rate) byte queue.
  advance(1ms);
  EXPECT_TRUE(callback.released);
  EXPECT_FALSE(callback.disconnected);
}

TEST_F(NetworkThrottlerTest, testSlowServerIsNotDelayedFurther) {
  throttler_.updateConditions(
      NetworkConditions{.offline = false, .latencyMs = 500});

  // The request really finished sending 600ms ago: the latency floor is
  // already satisfied.
  RecordedCallback callback;
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      0,
      now_ - 600ms,
      true,
      false,
      callback.callback());
  advance(1ms);
  EXPECT_TRUE(callback.released);
}

TEST_F(NetworkThrottlerTest, testLatencyDoesNotApplyToBodyReads) {
  throttler_.updateConditions(
      NetworkConditions{.offline = false, .latencyMs = 500});

  // Non-start operations pass through when throughput is unlimited.
  RecordedCallback callback;
  EXPECT_EQ(
      throttler_.startThrottle(
          throttler_.createRecordToken(),
          3000,
          now_,
          false,
          false,
          callback.callback()),
      NetworkThrottler::StartResult::PassThrough);
}

TEST_F(NetworkThrottlerTest, testByteDebtCarriesAcrossReads) {
  // One packet per 10ms tick
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  auto token = throttler_.createRecordToken();
  RecordedCallback first;
  throttler_.startThrottle(token, 1500, now_, false, false, first.callback());

  // 1500 bytes goes strictly negative on the second tick.
  advance(10ms);
  EXPECT_FALSE(first.released);
  advance(10ms);
  EXPECT_TRUE(first.released);
  EXPECT_EQ(first.bytes, -1500);

  // Carrying the -1500 credit, the next 1500-byte read completes after a
  // single further tick, keeping the aggregate rate accurate.
  RecordedCallback second;
  throttler_.startThrottle(
      token, first.bytes + 1500, now_, false, false, second.callback());
  advance(10ms);
  EXPECT_TRUE(second.released);
}

TEST_F(NetworkThrottlerTest, testGoingOfflineFailsPendingDownloads) {
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  RecordedCallback callback;
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      15000,
      now_,
      false,
      false,
      callback.callback());

  throttler_.updateConditions(NetworkConditions{.offline = true});
  EXPECT_TRUE(callback.released);
  EXPECT_TRUE(callback.disconnected);

  // New downloads fail synchronously; uploads pass through.
  RecordedCallback download;
  EXPECT_EQ(
      throttler_.startThrottle(
          throttler_.createRecordToken(),
          100,
          now_,
          false,
          false,
          download.callback()),
      NetworkThrottler::StartResult::Disconnected);
  RecordedCallback upload;
  EXPECT_EQ(
      throttler_.startThrottle(
          throttler_.createRecordToken(),
          100,
          now_,
          false,
          true,
          upload.callback()),
      NetworkThrottler::StartResult::PassThrough);
}

TEST_F(NetworkThrottlerTest, testDisablingThrottlingReleasesPendingRecords) {
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 500, .downloadThroughputBps = 150000});

  RecordedCallback suspended;
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      0,
      now_,
      true,
      false,
      suspended.callback());
  RecordedCallback queued;
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      15000,
      now_,
      false,
      false,
      queued.callback());

  throttler_.updateConditions(NetworkConditions{});
  EXPECT_TRUE(suspended.released);
  EXPECT_FALSE(suspended.disconnected);
  EXPECT_TRUE(queued.released);
  EXPECT_FALSE(queued.disconnected);
  EXPECT_FALSE(throttler_.getTimerDeadlineForTest().has_value());
}

TEST_F(NetworkThrottlerTest, testStopThrottleRemovesRecordWithoutCallback) {
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  RecordedCallback cancelled;
  auto token = throttler_.createRecordToken();
  throttler_.startThrottle(
      token, 15000, now_, false, false, cancelled.callback());
  throttler_.stopThrottle(token);
  EXPECT_FALSE(throttler_.getTimerDeadlineForTest().has_value());

  advance(1s);
  EXPECT_FALSE(cancelled.released);
}

TEST_F(NetworkThrottlerTest, testConditionsChangeMidFlightAdjustsRate) {
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  RecordedCallback callback;
  throttler_.startThrottle(
      throttler_.createRecordToken(),
      30000,
      now_,
      false,
      false,
      callback.callback());

  // Half the transfer at the original rate (~100ms of 200ms total)
  advance(100ms);
  EXPECT_FALSE(callback.released);

  // Double the rate: the remaining ~15,000 bytes take ~50ms, not 100ms.
  throttler_.updateConditions(
      NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 300000});
  advance(40ms);
  EXPECT_FALSE(callback.released);
  advance(20ms);
  EXPECT_TRUE(callback.released);
}

} // namespace facebook::react::jsinspector_modern
