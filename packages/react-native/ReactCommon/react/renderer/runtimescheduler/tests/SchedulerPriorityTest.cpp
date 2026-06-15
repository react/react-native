/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <React/RuntimeScheduler.h>
#include <gtest/gtest.h>
#include <chrono>

using namespace facebook::react;

TEST(SchedulerPriorityTest, fromRawValue) {
  EXPECT_EQ(SchedulerPriority::ImmediatePriority, fromRawValue(1.0));
  EXPECT_EQ(SchedulerPriority::UserBlockingPriority, fromRawValue(2.0));
  EXPECT_EQ(SchedulerPriority::NormalPriority, fromRawValue(3.0));
  EXPECT_EQ(SchedulerPriority::LowPriority, fromRawValue(4.0));
  EXPECT_EQ(SchedulerPriority::IdlePriority, fromRawValue(5.0));
}

TEST(SchedulerPriorityTest, serialize) {
  EXPECT_EQ(serialize(SchedulerPriority::ImmediatePriority), 1);
  EXPECT_EQ(serialize(SchedulerPriority::UserBlockingPriority), 2);
  EXPECT_EQ(serialize(SchedulerPriority::NormalPriority), 3);
  EXPECT_EQ(serialize(SchedulerPriority::LowPriority), 4);
  EXPECT_EQ(serialize(SchedulerPriority::IdlePriority), 5);
}

TEST(SchedulerPriorityTest, timeoutForSchedulerPriority) {
  EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::ImmediatePriority),
      std::chrono::milliseconds(0));
  EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::UserBlockingPriority),
      std::chrono::milliseconds(250));
  EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::NormalPriority),
      std::chrono::seconds(5));
  EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::LowPriority),
      std::chrono::seconds(10));
  EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::IdlePriority),
      std::chrono::minutes(5));
}
