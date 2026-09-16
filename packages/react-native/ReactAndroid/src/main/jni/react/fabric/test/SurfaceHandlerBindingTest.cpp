/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/fabric/SurfaceHandlerBinding.h>

#include <folly/dynamic.h>
#include <gtest/gtest.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/scheduler/SurfaceHandler.h>

namespace facebook::react {

class SurfaceHandlerBindingTest : public ::testing::Test {
 protected:
  SurfaceHandlerBinding makeBinding() {
    return SurfaceHandlerBinding(/*surfaceId=*/101, "SampleModule");
  }
};

TEST_F(
    SurfaceHandlerBindingTest,
    testSetLayoutConstraintsMapsJavaArgumentsToSurfaceParameters) {
  auto binding = makeBinding();

  binding.setLayoutConstraints(
      /*minWidth=*/10.0f,
      /*maxWidth=*/320.0f,
      /*minHeight=*/20.0f,
      /*maxHeight=*/640.0f,
      /*offsetX=*/3.0f,
      /*offsetY=*/4.0f,
      /*doLeftAndRightSwapInRTL=*/1,
      /*isRTL=*/1,
      /*pixelDensity=*/2.0f,
      /*fontScale=*/1.25f);

  const auto& surfaceHandler = binding.getSurfaceHandler();
  const auto layoutConstraints = surfaceHandler.getLayoutConstraints();
  const auto layoutContext = surfaceHandler.getLayoutContext();

  EXPECT_FLOAT_EQ(10.0f, layoutConstraints.minimumSize.width);
  EXPECT_FLOAT_EQ(20.0f, layoutConstraints.minimumSize.height);
  EXPECT_FLOAT_EQ(320.0f, layoutConstraints.maximumSize.width);
  EXPECT_FLOAT_EQ(640.0f, layoutConstraints.maximumSize.height);
  EXPECT_EQ(LayoutDirection::RightToLeft, layoutConstraints.layoutDirection);

  EXPECT_FLOAT_EQ(3.0f, layoutContext.viewportOffset.x);
  EXPECT_FLOAT_EQ(4.0f, layoutContext.viewportOffset.y);
  EXPECT_FLOAT_EQ(320.0f, layoutContext.viewportSize.width);
  EXPECT_FLOAT_EQ(640.0f, layoutContext.viewportSize.height);
  EXPECT_TRUE(layoutContext.swapLeftAndRightInRTL);
  EXPECT_FLOAT_EQ(2.0f, layoutContext.pointScaleFactor);
  EXPECT_FLOAT_EQ(1.25f, layoutContext.fontSizeMultiplier);
}

TEST_F(
    SurfaceHandlerBindingTest,
    testSetLayoutConstraintsMapsFalsyJavaBooleansToLeftToRightLayout) {
  auto binding = makeBinding();

  binding.setLayoutConstraints(
      /*minWidth=*/0.0f,
      /*maxWidth=*/200.0f,
      /*minHeight=*/0.0f,
      /*maxHeight=*/400.0f,
      /*offsetX=*/0.0f,
      /*offsetY=*/0.0f,
      /*doLeftAndRightSwapInRTL=*/0,
      /*isRTL=*/0,
      /*pixelDensity=*/1.0f,
      /*fontScale=*/1.0f);

  const auto& surfaceHandler = binding.getSurfaceHandler();

  EXPECT_EQ(
      LayoutDirection::LeftToRight,
      surfaceHandler.getLayoutConstraints().layoutDirection);
  EXPECT_FALSE(surfaceHandler.getLayoutContext().swapLeftAndRightInRTL);
}

TEST_F(
    SurfaceHandlerBindingTest,
    testSetDisplayModeUpdatesUnderlyingSurfaceDisplayMode) {
  auto binding = makeBinding();

  binding.setDisplayMode(static_cast<jint>(DisplayMode::Suspended));
  EXPECT_EQ(
      DisplayMode::Suspended, binding.getSurfaceHandler().getDisplayMode());

  binding.setDisplayMode(static_cast<jint>(DisplayMode::Visible));
  EXPECT_EQ(DisplayMode::Visible, binding.getSurfaceHandler().getDisplayMode());
}

TEST_F(SurfaceHandlerBindingTest, testSetPropsWithNullClearsSurfaceProps) {
  auto binding = makeBinding();
  binding.getSurfaceHandler().setProps(folly::dynamic::object("stale", 1));

  binding.setProps(nullptr);

  const auto props = binding.getSurfaceHandler().getProps();
  ASSERT_TRUE(props.isObject());
  EXPECT_EQ(0, props.count("stale"));
}

} // namespace facebook::react
