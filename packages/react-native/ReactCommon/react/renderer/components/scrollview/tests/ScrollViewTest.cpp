/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/scrollview/BaseScrollViewProps.h>
#include <react/renderer/components/scrollview/ScrollViewState.h>
#include <react/renderer/core/RawPropsParser.h>

#include <gtest/gtest.h>

namespace facebook::react {

namespace {

BaseScrollViewProps parseScrollViewProps(
    const folly::dynamic& value,
    const BaseScrollViewProps& sourceProps = BaseScrollViewProps{}) {
  ContextContainer contextContainer{};
  PropsParserContext context{-1, contextContainer};
  RawProps raw{value};
  RawPropsParser parser{};
  parser.prepare<BaseScrollViewProps>();
  raw.parse(parser);
  return {context, sourceProps, raw};
}

} // namespace

TEST(ScrollViewPropsTest, safeAreaPaddingRequiresExplicitOptIn) {
  EXPECT_FALSE(BaseScrollViewProps{}.padsContentForSafeArea);
  for (const auto* behavior :
       {"never", "automatic", "scrollableAxes", "always"}) {
    auto props = parseScrollViewProps(
        folly::dynamic::object("contentInsetAdjustmentBehavior", behavior));
    EXPECT_FALSE(props.padsContentForSafeArea);
  }
}

TEST(ScrollViewPropsTest, safeAreaPaddingCanBeEnabledAndDisabled) {
  auto enabled = parseScrollViewProps(
      folly::dynamic::object("padsContentForSafeArea", true));
  EXPECT_TRUE(enabled.padsContentForSafeArea);
  auto disabled = parseScrollViewProps(
      folly::dynamic::object("padsContentForSafeArea", false), enabled);
  EXPECT_FALSE(disabled.padsContentForSafeArea);
}

TEST(ScrollViewPropsTest, safeAreaPaddingResetsToDefault) {
  auto enabled = parseScrollViewProps(
      folly::dynamic::object("padsContentForSafeArea", true));
  auto reset = parseScrollViewProps(
      folly::dynamic::object("padsContentForSafeArea", nullptr), enabled);
  EXPECT_FALSE(reset.padsContentForSafeArea);
}

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
