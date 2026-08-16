/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <string>
#include <vector>

#include <folly/dynamic.h>
#include <gtest/gtest.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/core/StyleConditionData.h>
#include <react/renderer/core/StyleConditionPrimitives.h>
#include <react/utils/ContextContainer.h>

using namespace facebook::react;

namespace {

StyleCondition cond(MediaQueryCondition query, folly::dynamic value) {
  return StyleCondition{.query = query, .value = std::move(value)};
}

StyleConditionProp prop(
    std::string property,
    std::vector<StyleCondition> conditions) {
  return StyleConditionProp{
      .property = std::move(property), .conditions = std::move(conditions)};
}

} // namespace

#pragma mark - evaluateStyleConditions (also exercises the internal matchesQuery)

TEST(StyleConditionDataTest, colorSchemeMatchesAndMismatches) {
  std::vector<StyleConditionProp> props = {prop(
      "backgroundColor",
      {cond(MediaQueryCondition{.colorScheme = ColorScheme::Dark}, "black")})};

  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Dark, Orientation::Portrait),
      (StyleConditionResolution{0}));
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Light, Orientation::Portrait),
      (StyleConditionResolution{kNoMatchingCondition}));
}

TEST(StyleConditionDataTest, orientationMatchesAndMismatches) {
  std::vector<StyleConditionProp> props = {prop(
      "width",
      {cond(MediaQueryCondition{.orientation = Orientation::Landscape}, 300)})};

  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Light, Orientation::Landscape),
      (StyleConditionResolution{0}));
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Light, Orientation::Portrait),
      (StyleConditionResolution{kNoMatchingCondition}));
}

TEST(StyleConditionDataTest, andSemanticsRequireEveryField) {
  std::vector<StyleConditionProp> props = {prop(
      "width",
      {cond(
          MediaQueryCondition{
              .colorScheme = ColorScheme::Dark,
              .orientation = Orientation::Landscape},
          300)})};

  // Both hold.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Dark, Orientation::Landscape),
      (StyleConditionResolution{0}));
  // Orientation holds, scheme wrong.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Light, Orientation::Landscape),
      (StyleConditionResolution{kNoMatchingCondition}));
  // Scheme holds, orientation wrong.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Dark, Orientation::Portrait),
      (StyleConditionResolution{kNoMatchingCondition}));
}

TEST(StyleConditionDataTest, colorSchemeOnlyQueryIgnoresOrientation) {
  std::vector<StyleConditionProp> props = {prop(
      "backgroundColor",
      {cond(MediaQueryCondition{.colorScheme = ColorScheme::Dark}, "black")})};

  // Orientation is not queried, so it does not affect the match.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Dark, Orientation::Portrait),
      (StyleConditionResolution{0}));
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Dark, Orientation::Landscape),
      (StyleConditionResolution{0}));
}

TEST(StyleConditionDataTest, lastMatchingConditionWins) {
  std::vector<StyleConditionProp> props = {prop(
      "width",
      {cond(MediaQueryCondition{.orientation = Orientation::Landscape}, 300),
       cond(MediaQueryCondition{.colorScheme = ColorScheme::Dark}, 600)})};

  // Only the first condition matches.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Light, Orientation::Landscape),
      (StyleConditionResolution{0}));
  // Both match -> the later condition (index 1) wins.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Dark, Orientation::Landscape),
      (StyleConditionResolution{1}));
  // Neither matches -> default.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Light, Orientation::Portrait),
      (StyleConditionResolution{kNoMatchingCondition}));
}

TEST(StyleConditionDataTest, multiplePropertiesResolveIndependently) {
  std::vector<StyleConditionProp> props = {
      prop(
          "width",
          {cond(
              MediaQueryCondition{.orientation = Orientation::Landscape}, 300)}),
      prop(
          "backgroundColor",
          {cond(
              MediaQueryCondition{.colorScheme = ColorScheme::Dark},
              "black")})};

  // Landscape + dark: both.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Dark, Orientation::Landscape),
      (StyleConditionResolution{0, 0}));
  // Portrait + light: neither.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Light, Orientation::Portrait),
      (StyleConditionResolution{
          kNoMatchingCondition, kNoMatchingCondition}));
  // Portrait + dark: only backgroundColor.
  EXPECT_EQ(
      evaluateStyleConditions(props, ColorScheme::Dark, Orientation::Portrait),
      (StyleConditionResolution{kNoMatchingCondition, 0}));
}

#pragma mark - anyConditionMatches

TEST(StyleConditionDataTest, anyConditionMatches) {
  EXPECT_FALSE(anyConditionMatches({}));
  EXPECT_FALSE(anyConditionMatches(
      {kNoMatchingCondition, kNoMatchingCondition}));
  EXPECT_TRUE(anyConditionMatches({kNoMatchingCondition, 0}));
  EXPECT_TRUE(anyConditionMatches({2}));
}

#pragma mark - buildStyleConditionPatch

TEST(StyleConditionDataTest, buildStyleConditionPatchEmitsMatchedValuesOnly) {
  std::vector<StyleConditionProp> props = {
      prop(
          "width",
          {cond(
              MediaQueryCondition{.orientation = Orientation::Landscape}, 300)}),
      prop(
          "backgroundColor",
          {cond(
              MediaQueryCondition{.colorScheme = ColorScheme::Dark},
              "black")})};

  // width matched (index 0); backgroundColor did not (-1).
  auto patch = buildStyleConditionPatch(
      props, StyleConditionResolution{0, kNoMatchingCondition});

  ASSERT_TRUE(patch.isObject());
  ASSERT_NE(patch.get_ptr("width"), nullptr);
  EXPECT_EQ(*patch.get_ptr("width"), folly::dynamic(300));
  EXPECT_EQ(patch.get_ptr("backgroundColor"), nullptr);
}

TEST(StyleConditionDataTest, buildStyleConditionPatchIsEmptyWhenNothingMatches) {
  std::vector<StyleConditionProp> props = {prop(
      "width",
      {cond(MediaQueryCondition{.orientation = Orientation::Landscape}, 300)})};

  auto patch = buildStyleConditionPatch(
      props, StyleConditionResolution{kNoMatchingCondition});

  ASSERT_TRUE(patch.isObject());
  EXPECT_EQ(patch.size(), 0u);
}

#pragma mark - fromRawValue (round-trips the wire format, exercises parseQuery)

TEST(StyleConditionDataTest, fromRawValueParsesTheWireFormat) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  // {width: [{query: {orientation: "landscape"}, value: 300}]}
  auto dynamic = folly::dynamic::object(
      "width",
      folly::dynamic::array(folly::dynamic::object(
          "query",
          folly::dynamic::object("orientation", "landscape"))("value", 300)));

  std::shared_ptr<const StyleConditionData> data;
  fromRawValue(parserContext, RawValue(std::move(dynamic)), data);

  ASSERT_NE(data, nullptr);
  ASSERT_NE(data->styleConditionProps, nullptr);
  ASSERT_EQ(data->styleConditionProps->size(), 1u);

  const auto& parsed = (*data->styleConditionProps)[0];
  EXPECT_EQ(parsed.property, "width");
  ASSERT_EQ(parsed.conditions.size(), 1u);
  ASSERT_TRUE(parsed.conditions[0].query.orientation.has_value());
  EXPECT_EQ(*parsed.conditions[0].query.orientation, Orientation::Landscape);
  EXPECT_EQ(parsed.conditions[0].value, folly::dynamic(300));

  // Freshly parsed props carry an all-default resolution and no unpatched base.
  EXPECT_EQ(
      data->resolution, (StyleConditionResolution{kNoMatchingCondition}));
  EXPECT_EQ(data->unpatchedProps, nullptr);
}

TEST(StyleConditionDataTest, fromRawValuePreservesConditionOrder) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  // Two conditions on one property: order must survive so last-match-wins holds.
  auto dynamic = folly::dynamic::object(
      "width",
      folly::dynamic::array(
          folly::dynamic::object(
              "query",
              folly::dynamic::object("orientation", "portrait"))("value", 300),
          folly::dynamic::object(
              "query",
              folly::dynamic::object("orientation", "landscape"))(
              "value", 600)));

  std::shared_ptr<const StyleConditionData> data;
  fromRawValue(parserContext, RawValue(std::move(dynamic)), data);

  ASSERT_NE(data, nullptr);
  ASSERT_EQ(data->styleConditionProps->size(), 1u);
  const auto& conditions = (*data->styleConditionProps)[0].conditions;
  ASSERT_EQ(conditions.size(), 2u);
  EXPECT_EQ(*conditions[0].query.orientation, Orientation::Portrait);
  EXPECT_EQ(*conditions[1].query.orientation, Orientation::Landscape);
}

TEST(StyleConditionDataTest, fromRawValueIsNullForNonObject) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  std::shared_ptr<const StyleConditionData> data;
  fromRawValue(parserContext, RawValue(folly::dynamic(nullptr)), data);
  EXPECT_EQ(data, nullptr);
}
