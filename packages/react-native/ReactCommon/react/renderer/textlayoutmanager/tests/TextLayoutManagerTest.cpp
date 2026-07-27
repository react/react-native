/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <cmath>

#include <react/renderer/textlayoutmanager/TextMeasureCache.h>
#include <react/renderer/textlayoutmanager/TextMeasurementRounding.h>

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

// Tests for internal_roundTextMeasurementToPixelGrid (the pixel-grid rounding
// used by text measurement). A small epsilon is added before ceil so a
// dimension that lands exactly on a pixel boundary gains one physical pixel of
// slack (avoiding double->float->Yoga precision from clipping the last line or
// trailing glyph), while dimensions with sub-pixel headroom are left untouched.
// pointScaleFactor 3 (an @3x screen) is used so one physical pixel is 1/3 pt.
// These lock in the behavior of D7074168 / PR #54260 in the new architecture,
// with the unit coverage that change lacked.
namespace {
constexpr Float kScale = 3.0;
long heightInPixels(Size raw) {
  return std::lround(
      internal_roundTextMeasurementToPixelGrid(raw, kScale).height * kScale);
}
long widthInPixels(Size raw) {
  return std::lround(
      internal_roundTextMeasurementToPixelGrid(raw, kScale).width * kScale);
}
} // namespace

// Height exactly on a pixel boundary gains one extra physical pixel (60 -> 61)
// so the final line is not clipped after layout rounding.
TEST(TextMeasurementRoundingTest, addsSlackWhenHeightOnPixelBoundary) {
  EXPECT_EQ(heightInPixels(Size{100.0, 20.0}), 61);
}

// Width exactly on a pixel boundary likewise gains one extra physical pixel so
// the trailing glyph is not clipped (matches the legacy both-dimensions fix).
TEST(TextMeasurementRoundingTest, addsSlackWhenWidthOnPixelBoundary) {
  EXPECT_EQ(widthInPixels(Size{20.0, 100.0}), 61);
}

// Height with sub-pixel headroom must NOT be inflated: 20.1pt -> 60.3px ->
// 61px, never 62. The epsilon only nudges boundary values, so text is not made
// taller than needed.
TEST(TextMeasurementRoundingTest, doesNotInflateHeightWithSubpixelHeadroom) {
  EXPECT_EQ(heightInPixels(Size{100.0, 20.1}), 61);
}

// Width with sub-pixel headroom must NOT be inflated either: 20.1pt -> 61px.
TEST(TextMeasurementRoundingTest, doesNotInflateWidthWithSubpixelHeadroom) {
  EXPECT_EQ(widthInPixels(Size{20.1, 100.0}), 61);
}
