/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/attributedstring/conversions.h>

#include <limits>

namespace facebook::react {

// Two freshly default-constructed ParagraphAttributes must compare equal.
TEST(
    ParagraphAttributesTest,
    testOperatorEqualsDefaultConstructedInstancesAreEqual) {
  ParagraphAttributes a{};
  ParagraphAttributes b{};

  EXPECT_TRUE(a == b);
}

// operator== compares minimumFontScale with an epsilon tolerance (0.005)
// rather than an exact ==. Differences below the epsilon must still compare
// equal; differences well above the epsilon must compare unequal.
TEST(
    ParagraphAttributesTest,
    testOperatorEqualsFloatFieldsUseEpsilonComparison) {
  ParagraphAttributes a{};
  a.minimumFontScale = 0.5f;
  auto b = a;

  b.minimumFontScale = a.minimumFontScale + 0.001f;
  EXPECT_TRUE(a == b);

  b = a;
  b.minimumFontScale = a.minimumFontScale + 0.1f;
  EXPECT_FALSE(a == b);
}

// floatEquality returns true only when *both* operands are NaN or when
// *neither* is. Two NaN minimumFontScale values must compare equal, and a
// NaN-vs-finite mismatch must compare unequal.
TEST(ParagraphAttributesTest, testOperatorEqualsHandlesNaNMinimumFontScale) {
  ParagraphAttributes withNaN{};
  withNaN.minimumFontScale = std::numeric_limits<Float>::quiet_NaN();
  auto otherWithNaN = withNaN;

  EXPECT_TRUE(withNaN == otherWithNaN);

  ParagraphAttributes withFinite{};
  withFinite.minimumFontScale = 0.5f;

  EXPECT_FALSE(withNaN == withFinite);
}

// textAlignVertical is a std::optional; operator== must treat "unset" and
// "set" as distinct, independent of the wrapped value.
TEST(
    ParagraphAttributesTest,
    testOperatorEqualsHandlesOptionalTextAlignVerticalSetVsUnset) {
  ParagraphAttributes unset{};
  ParagraphAttributes set{};
  set.textAlignVertical = TextAlignmentVertical::Auto;

  EXPECT_FALSE(unset == set);
}

TEST(ParagraphAttributesTest, testOperatorEqualsIncludesTextWidthMode) {
  ParagraphAttributes autoWidth{};
  ParagraphAttributes longestLineWidth{};
  longestLineWidth.textWidthMode = TextWidthMode::LongestLine;

  EXPECT_FALSE(autoWidth == longestLineWidth);
}

TEST(ParagraphAttributesTest, testAutoTextWidthModeSerializesAsAuto) {
  EXPECT_EQ(toString(TextWidthMode::Auto), "auto");
}

} // namespace facebook::react
