/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/scrollview/ScrollViewState.h>

#include <gtest/gtest.h>

namespace facebook::react {

TEST(ScrollViewStateTest, defaultConstructor) {
  ScrollViewState state;

  EXPECT_EQ(state.contentOffset.x, 0);
  EXPECT_EQ(state.contentOffset.y, 0);
  EXPECT_EQ(state.scrollAwayPaddingTop, 0);
  EXPECT_FALSE(state.disableViewCulling);
}

TEST(ScrollViewStateTest, parameterizedConstructor) {
  Point contentOffset{.x = 10.0f, .y = 20.0f};
  Rect contentBoundingRect{
      .origin = {.x = 0.0f, .y = 0.0f},
      .size = {.width = 100.0f, .height = 200.0f}};
  int scrollAwayPaddingTop = 5;

  ScrollViewState state(
      contentOffset, contentBoundingRect, scrollAwayPaddingTop);

  EXPECT_EQ(state.contentOffset.x, 10.0f);
  EXPECT_EQ(state.contentOffset.y, 20.0f);
  EXPECT_EQ(state.scrollAwayPaddingTop, 5);
  EXPECT_FALSE(state.disableViewCulling);
}

TEST(ScrollViewStateTest, getContentSize) {
  Point contentOffset{.x = 0.0f, .y = 0.0f};
  Rect contentBoundingRect{
      .origin = {.x = 0.0f, .y = 0.0f},
      .size = {.width = 150.0f, .height = 300.0f}};
  int scrollAwayPaddingTop = 0;

  ScrollViewState state(
      contentOffset, contentBoundingRect, scrollAwayPaddingTop);

  Size contentSize = state.getContentSize();
  EXPECT_EQ(contentSize.width, 150.0f);
  EXPECT_EQ(contentSize.height, 300.0f);
}

TEST(ScrollViewStateTest, disableViewCulling) {
  ScrollViewState state;

  // Default should be false
  EXPECT_FALSE(state.disableViewCulling);

  // Can be set to true
  state.disableViewCulling = true;
  EXPECT_TRUE(state.disableViewCulling);
}

TEST(ScrollViewStateTest, contentOffsetWithNegativeValues) {
  Point contentOffset{.x = -10.0f, .y = -20.0f};
  Rect contentBoundingRect{
      .origin = {.x = 0.0f, .y = 0.0f},
      .size = {.width = 100.0f, .height = 200.0f}};
  int scrollAwayPaddingTop = 0;

  ScrollViewState state(
      contentOffset, contentBoundingRect, scrollAwayPaddingTop);

  EXPECT_EQ(state.contentOffset.x, -10.0f);
  EXPECT_EQ(state.contentOffset.y, -20.0f);
}

TEST(ScrollViewStateTest, zeroSizeContentBoundingRect) {
  Point contentOffset{.x = 0.0f, .y = 0.0f};
  Rect contentBoundingRect{
      .origin = {.x = 0.0f, .y = 0.0f},
      .size = {.width = 0.0f, .height = 0.0f}};
  int scrollAwayPaddingTop = 0;

  ScrollViewState state(
      contentOffset, contentBoundingRect, scrollAwayPaddingTop);

  Size contentSize = state.getContentSize();
  EXPECT_EQ(contentSize.width, 0.0f);
  EXPECT_EQ(contentSize.height, 0.0f);
}

} // namespace facebook::react
