/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <optional>

#include <react/renderer/attributedstring/TextAttributes.h>

namespace facebook::react {
namespace {

template <typename T>
void expectOptionalFieldAffectsHash(
    const char* fieldName,
    std::optional<T> TextAttributes::* field) {
  SCOPED_TRACE(fieldName);
  TextAttributes baseline;
  TextAttributes changed;
  changed.*field = T{};

  EXPECT_NE(
      std::hash<TextAttributes>{}(baseline),
      std::hash<TextAttributes>{}(changed));
}

} // namespace

TEST(TextAttributesHashTest, equalAttributesHaveEqualHashes) {
  TextAttributes lhs;
  lhs.fontWeight = FontWeight::Weight400;
  lhs.fontStyle = FontStyle::Italic;
  lhs.fontVariationSettings = "'wght' 400";
  lhs.allowFontScaling = true;
  lhs.alignment = TextAlignment::Center;
  lhs.textShadowOffset = Size{.width = 1, .height = 2};
  lhs.isPressable = true;

  TextAttributes rhs = lhs;

  EXPECT_EQ(lhs, rhs);
  EXPECT_EQ(std::hash<TextAttributes>{}(lhs), std::hash<TextAttributes>{}(rhs));
}

TEST(TextAttributesHashTest, everyOptionalHashedFieldAffectsHash) {
  expectOptionalFieldAffectsHash("fontWeight", &TextAttributes::fontWeight);
  expectOptionalFieldAffectsHash("fontStyle", &TextAttributes::fontStyle);
  expectOptionalFieldAffectsHash("fontVariant", &TextAttributes::fontVariant);
  expectOptionalFieldAffectsHash(
      "fontVariationSettings", &TextAttributes::fontVariationSettings);
  expectOptionalFieldAffectsHash(
      "allowFontScaling", &TextAttributes::allowFontScaling);
  expectOptionalFieldAffectsHash(
      "textTransform", &TextAttributes::textTransform);
  expectOptionalFieldAffectsHash("alignment", &TextAttributes::alignment);
  expectOptionalFieldAffectsHash(
      "baseWritingDirection", &TextAttributes::baseWritingDirection);
  expectOptionalFieldAffectsHash(
      "lineBreakStrategy", &TextAttributes::lineBreakStrategy);
  expectOptionalFieldAffectsHash(
      "lineBreakMode", &TextAttributes::lineBreakMode);
  expectOptionalFieldAffectsHash(
      "textDecorationLineType", &TextAttributes::textDecorationLineType);
  expectOptionalFieldAffectsHash(
      "textDecorationStyle", &TextAttributes::textDecorationStyle);
  expectOptionalFieldAffectsHash(
      "textShadowOffset", &TextAttributes::textShadowOffset);
  expectOptionalFieldAffectsHash(
      "isHighlighted", &TextAttributes::isHighlighted);
  expectOptionalFieldAffectsHash("isPressable", &TextAttributes::isPressable);
  expectOptionalFieldAffectsHash(
      "layoutDirection", &TextAttributes::layoutDirection);
  expectOptionalFieldAffectsHash(
      "accessibilityRole", &TextAttributes::accessibilityRole);
  expectOptionalFieldAffectsHash("role", &TextAttributes::role);
}

TEST(TextAttributesHashTest, identicalValuesInDifferentSlotsHashDifferently) {
  TextAttributes highlighted;
  highlighted.isHighlighted = true;

  TextAttributes pressable;
  pressable.isPressable = true;

  EXPECT_NE(
      std::hash<TextAttributes>{}(highlighted),
      std::hash<TextAttributes>{}(pressable));
}

} // namespace facebook::react
