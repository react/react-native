/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/core/ReactRootViewTagGenerator.h>

namespace facebook::react {

class AnimationDriverTests : public AnimationTestsBase {
 protected:
  double round(double value) noexcept {
    // Round to 2 decimal places
    return std::ceil(value * 100) / 100;
  }
};

TEST_F(AnimationDriverTests, framesAnimation) {
  initNodesManager();

  auto rootTag = getNextRootViewTag();

  auto valueNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      valueNodeTag,
      folly::dynamic::object("type", "value")("value", 0)("offset", 0));

  const auto animationId = 1;
  const auto frames = folly::dynamic::array(0.0f, 0.1f, 0.4f, 0.9f, 1.0f);
  const auto toValue = 100;
  nodesManager_->startAnimatingNode(
      animationId,
      valueNodeTag,
      folly::dynamic::object("type", "frames")("frames", frames)(
          "toValue", toValue),
      std::nullopt);

  const double startTimeInTick = 12345;

  runAnimationFrame(startTimeInTick);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), 0);

  runAnimationFrame(startTimeInTick + SingleFrameIntervalMs * 2.5);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), 65);

  runAnimationFrame(startTimeInTick + SingleFrameIntervalMs * 3);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), 90);

  runAnimationFrame(startTimeInTick + SingleFrameIntervalMs * 4);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), toValue);

  runAnimationFrame(startTimeInTick + SingleFrameIntervalMs * 10);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), toValue);
}

TEST_F(AnimationDriverTests, framesAnimationReconfigurationClearsFrames) {
  // This test verifies that when an animation is reconfigured via updateConfig,
  // the frames array is cleared before adding new frames. Without clearing,
  // frames would accumulate and cause incorrect animation behavior.
  initNodesManager();

  auto rootTag = getNextRootViewTag();

  auto valueNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      valueNodeTag,
      folly::dynamic::object("type", "value")("value", 0)("offset", 0));

  const auto animationId = 1;
  // First animation: 5 frames from 0 to 100
  const auto frames1 = folly::dynamic::array(0.0f, 0.25f, 0.5f, 0.75f, 1.0f);
  const auto toValue1 = 100;
  nodesManager_->startAnimatingNode(
      animationId,
      valueNodeTag,
      folly::dynamic::object("type", "frames")("frames", frames1)(
          "toValue", toValue1),
      std::nullopt);

  const double startTimeInTick = 12345;

  // Run first frame
  runAnimationFrame(startTimeInTick);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), 0);

  // Reconfigure the same animation (same animationId) with new frames
  // This triggers updateConfig on the existing FrameAnimationDriver
  const auto frames2 = folly::dynamic::array(0.0f, 0.5f, 1.0f);
  const auto toValue2 = 200;
  nodesManager_->startAnimatingNode(
      animationId,
      valueNodeTag,
      folly::dynamic::object("type", "frames")("frames", frames2)(
          "toValue", toValue2),
      std::nullopt);

  // Reset animation timing
  const double newStartTimeInTick = 20000;

  // Run animation at halfway point (1 frame into 3-frame animation)
  runAnimationFrame(newStartTimeInTick);
  runAnimationFrame(newStartTimeInTick + SingleFrameIntervalMs * 1);

  // At frame 1 of 3 frames (50% progress), value should be approximately:
  // startValue (0) + 0.5 * (toValue2 - startValue) = 0 + 0.5 * 200 = 100
  // If frames accumulated (5 + 3 = 8 frames), we'd be at wrong position
  // Use ceil rounding so 100.00x becomes 100.01
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), 100.01);

  // Complete the animation
  runAnimationFrame(newStartTimeInTick + SingleFrameIntervalMs * 2);
  EXPECT_EQ(round(nodesManager_->getValue(valueNodeTag).value()), toValue2);
}

TEST_F(AnimationDriverTests, framesAnimationDeferredStart) {
  // Deferred start outputs frame 0 on the first update and re-anchors
  // startFrameTimeMs_ so the second update also sees timeDelta=0.
  // Without the defer the second frame would already be at value 25.
  initNodesManager();

  auto rootTag = getNextRootViewTag();

  auto valueNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      valueNodeTag,
      folly::dynamic::object("type", "value")("value", 0)("offset", 0));

  const auto animationId = 1;
  const auto frames = folly::dynamic::array(0.0f, 0.25f, 0.5f, 0.75f, 1.0f);
  const auto toValue = 100;
  nodesManager_->startAnimatingNode(
      animationId,
      valueNodeTag,
      folly::dynamic::object("type", "frames")("frames", frames)(
          "toValue", toValue)("deferredStart", true),
      std::nullopt);

  const double t = 12345;

  // Frame 1: both with and without deferredStart, timeDelta=0 → value=0
  runAnimationFrame(t);
  EXPECT_EQ(nodesManager_->getValue(valueNodeTag).value(), 0);

  // Frame 2: WITHOUT deferredStart timeDelta=SI → value≈25.
  // WITH deferredStart the deferred start re-anchored startFrameTimeMs_, so
  // timeDelta=0 → value=0. This assertion fails without deferredStart.
  runAnimationFrame(t + SingleFrameIntervalMs);
  EXPECT_EQ(nodesManager_->getValue(valueNodeTag).value(), 0);

  // Frame 3: now timeDelta=SI from the re-anchored start
  runAnimationFrame(t + SingleFrameIntervalMs * 2);
  EXPECT_NEAR(nodesManager_->getValue(valueNodeTag).value(), 25, 0.01);

  // Frame 4
  runAnimationFrame(t + SingleFrameIntervalMs * 3);
  EXPECT_NEAR(nodesManager_->getValue(valueNodeTag).value(), 50, 0.01);

  // Complete
  runAnimationFrame(t + SingleFrameIntervalMs * 5);
  EXPECT_EQ(nodesManager_->getValue(valueNodeTag).value(), toValue);
}

} // namespace facebook::react
