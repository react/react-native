/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <yoga/Yoga.h>

namespace {

class FlexLineTest : public ::testing::Test {
 protected:
  void SetUp() override {
    config_ = YGConfigNew();
    YGConfigSetPointScaleFactor(config_, 0.0f);
    root_ = YGNodeNewWithConfig(config_);
    YGNodeStyleSetFlexDirection(root_, YGFlexDirectionRow);
  }

  void TearDown() override {
    YGNodeFreeRecursive(root_);
    YGConfigFree(config_);
  }

  YGNodeRef appendChildWithSize(float width, float height) {
    auto child = YGNodeNewWithConfig(config_);
    YGNodeStyleSetWidth(child, width);
    YGNodeStyleSetHeight(child, height);
    YGNodeInsertChild(root_, child, YGNodeGetChildCount(root_));
    return child;
  }

  void calculateLayout(float width) {
    YGNodeStyleSetWidth(root_, width);
    YGNodeCalculateLayout(root_, YGUndefined, YGUndefined, YGDirectionLTR);
  }

  YGConfigRef config_{nullptr};
  YGNodeRef root_{nullptr};
};

TEST_F(FlexLineTest, testCalculateFlexLineStopsBeforeWrappedOverflow) {
  YGNodeStyleSetFlexWrap(root_, YGWrapWrap);
  YGNodeStyleSetGap(root_, YGGutterColumn, 10.0f);

  auto firstChild = appendChildWithSize(40.0f, 10.0f);
  auto secondChild = appendChildWithSize(40.0f, 20.0f);
  auto overflowingChild = appendChildWithSize(20.0f, 30.0f);

  calculateLayout(90.0f);

  EXPECT_FLOAT_EQ(YGNodeLayoutGetLeft(firstChild), 0.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetTop(firstChild), 0.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetLeft(secondChild), 50.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetTop(secondChild), 0.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetLeft(overflowingChild), 0.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetTop(overflowingChild), 20.0f);
}

TEST_F(FlexLineTest, testCalculateFlexLineSkipsNonFlowChildren) {
  YGNodeStyleSetGap(root_, YGGutterColumn, 5.0f);

  auto displayNoneChild = appendChildWithSize(100.0f, 10.0f);
  YGNodeStyleSetDisplay(displayNoneChild, YGDisplayNone);

  auto absoluteChild = appendChildWithSize(100.0f, 10.0f);
  YGNodeStyleSetPositionType(absoluteChild, YGPositionTypeAbsolute);

  auto firstInFlowChild = appendChildWithSize(30.0f, 10.0f);
  auto secondInFlowChild = appendChildWithSize(20.0f, 10.0f);
  YGNodeStyleSetMargin(secondInFlowChild, YGEdgeLeft, 4.0f);
  YGNodeStyleSetMargin(secondInFlowChild, YGEdgeRight, 6.0f);

  calculateLayout(500.0f);

  EXPECT_FLOAT_EQ(YGNodeLayoutGetLeft(firstInFlowChild), 0.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetWidth(firstInFlowChild), 30.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetLeft(secondInFlowChild), 39.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetWidth(secondInFlowChild), 20.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetWidth(displayNoneChild), 0.0f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetLeft(absoluteChild), 0.0f);
}

TEST_F(FlexLineTest, testCalculateFlexLineFloorsTotalGrowFactor) {
  auto firstChild = appendChildWithSize(10.0f, 10.0f);
  YGNodeStyleSetFlexGrow(firstChild, 0.25f);
  YGNodeStyleSetFlexBasis(firstChild, 10.0f);

  auto secondChild = appendChildWithSize(20.0f, 10.0f);
  YGNodeStyleSetFlexGrow(secondChild, 0.5f);
  YGNodeStyleSetFlexBasis(secondChild, 20.0f);

  calculateLayout(100.0f);

  EXPECT_FLOAT_EQ(YGNodeLayoutGetWidth(firstChild), 27.5f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetLeft(secondChild), 27.5f);
  EXPECT_FLOAT_EQ(YGNodeLayoutGetWidth(secondChild), 55.0f);
}

} // namespace
