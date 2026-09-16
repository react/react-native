/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <array>

#include "../primitives.h"

namespace facebook::react {

// Nanosecond counts that are not a whole number of milliseconds, spanning the
// magnitudes a monotonic clock reports (seconds to weeks since boot).
constexpr std::array<int64_t, 5> kRoundTripNanoseconds{
    1,
    999'999,
    1'000'001,
    12'345'678'901,
    537'648'854'729'250};

TEST(HighResDuration, CorrectlyConvertsToDOMHighResTimeStamp) {
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(10).toDOMHighResTimeStamp(), 0.00001);
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(10 * 1e3).toDOMHighResTimeStamp(), 0.01);
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(10 * 1e6).toDOMHighResTimeStamp(), 10.0);
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(10 * 1e9).toDOMHighResTimeStamp(),
      10000.0);
  EXPECT_EQ(
      HighResDuration::fromNanoseconds(1e9 + 20).toDOMHighResTimeStamp(),
      1000.000020);

  EXPECT_EQ(HighResDuration::fromMilliseconds(0).toDOMHighResTimeStamp(), 0);
  EXPECT_EQ(
      HighResDuration::fromMilliseconds(10).toDOMHighResTimeStamp(), 10.0);
}

TEST(HighResDuration, CorrectlyConvertsFromDOMHighResTimeStamp) {
  EXPECT_EQ(
      HighResDuration::fromDOMHighResTimeStamp(0.00001).toNanoseconds(), 10);
  EXPECT_EQ(
      HighResDuration::fromDOMHighResTimeStamp(1.000001).toNanoseconds(),
      1000001);
  EXPECT_EQ(
      HighResDuration::fromDOMHighResTimeStamp(-1.000001).toNanoseconds(),
      -1000001);
  EXPECT_EQ(HighResDuration::fromDOMHighResTimeStamp(0).toNanoseconds(), 0);
}

TEST(HighResDuration, RoundTripsThroughDOMHighResTimeStamp) {
  // A DOMHighResTimeStamp is a double holding milliseconds, so converting back
  // to nanoseconds has to round: neither conversion is exact, and truncating
  // would drop a nanosecond whenever the result lands just below the original
  // value.
  for (int64_t nanoseconds : kRoundTripNanoseconds) {
    for (int64_t signedNanoseconds : {nanoseconds, -nanoseconds}) {
      auto duration = HighResDuration::fromNanoseconds(signedNanoseconds);
      EXPECT_EQ(
          HighResDuration::fromDOMHighResTimeStamp(
              duration.toDOMHighResTimeStamp()),
          duration)
          << "duration of " << signedNanoseconds << "ns did not round trip";
    }
  }
}

TEST(HighResTimeStamp, RoundTripsThroughDOMHighResTimeStamp) {
  for (int64_t nanoseconds : kRoundTripNanoseconds) {
    auto timestamp = HighResTimeStamp::fromChronoSteadyClockTimePoint(
        std::chrono::steady_clock::time_point(
            std::chrono::nanoseconds(nanoseconds)));
    EXPECT_EQ(
        HighResTimeStamp::fromDOMHighResTimeStamp(
            timestamp.toDOMHighResTimeStamp()),
        timestamp)
        << "timestamp of " << nanoseconds << "ns did not round trip";
  }
}

TEST(HighResDuration, ComparisonOperators) {
  auto duration1 = HighResDuration::fromNanoseconds(10);
  auto duration2 = HighResDuration::fromNanoseconds(20);
  auto duration3 = HighResDuration::fromNanoseconds(10);

  EXPECT_TRUE(duration1 == duration3);
  EXPECT_FALSE(duration1 == duration2);

  EXPECT_TRUE(duration1 != duration2);
  EXPECT_FALSE(duration1 != duration3);

  EXPECT_TRUE(duration1 < duration2);
  EXPECT_FALSE(duration2 < duration1);
  EXPECT_FALSE(duration1 < duration3);

  EXPECT_TRUE(duration1 <= duration2);
  EXPECT_TRUE(duration1 <= duration3);
  EXPECT_FALSE(duration2 <= duration1);

  EXPECT_TRUE(duration2 > duration1);
  EXPECT_FALSE(duration1 > duration2);
  EXPECT_FALSE(duration1 > duration3);

  EXPECT_TRUE(duration2 >= duration1);
  EXPECT_TRUE(duration1 >= duration3);
  EXPECT_FALSE(duration1 >= duration2);
}

TEST(HighResDuration, ArithmeticOperators) {
  auto duration1 = HighResDuration::fromChrono(std::chrono::nanoseconds(100));
  auto duration2 = HighResDuration::fromChrono(std::chrono::nanoseconds(50));

  EXPECT_EQ(duration1 + duration2, std::chrono::nanoseconds(150));
  EXPECT_EQ(duration1 - duration2, std::chrono::nanoseconds(50));
  EXPECT_EQ(duration2 - duration1, std::chrono::nanoseconds(-50));
}

TEST(HighResTimeStamp, ComparisonOperators) {
  auto now = HighResTimeStamp::now();
  auto later = now + HighResDuration::fromNanoseconds(1);
  auto nowCopy = now;

  EXPECT_TRUE(now == nowCopy);
  EXPECT_FALSE(now == later);

  EXPECT_TRUE(now != later);
  EXPECT_FALSE(now != nowCopy);

  EXPECT_TRUE(now < later);
  EXPECT_FALSE(later < now);
  EXPECT_FALSE(now < nowCopy);

  EXPECT_TRUE(now <= later);
  EXPECT_TRUE(now <= nowCopy);
  EXPECT_FALSE(later <= now);

  EXPECT_TRUE(later > now);
  EXPECT_FALSE(now > later);
  EXPECT_FALSE(now > nowCopy);

  EXPECT_TRUE(later >= now);
  EXPECT_TRUE(now >= nowCopy);
  EXPECT_FALSE(now >= later);
}

TEST(HighResTimeStamp, SteadyClockTimePointConversion) {
  [[maybe_unused]] auto timestamp =
      HighResTimeStamp::now().toChronoSteadyClockTimePoint();

  EXPECT_TRUE(decltype(timestamp)::clock::is_steady);
}

} // namespace facebook::react
