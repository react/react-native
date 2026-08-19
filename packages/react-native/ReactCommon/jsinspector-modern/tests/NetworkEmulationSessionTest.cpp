/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <jsinspector-modern/network/NetworkThrottler.h>
#include <react/networking/NetworkEmulationSession.h>

#include <chrono>
#include <memory>

using namespace std::chrono_literals;

namespace facebook::react {

/**
 * Tests for the per-request session wrapper over the throttling engine,
 * driven by a fake clock. Focused on the invariants the session encapsulates
 * on behalf of integrating networking stacks: byte-debt carry, cancellation
 * safety, and offline semantics.
 */
class NetworkEmulationSessionTest : public ::testing::Test {
 protected:
  NetworkEmulationSessionTest() : throttler_([this] { return now_; }) {
    now_ += 1h; // Arbitrary non-zero baseline
  }

  std::unique_ptr<NetworkEmulationSession> makeSession() {
    return std::unique_ptr<NetworkEmulationSession>(
        new NetworkEmulationSession(throttler_));
  }

  void advance(jsinspector_modern::NetworkThrottler::Clock::duration duration) {
    now_ += duration;
    throttler_.onTimerFired();
  }

  jsinspector_modern::NetworkThrottler::TimePoint now_{};
  jsinspector_modern::NetworkThrottler throttler_;
};

TEST_F(NetworkEmulationSessionTest, testPassThroughWhenUnthrottled) {
  auto session = makeSession();
  EXPECT_EQ(
      session->throttleHeaders([](bool) { FAIL(); }),
      NetworkEmulationSession::Result::PassThrough);
  EXPECT_EQ(
      session->throttleBody(1000, [](bool) { FAIL(); }),
      NetworkEmulationSession::Result::PassThrough);
  EXPECT_EQ(session->recommendedReadLength(65536), 65536);
}

TEST_F(NetworkEmulationSessionTest, testByteDebtCarriedInternally) {
  // One 1500-byte packet per 10ms tick
  throttler_.updateConditions(
      jsinspector_modern::NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  auto session = makeSession();
  EXPECT_EQ(session->recommendedReadLength(65536), 1500);

  bool released = false;
  EXPECT_EQ(
      session->throttleBody(
          1500,
          [&](bool disconnected) {
            released = true;
            EXPECT_FALSE(disconnected);
          }),
      NetworkEmulationSession::Result::Pending);
  advance(10ms);
  EXPECT_FALSE(released);
  advance(10ms);
  EXPECT_TRUE(released);

  // The -1500 remainder is carried by the session: the next equal-sized read
  // completes after a single further tick, with no caller-side arithmetic.
  bool secondReleased = false;
  session->throttleBody(1500, [&](bool) { secondReleased = true; });
  advance(10ms);
  EXPECT_TRUE(secondReleased);
}

TEST_F(NetworkEmulationSessionTest, testHeadersHonorLatencyFloor) {
  throttler_.updateConditions(
      jsinspector_modern::NetworkConditions{
          .offline = false, .latencyMs = 500});

  auto session = makeSession();
  session->noteRequestSentAt(now_);

  bool released = false;
  EXPECT_EQ(
      session->throttleHeaders([&](bool) { released = true; }),
      NetworkEmulationSession::Result::Pending);
  advance(250ms);
  EXPECT_FALSE(released);
  advance(300ms);
  advance(1ms);
  EXPECT_TRUE(released);
}

TEST_F(NetworkEmulationSessionTest, testCancelSuppressesCallback) {
  throttler_.updateConditions(
      jsinspector_modern::NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  auto session = makeSession();
  bool released = false;
  session->throttleBody(15000, [&](bool) { released = true; });
  session->cancel();

  advance(1s);
  EXPECT_FALSE(released);

  // A cancelled session passes subsequent operations through.
  EXPECT_EQ(
      session->throttleBody(1500, [](bool) { FAIL(); }),
      NetworkEmulationSession::Result::PassThrough);
}

TEST_F(NetworkEmulationSessionTest, testDestructionSuppressesCallback) {
  throttler_.updateConditions(
      jsinspector_modern::NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  bool released = false;
  {
    auto session = makeSession();
    session->throttleBody(15000, [&](bool) { released = true; });
  }
  advance(1s);
  EXPECT_FALSE(released);
}

TEST_F(NetworkEmulationSessionTest, testOfflineSemantics) {
  throttler_.updateConditions(
      jsinspector_modern::NetworkConditions{
          .offline = false, .latencyMs = 0, .downloadThroughputBps = 150000});

  auto session = makeSession();
  bool disconnectedSeen = false;
  session->throttleBody(
      15000, [&](bool disconnected) { disconnectedSeen = disconnected; });

  // Going offline mid-flight fails the pending operation with disconnected.
  throttler_.updateConditions(
      jsinspector_modern::NetworkConditions{.offline = true});
  EXPECT_TRUE(disconnectedSeen);

  // New operations fail synchronously while offline.
  auto second = makeSession();
  EXPECT_EQ(
      second->throttleBody(100, [](bool) { FAIL(); }),
      NetworkEmulationSession::Result::Disconnected);
}

} // namespace facebook::react
