/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/core/ReactRootViewTagGenerator.h>

#include <cmath>
#include <limits>

namespace facebook::react {

class DecayAnimationDriverTest : public AnimationTestsBase {
 protected:
  // Closed-form analytical value of the decay curve, used to derive expected
  // values for assertions instead of hard-coding constants. Mirrors the
  // formula implemented by DecayAnimationDriver::getValueAndVelocityForTime,
  // which is:
  //   value = fromValue + velocity / (1 - deceleration)
  //                       * (1 - exp(-(1 - deceleration) * (1000 * time)))
  // The driver is called with timeDeltaMs / 1000.0, so 1000 * time collapses
  // back to timeMs.
  static double expectedDecayValue(
      double fromValue,
      double velocity,
      double deceleration,
      double timeMs) {
    return fromValue +
        velocity / (1 - deceleration) *
        (1 - std::exp(-(1 - deceleration) * timeMs));
  }

  // Create a ValueAnimatedNode with the given initial value and zero offset.
  Tag createValueNode(double initialValue) {
    auto tag = ++rootTag_;
    nodesManager_->createAnimatedNode(
        tag,
        folly::dynamic::object("type", "value")("value", initialValue)(
            "offset", 0));
    return tag;
  }

  void startDecay(
      int animationId,
      Tag valueNodeTag,
      double velocity,
      double deceleration,
      int iterations = 1) {
    nodesManager_->startAnimatingNode(
        animationId,
        valueNodeTag,
        folly::dynamic::object("type", "decay")("velocity", velocity)(
            "deceleration", deceleration)("iterations", iterations),
        std::nullopt);
  }

  Tag rootTag_{getNextRootViewTag()};
};

TEST_F(DecayAnimationDriverTest, decayProducesAnalyticalCurveValues) {
  // Drives a decay animation and checks the produced values match the
  // closed-form decay formula at multiple points along the curve. This
  // guards the formula in getValueAndVelocityForTime against regressions
  // (e.g. sign flips, swapped operands, exp(+x) vs exp(-x)).
  initNodesManager();
  const auto valueNodeTag = createValueNode(0);
  const auto animationId = 1;
  const double velocity = 1.0;
  const double deceleration = 0.998;
  startDecay(animationId, valueNodeTag, velocity, deceleration);

  const double startTimeInTick = 10000;

  // First frame: the timeDelta is 0, so the produced value must equal the
  // node's starting value (fromValue is captured from the node here).
  runAnimationFrame(startTimeInTick);
  EXPECT_NEAR(nodesManager_->getValue(valueNodeTag).value(), 0.0, 1e-6);

  // Sample the curve at several non-trivial points and compare to the
  // analytical expectation. We feed the same wall-clock delta the driver
  // sees (frameTimeMs - startFrameTimeMs_, which equals the offset we add
  // to startTimeInTick).
  for (const double dtMs : {100.0, 500.0, 1000.0}) {
    runAnimationFrame(startTimeInTick + dtMs);
    const auto expected = expectedDecayValue(0.0, velocity, deceleration, dtMs);
    EXPECT_NEAR(nodesManager_->getValue(valueNodeTag).value(), expected, 1e-3);
  }
}

TEST_F(DecayAnimationDriverTest, decayUsesNodeStartingValueAsOrigin) {
  // The driver must capture the node's current value as fromValue on the
  // first update — not assume 0. With a non-zero starting value the entire
  // curve is shifted by that offset; verifying this catches a regression
  // where fromValue defaults to 0 (a likely off-by-one mistake).
  initNodesManager();
  const double startingValue = 50.0;
  const auto valueNodeTag = createValueNode(startingValue);
  const auto animationId = 1;
  const double velocity = 2.0;
  const double deceleration = 0.99;
  startDecay(animationId, valueNodeTag, velocity, deceleration);

  const double startTimeInTick = 10000;
  runAnimationFrame(startTimeInTick);
  EXPECT_NEAR(
      nodesManager_->getValue(valueNodeTag).value(), startingValue, 1e-6);

  const double dtMs = 200.0;
  runAnimationFrame(startTimeInTick + dtMs);
  const auto expected =
      expectedDecayValue(startingValue, velocity, deceleration, dtMs);
  EXPECT_NEAR(nodesManager_->getValue(valueNodeTag).value(), expected, 1e-3);
}

TEST_F(DecayAnimationDriverTest, decayWithNegativeVelocityDecreasesValue) {
  // A negative velocity must produce a monotonically decreasing curve that
  // approaches the asymptote fromValue + velocity/(1-deceleration) from
  // above. This catches sign errors in the value computation.
  initNodesManager();
  const double startingValue = 100.0;
  const auto valueNodeTag = createValueNode(startingValue);
  const auto animationId = 1;
  const double velocity = -1.0;
  const double deceleration = 0.998;
  startDecay(animationId, valueNodeTag, velocity, deceleration);

  const double t = 10000;
  runAnimationFrame(t);
  const auto v0 = nodesManager_->getValue(valueNodeTag).value();
  EXPECT_NEAR(v0, startingValue, 1e-6);

  runAnimationFrame(t + 100);
  const auto v1 = nodesManager_->getValue(valueNodeTag).value();
  runAnimationFrame(t + 500);
  const auto v2 = nodesManager_->getValue(valueNodeTag).value();

  // Strictly decreasing in time.
  EXPECT_LT(v1, v0);
  EXPECT_LT(v2, v1);

  // And matches the analytical curve at a sampled point.
  const auto expected = expectedDecayValue(startingValue, velocity, 0.998, 500);
  EXPECT_NEAR(v2, expected, 1e-3);
}

TEST_F(DecayAnimationDriverTest, decayCompletesWhenValueStabilizes) {
  // The driver reports completion when the change between successive frames
  // drops below 0.1. Once complete and not running additional iterations,
  // the node must hold a final value close to the asymptote
  // fromValue + velocity / (1 - deceleration) and must stop updating.
  initNodesManager();
  const auto valueNodeTag = createValueNode(0);
  const auto animationId = 1;
  const double velocity = 1.0;
  const double deceleration = 0.998;
  startDecay(animationId, valueNodeTag, velocity, deceleration);

  const double startTimeInTick = 10000;

  // Drive enough frames to let the decay settle. The per-frame delta drops
  // below 0.1 well before this many frames at 60Hz.
  const int totalFrames = 1500;
  for (int i = 0; i <= totalFrames; ++i) {
    runAnimationFrame(startTimeInTick + i * SingleFrameIntervalMs);
  }

  const auto asymptote = velocity / (1 - deceleration); // == 500
  const auto finalValue = nodesManager_->getValue(valueNodeTag).value();
  // The completion threshold is 0.1 per frame; the settled value lands a
  // few units short of the asymptote. A generous bound that still rules
  // out the unsettled case (where finalValue would be far below it).
  EXPECT_LT(std::abs(finalValue - asymptote), 10.0);
  // Sanity check the opposite direction — the value must not have overshot
  // the asymptote (the formula is strictly increasing toward it for
  // positive velocity).
  EXPECT_LE(finalValue, asymptote);

  // Driving more frames after completion must not change the value: once
  // the driver reports completion, subsequent frames are short-circuited
  // by AnimationDriver::runAnimationStep and the node value is unchanged.
  runAnimationFrame(
      startTimeInTick + (totalFrames + 100) * SingleFrameIntervalMs);
  EXPECT_NEAR(nodesManager_->getValue(valueNodeTag).value(), finalValue, 1e-6);
}

TEST_F(DecayAnimationDriverTest, decayIterationsResetValueToOrigin) {
  // When the animation has additional iterations remaining, each iteration
  // after the first must restart from fromValue (the value captured on the
  // very first update), not from wherever the previous iteration ended.
  // This exercises the `else` branch in update() that resets the node via
  // setRawValue when restarting a subsequent iteration. We use iterations
  // = -1 (infinite) so the driver is guaranteed to restart instead of
  // terminating.
  initNodesManager();
  const double startingValue = 0.0;
  const auto valueNodeTag = createValueNode(startingValue);
  const auto animationId = 1;
  const double velocity = 1.0;
  const double deceleration = 0.998;
  startDecay(
      animationId, valueNodeTag, velocity, deceleration, /*iterations=*/-1);

  const double startTimeInTick = 10000;

  // First frame anchors fromValue at startingValue and emits it.
  runAnimationFrame(startTimeInTick);
  ASSERT_NEAR(
      nodesManager_->getValue(valueNodeTag).value(), startingValue, 1e-6);

  // Walk frame-by-frame until we observe a value drop from one frame to
  // the next. Decay with positive velocity is strictly monotone, so the
  // only way the observed value can decrease is if the driver completed
  // an iteration and reset the node back to fromValue at the start of
  // the next one. With velocity=1, deceleration=0.998, fromValue=0 the
  // asymptote is 500, so any reset produces a multi-hundred-unit drop —
  // not a fragile near-equality.
  double previousValue = nodesManager_->getValue(valueNodeTag).value();
  bool sawReset = false;
  double resetValue = std::numeric_limits<double>::quiet_NaN();
  // Bound the loop generously — the completion threshold (per-frame delta
  // < 0.1) is reached in a couple hundred frames for these parameters.
  constexpr int kMaxFrames = 600;
  for (int i = 1; i <= kMaxFrames; ++i) {
    runAnimationFrame(startTimeInTick + i * SingleFrameIntervalMs);
    const auto current = nodesManager_->getValue(valueNodeTag).value();
    if (current < previousValue) {
      sawReset = true;
      resetValue = current;
      break;
    }
    previousValue = current;
  }

  ASSERT_TRUE(sawReset);
  // After the reset, the very next frame of the new iteration emits the
  // starting value (timeDelta=0 ⇒ value=fromValue).
  EXPECT_NEAR(resetValue, startingValue, 1e-6);
}

} // namespace facebook::react
