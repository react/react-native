/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>

namespace facebook::react {

// The three Float fields default to NaN, and NaN != NaN under IEEE-754.
// operator== must special-case NaN via floatEquality so two freshly
// default-constructed ParagraphAttributes compare equal.
TEST(
    ParagraphAttributesTest,
    testOperatorEqualsDefaultConstructedInstancesAreEqual) {
  ParagraphAttributes a{};
  ParagraphAttributes b{};

  EXPECT_TRUE(a == b);
}

// operator== compares Float fields with an epsilon tolerance (0.005) rather
// than an exact ==. Differences below the epsilon must still compare equal;
// differences well above the epsilon must compare unequal.
TEST(
    ParagraphAttributesTest,
    testOperatorEqualsFloatFieldsUseEpsilonComparison) {
  ParagraphAttributes a{};
  a.minimumFontSize = 12.0f;
  a.maximumFontSize = 48.0f;
  a.minimumFontScale = 0.5f;
  auto b = a;

  b.minimumFontSize = a.minimumFontSize + 0.001f;
  b.maximumFontSize = a.maximumFontSize + 0.001f;
  b.minimumFontScale = a.minimumFontScale + 0.001f;
  EXPECT_TRUE(a == b);

  b = a;
  b.minimumFontSize = a.minimumFontSize + 1.0f;
  EXPECT_FALSE(a == b);
}

// floatEquality returns true only when *both* operands are NaN or when
// *neither* is. A NaN-vs-finite mismatch in any of the three float fields
// must therefore make the instances unequal, even though both operands are
// "invalid" font sizes.
TEST(
    ParagraphAttributesTest,
    testOperatorEqualsNaNVsFiniteFloatComparesUnequal) {
  ParagraphAttributes withNaN{};
  ParagraphAttributes withFinite{};
  withFinite.minimumFontSize = 12.0f;

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

} // namespace facebook::react
