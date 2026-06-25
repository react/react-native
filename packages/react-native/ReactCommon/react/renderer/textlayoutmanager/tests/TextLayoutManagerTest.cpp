/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/textlayoutmanager/TextMeasureCache.h>

using namespace facebook::react;

TEST(TextLayoutManagerTest, defaultTextAttributesAreLayoutEquivalent) {
  TextAttributes lhs;
  TextAttributes rhs;

  EXPECT_TRUE(areTextAttributesEquivalentLayoutWise(lhs, rhs));
  EXPECT_EQ(
      textAttributesHashLayoutWise(lhs), textAttributesHashLayoutWise(rhs));
}

TEST(TextLayoutManagerTest, maxFontSizeMultiplierAffectsLayoutCacheEquality) {
  TextAttributes lhs;
  TextAttributes rhs;

  lhs.fontSize = rhs.fontSize = 16;
  lhs.fontSizeMultiplier = rhs.fontSizeMultiplier = 2;
  lhs.maxFontSizeMultiplier = 1;
  rhs.maxFontSizeMultiplier = 2;

  EXPECT_FALSE(areTextAttributesEquivalentLayoutWise(lhs, rhs));
}

TEST(TextLayoutManagerTest, maxFontSizeMultiplierAffectsLayoutCacheHash) {
  TextAttributes lhs;
  TextAttributes rhs;

  lhs.fontSize = rhs.fontSize = 16;
  lhs.fontSizeMultiplier = rhs.fontSizeMultiplier = 2;
  lhs.maxFontSizeMultiplier = 1;
  rhs.maxFontSizeMultiplier = 2;

  EXPECT_NE(
      textAttributesHashLayoutWise(lhs), textAttributesHashLayoutWise(rhs));
}

// Measurements are rounded to the pixel grid, so a measurement cached at one
// pixel scale factor must not satisfy a lookup at another. Keys that differ
// only by pointScaleFactor must compare unequal.
TEST(TextLayoutManagerTest, pointScaleFactorAffectsTextMeasureCacheEquality) {
  TextMeasureCacheKey lhs;
  TextMeasureCacheKey rhs;

  lhs.pointScaleFactor = 2.0;
  rhs.pointScaleFactor = 1.6;
  EXPECT_FALSE(lhs == rhs);

  rhs.pointScaleFactor = 2.0;
  EXPECT_TRUE(lhs == rhs);
}

TEST(TextLayoutManagerTest, pointScaleFactorAffectsTextMeasureCacheHash) {
  TextMeasureCacheKey lhs;
  TextMeasureCacheKey rhs;

  lhs.pointScaleFactor = 2.0;
  rhs.pointScaleFactor = 1.6;

  EXPECT_NE(
      std::hash<TextMeasureCacheKey>{}(lhs),
      std::hash<TextMeasureCacheKey>{}(rhs));
}

// Same invariant for the prepared-text cache: a prepared layout is pixel-grid
// rounded and is only reusable at the pixel scale factor it was prepared at.
TEST(TextLayoutManagerTest, pointScaleFactorAffectsPreparedTextCacheEquality) {
  PreparedTextCacheKey lhs;
  PreparedTextCacheKey rhs;

  lhs.pointScaleFactor = 2.0;
  rhs.pointScaleFactor = 1.6;
  EXPECT_FALSE(lhs == rhs);

  rhs.pointScaleFactor = 2.0;
  EXPECT_TRUE(lhs == rhs);
}

TEST(TextLayoutManagerTest, pointScaleFactorAffectsPreparedTextCacheHash) {
  PreparedTextCacheKey lhs;
  PreparedTextCacheKey rhs;

  lhs.pointScaleFactor = 2.0;
  rhs.pointScaleFactor = 1.6;

  EXPECT_NE(
      std::hash<PreparedTextCacheKey>{}(lhs),
      std::hash<PreparedTextCacheKey>{}(rhs));
}
