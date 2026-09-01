/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <array>

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/attributedstring/primitives.h>

using namespace facebook::react;

namespace {

FontVariant variants(std::initializer_list<FontVariant> values) {
  auto result = 0;
  for (auto value : values) {
    result |= (int)value;
  }
  return (FontVariant)result;
}

TextAttributes attributesWith(
    std::optional<FontVariant> fontVariant = std::nullopt,
    std::optional<std::string> fontFeatureSettings = std::nullopt) {
  TextAttributes textAttributes;
  textAttributes.fontVariant = fontVariant;
  textAttributes.fontFeatureSettings = std::move(fontFeatureSettings);
  return textAttributes;
}

std::optional<std::string> resolve(
    std::optional<FontVariant> fontVariant = std::nullopt,
    std::optional<std::string> fontFeatureSettings = std::nullopt) {
  auto textAttributes =
      attributesWith(fontVariant, std::move(fontFeatureSettings));
  return resolveFontFeatureSettings(textAttributes);
}

} // namespace

TEST(FontFeatureSettingsTest, everyFontVariantBitMapsToItsHistoricalTag) {
  const auto expected = std::to_array<std::pair<FontVariant, const char*>>({
      {FontVariant::SmallCaps, "'smcp'"},
      {FontVariant::OldstyleNums, "'onum'"},
      {FontVariant::LiningNums, "'lnum'"},
      {FontVariant::TabularNums, "'tnum'"},
      {FontVariant::ProportionalNums, "'pnum'"},
      {FontVariant::StylisticOne, "'ss01'"},
      {FontVariant::StylisticTwo, "'ss02'"},
      {FontVariant::StylisticThree, "'ss03'"},
      {FontVariant::StylisticFour, "'ss04'"},
      {FontVariant::StylisticFive, "'ss05'"},
      {FontVariant::StylisticSix, "'ss06'"},
      {FontVariant::StylisticSeven, "'ss07'"},
      {FontVariant::StylisticEight, "'ss08'"},
      {FontVariant::StylisticNine, "'ss09'"},
      {FontVariant::StylisticTen, "'ss10'"},
      {FontVariant::StylisticEleven, "'ss11'"},
      {FontVariant::StylisticTwelve, "'ss12'"},
      {FontVariant::StylisticThirteen, "'ss13'"},
      {FontVariant::StylisticFourteen, "'ss14'"},
      {FontVariant::StylisticFifteen, "'ss15'"},
      {FontVariant::StylisticSixteen, "'ss16'"},
      {FontVariant::StylisticSeventeen, "'ss17'"},
      {FontVariant::StylisticEighteen, "'ss18'"},
      {FontVariant::StylisticNineteen, "'ss19'"},
      {FontVariant::StylisticTwenty, "'ss20'"},
  });

  for (const auto& [variant, tag] : expected) {
    EXPECT_EQ(fontVariantToOpenTypeFeatures(variant), tag);
  }
}

TEST(FontFeatureSettingsTest, defaultFontVariantProducesNoTags) {
  EXPECT_EQ(fontVariantToOpenTypeFeatures(FontVariant::Default), "");
}

// `toMapBuffer(const FontVariant &)` serializes in bit order, so the platforms
// were already receiving bit-ordered tokens rather than authoring order. Pin
// that, since it is what makes this composition byte-identical to the old one.
TEST(FontFeatureSettingsTest, multipleVariantsJoinInBitOrder) {
  EXPECT_EQ(
      fontVariantToOpenTypeFeatures(variants(
          {FontVariant::StylisticThree,
           FontVariant::SmallCaps,
           FontVariant::TabularNums})),
      "'smcp', 'tnum', 'ss03'");
}

#pragma mark - Resolution against fontFeatureSettings

// `std::nullopt` keeps the key out of serialization entirely, so the platform
// keeps its own default.
TEST(FontFeatureSettingsTest, bothUnsetResolvesToNullopt) {
  EXPECT_FALSE(resolve(std::nullopt, std::nullopt));
}

TEST(FontFeatureSettingsTest, fontVariantAloneResolvesToItsTags) {
  EXPECT_EQ(resolve(FontVariant::SmallCaps, std::nullopt), "'smcp'");
}

TEST(FontFeatureSettingsTest, fontFeatureSettingsAloneIsForwardedVerbatim) {
  EXPECT_EQ(resolve(std::nullopt, "'ss01' 1, 'zero'"), "'ss01' 1, 'zero'");
}

// The precedence contract: `fontFeatureSettings` is appended last, and both the
// CSS grammar and the platform shapers resolve duplicate tags last-wins. So
// ordering alone gives `fontFeatureSettings` the win, with no explicit conflict
// resolution to keep in sync between platforms.
TEST(FontFeatureSettingsTest, fontFeatureSettingsIsAppendedAfterFontVariant) {
  EXPECT_EQ(
      resolve(
          variants({FontVariant::SmallCaps, FontVariant::TabularNums}),
          "'smcp' 0"),
      "'smcp', 'tnum', 'smcp' 0");
}

TEST(FontFeatureSettingsTest, normalContributesNoFeaturesButKeepsFontVariant) {
  EXPECT_EQ(resolve(FontVariant::SmallCaps, "normal"), "'smcp'");
  EXPECT_FALSE(resolve(std::nullopt, "normal"));
}

TEST(FontFeatureSettingsTest, normalIsMatchedCaseInsensitivelyAndTrimmed) {
  for (const auto* value : {"NoRmAl", "  normal  ", "\tNORMAL\n"}) {
    EXPECT_FALSE(resolve(std::nullopt, value)) << "value: " << value;
  }
}

TEST(FontFeatureSettingsTest, emptyStringContributesNoFeatures) {
  EXPECT_EQ(resolve(FontVariant::SmallCaps, ""), "'smcp'");
  EXPECT_FALSE(resolve(std::nullopt, ""));
}

TEST(FontFeatureSettingsTest, surroundingWhitespaceIsTrimmedFromRealValues) {
  EXPECT_EQ(resolve(std::nullopt, "  'ss01'  "), "'ss01'");
}

// `normal` is the initial value of the property, so an explicit one renders the
// same as never having set it: it names no feature, and it does not switch off
// the features the font applies on its own. Resolving it to an engaged empty
// string would serialize a value that says "no features" where the contract is
// "no opinion", which costs a span on Android that carries nothing.
TEST(FontFeatureSettingsTest, explicitResetResolvesTheSameAsUnset) {
  EXPECT_EQ(
      resolve(std::nullopt, "normal"), resolve(std::nullopt, std::nullopt));
}

#pragma mark - Inheritance

TEST(FontFeatureSettingsTest, childFontFeatureSettingsReplacesParent) {
  TextAttributes parent;
  TextAttributes child;

  parent.fontFeatureSettings = "'ss01'";
  child.fontFeatureSettings = "'ss02'";
  parent.apply(child);

  EXPECT_EQ(parent.fontFeatureSettings, "'ss02'");
}

TEST(FontFeatureSettingsTest, unsetChildInheritsParentFontFeatureSettings) {
  TextAttributes parent;
  TextAttributes child;

  parent.fontFeatureSettings = "'ss01'";
  parent.apply(child);

  EXPECT_EQ(parent.fontFeatureSettings, "'ss01'");
}

TEST(FontFeatureSettingsTest, emptyChildClearsInheritedFontFeatureSettings) {
  TextAttributes parent;
  TextAttributes child;

  parent.fontFeatureSettings = "'ss01'";
  child.fontFeatureSettings = "";
  parent.apply(child);

  ASSERT_TRUE(parent.fontFeatureSettings.has_value());
  EXPECT_TRUE(parent.fontFeatureSettings->empty());
}

// `fontVariant` and `fontFeatureSettings` inherit independently, so a child
// overriding one must not discard the other.
TEST(FontFeatureSettingsTest, fontVariantAndFontFeatureSettingsInheritApart) {
  TextAttributes parent;
  TextAttributes child;

  parent.fontVariant = FontVariant::SmallCaps;
  child.fontFeatureSettings = "'ss01'";
  parent.apply(child);

  EXPECT_EQ(parent.fontVariant, FontVariant::SmallCaps);
  EXPECT_EQ(resolveFontFeatureSettings(parent), "'smcp', 'ss01'");
}
