/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSValueParser.h>
#include <string_view>

namespace facebook::react {

TEST(CSSColor, hex_color_values) {
  auto emptyValue = parseCSSProperty<CSSColor>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto hex3DigitColorValue = parseCSSProperty<CSSColor>("#fff");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hex3DigitColorValue));
  EXPECT_EQ(std::get<CSSColor>(hex3DigitColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hex3DigitColorValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hex3DigitColorValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hex3DigitColorValue).a, 255);

  auto hex4DigitColorValue = parseCSSProperty<CSSColor>("#ffff");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hex4DigitColorValue));
  EXPECT_EQ(std::get<CSSColor>(hex4DigitColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hex4DigitColorValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hex4DigitColorValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hex4DigitColorValue).a, 255);

  auto hex6DigitColorValue = parseCSSProperty<CSSColor>("#ffffff");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hex6DigitColorValue));
  EXPECT_EQ(std::get<CSSColor>(hex6DigitColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hex6DigitColorValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hex6DigitColorValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hex6DigitColorValue).a, 255);

  auto hex8DigitColorValue = parseCSSProperty<CSSColor>("#ffffffff");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hex8DigitColorValue));
  EXPECT_EQ(std::get<CSSColor>(hex8DigitColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hex8DigitColorValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hex8DigitColorValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hex8DigitColorValue).a, 255);

  auto hexMixedCaseColorValue = parseCSSProperty<CSSColor>("#FFCc99");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hexMixedCaseColorValue));
  EXPECT_EQ(std::get<CSSColor>(hexMixedCaseColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hexMixedCaseColorValue).g, 204);
  EXPECT_EQ(std::get<CSSColor>(hexMixedCaseColorValue).b, 153);
  EXPECT_EQ(std::get<CSSColor>(hexMixedCaseColorValue).a, 255);

  auto hexDigitOnlyColorValue = parseCSSProperty<CSSColor>("#369");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hexDigitOnlyColorValue));
  EXPECT_EQ(std::get<CSSColor>(hexDigitOnlyColorValue).r, 51);
  EXPECT_EQ(std::get<CSSColor>(hexDigitOnlyColorValue).g, 102);
  EXPECT_EQ(std::get<CSSColor>(hexDigitOnlyColorValue).b, 153);
  EXPECT_EQ(std::get<CSSColor>(hexDigitOnlyColorValue).a, 255);

  auto hexAlphaTestValue = parseCSSProperty<CSSColor>("#FFFFFFCC");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hexAlphaTestValue));
  EXPECT_EQ(std::get<CSSColor>(hexAlphaTestValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hexAlphaTestValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hexAlphaTestValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hexAlphaTestValue).a, 204);
}

TEST(CSSColor, named_colors) {
  auto invalidNamedColorTestValue = parseCSSProperty<CSSColor>("redd");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(invalidNamedColorTestValue));

  auto namedColorTestValue1 = parseCSSProperty<CSSColor>("red");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(namedColorTestValue1));
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue1).r, 255);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue1).g, 0);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue1).b, 0);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue1).a, 255);

  auto namedColorTestValue2 = parseCSSProperty<CSSColor>("cornsilk");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(namedColorTestValue2));
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue2).r, 255);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue2).g, 248);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue2).b, 220);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue2).a, 255);

  auto namedColorMixedCaseTestValue = parseCSSProperty<CSSColor>("sPrINgGrEEn");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(namedColorMixedCaseTestValue));
  EXPECT_EQ(std::get<CSSColor>(namedColorMixedCaseTestValue).r, 0);
  EXPECT_EQ(std::get<CSSColor>(namedColorMixedCaseTestValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(namedColorMixedCaseTestValue).b, 127);
  EXPECT_EQ(std::get<CSSColor>(namedColorMixedCaseTestValue).a, 255);

  auto transparentColor = parseCSSProperty<CSSColor>("transparent");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(transparentColor));
  EXPECT_EQ(std::get<CSSColor>(transparentColor).r, 0);
  EXPECT_EQ(std::get<CSSColor>(transparentColor).g, 0);
  EXPECT_EQ(std::get<CSSColor>(transparentColor).b, 0);
  EXPECT_EQ(std::get<CSSColor>(transparentColor).a, 0);
}

TEST(CSSColor, rgb_rgba_values) {
  auto simpleValue = parseCSSProperty<CSSColor>("rgb(255, 255, 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(simpleValue));
  EXPECT_EQ(std::get<CSSColor>(simpleValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).a, 255);

  auto capsValue = parseCSSProperty<CSSColor>("RGB(255, 255, 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(capsValue));
  EXPECT_EQ(std::get<CSSColor>(capsValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(capsValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(capsValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(capsValue).a, 255);

  auto modernSyntaxValue = parseCSSProperty<CSSColor>("rgb(255 255 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(modernSyntaxValue));
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).a, 255);

  auto mixedDelimeterValue = parseCSSProperty<CSSColor>("rgb(255,255 255)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(mixedDelimeterValue));

  auto mixedSpacingValue = parseCSSProperty<CSSColor>("rgb( 5   4 3)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(mixedSpacingValue));
  EXPECT_EQ(std::get<CSSColor>(mixedSpacingValue).r, 5);
  EXPECT_EQ(std::get<CSSColor>(mixedSpacingValue).g, 4);
  EXPECT_EQ(std::get<CSSColor>(mixedSpacingValue).b, 3);
  EXPECT_EQ(std::get<CSSColor>(mixedSpacingValue).a, 255);

  auto clampedValue = parseCSSProperty<CSSColor>("rgb(-50, 500, 0)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(clampedValue));
  EXPECT_EQ(std::get<CSSColor>(clampedValue).r, 0);
  EXPECT_EQ(std::get<CSSColor>(clampedValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(clampedValue).b, 0);
  EXPECT_EQ(std::get<CSSColor>(clampedValue).a, 255);

  auto fractionalValue = parseCSSProperty<CSSColor>("rgb(0.5, 0.5, 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(fractionalValue));
  EXPECT_EQ(std::get<CSSColor>(fractionalValue).r, 1);
  EXPECT_EQ(std::get<CSSColor>(fractionalValue).g, 1);
  EXPECT_EQ(std::get<CSSColor>(fractionalValue).b, 1);
  EXPECT_EQ(std::get<CSSColor>(fractionalValue).a, 255);

  auto percentageValue = parseCSSProperty<CSSColor>("rgb(50%, 50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(percentageValue));
  EXPECT_EQ(std::get<CSSColor>(percentageValue).r, 128);
  EXPECT_EQ(std::get<CSSColor>(percentageValue).g, 128);
  EXPECT_EQ(std::get<CSSColor>(percentageValue).b, 128);

  auto mixedLegacyNumberPercentageValue =
      parseCSSProperty<CSSColor>("rgb(50%, 0.5, 50%)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(mixedLegacyNumberPercentageValue));

  auto mixedModernNumberPercentageValue =
      parseCSSProperty<CSSColor>("rgb(50% 0.5 50%)");
  EXPECT_TRUE(
      std::holds_alternative<CSSColor>(mixedModernNumberPercentageValue));
  EXPECT_EQ(std::get<CSSColor>(mixedModernNumberPercentageValue).r, 128);
  EXPECT_EQ(std::get<CSSColor>(mixedModernNumberPercentageValue).g, 1);
  EXPECT_EQ(std::get<CSSColor>(mixedModernNumberPercentageValue).b, 128);
  EXPECT_EQ(std::get<CSSColor>(mixedModernNumberPercentageValue).a, 255);

  auto rgbWithNumberAlphaValue =
      parseCSSProperty<CSSColor>("rgb(255 255 255 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbWithNumberAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbWithNumberAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithNumberAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithNumberAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithNumberAlphaValue).a, 128);

  auto rgbWithPercentageAlphaValue =
      parseCSSProperty<CSSColor>("rgb(255 255 255 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbWithPercentageAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbWithPercentageAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithPercentageAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithPercentageAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithPercentageAlphaValue).a, 128);

  auto rgbWithSolidusAlphaValue =
      parseCSSProperty<CSSColor>("rgb(255 255 255 / 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbWithSolidusAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbWithSolidusAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithSolidusAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithSolidusAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithSolidusAlphaValue).a, 128);

  auto rgbLegacySyntaxWithSolidusAlphaValue =
      parseCSSProperty<CSSColor>("rgb(1, 4, 5 /0.5)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(
          rgbLegacySyntaxWithSolidusAlphaValue));

  auto rgbaWithSolidusAlphaValue =
      parseCSSProperty<CSSColor>("rgba(255 255 255 / 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbaWithSolidusAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbaWithSolidusAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithSolidusAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithSolidusAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithSolidusAlphaValue).a, 128);

  auto rgbaWithPercentageSolidusAlphaValue =
      parseCSSProperty<CSSColor>("rgba(255 255 255 / 50%)");
  EXPECT_TRUE(
      std::holds_alternative<CSSColor>(rgbaWithPercentageSolidusAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbaWithPercentageSolidusAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithPercentageSolidusAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithPercentageSolidusAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithPercentageSolidusAlphaValue).a, 128);

  auto rgbaWithoutAlphaValue = parseCSSProperty<CSSColor>("rgba(255 255 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbaWithoutAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbaWithoutAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithoutAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithoutAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithoutAlphaValue).a, 255);

  auto surroundingWhitespaceValue =
      parseCSSProperty<CSSColor>("  rgb(255, 1, 2) ");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(surroundingWhitespaceValue));
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).g, 1);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).b, 2);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).a, 255);

  auto valueWithSingleComponent = parseCSSProperty<CSSColor>("rgb(255)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueWithSingleComponent));

  auto valueWithTooFewComponents = parseCSSProperty<CSSColor>("rgb(255, 255)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(valueWithTooFewComponents));

  auto valueWithTooManyComponents =
      parseCSSProperty<CSSColor>("rgb(255, 255, 255, 255, 255)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(valueWithTooManyComponents));

  auto valueStartingWithComma = parseCSSProperty<CSSColor>("rgb(, 1, 2)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueStartingWithComma));

  auto valueEndingWithComma = parseCSSProperty<CSSColor>("rgb(1, 2, )");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueEndingWithComma));
}

TEST(CSSColor, hsl_hsla_values) {
  auto simpleValue = parseCSSProperty<CSSColor>("hsl(180, 50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(simpleValue));
  EXPECT_EQ(std::get<CSSColor>(simpleValue).r, 64);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).g, 191);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).b, 191);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).a, 255);

  auto modernSyntaxValue = parseCSSProperty<CSSColor>("hsl(180 50% 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(modernSyntaxValue));
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).r, 64);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).g, 191);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).b, 191);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).a, 255);

  auto degreesValue = parseCSSProperty<CSSColor>("hsl(180deg, 50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(degreesValue));
  EXPECT_EQ(std::get<CSSColor>(degreesValue).r, 64);
  EXPECT_EQ(std::get<CSSColor>(degreesValue).g, 191);
  EXPECT_EQ(std::get<CSSColor>(degreesValue).b, 191);
  EXPECT_EQ(std::get<CSSColor>(degreesValue).a, 255);

  auto turnValue = parseCSSProperty<CSSColor>("hsl(0.5turn, 50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(turnValue));
  EXPECT_EQ(std::get<CSSColor>(turnValue).r, 64);
  EXPECT_EQ(std::get<CSSColor>(turnValue).g, 191);
  EXPECT_EQ(std::get<CSSColor>(turnValue).b, 191);
  EXPECT_EQ(std::get<CSSColor>(turnValue).a, 255);

  auto legacySyntaxAlphaValue =
      parseCSSProperty<CSSColor>("hsl(70, 190%, 75%, 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(legacySyntaxAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(legacySyntaxAlphaValue).r, 234);
  EXPECT_EQ(std::get<CSSColor>(legacySyntaxAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(legacySyntaxAlphaValue).b, 128);
  EXPECT_EQ(std::get<CSSColor>(legacySyntaxAlphaValue).a, 128);

  auto modernSyntaxAlphaValue =
      parseCSSProperty<CSSColor>("hsl(70 190% 75% 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(modernSyntaxAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxAlphaValue).r, 234);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxAlphaValue).b, 128);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxAlphaValue).a, 128);

  auto modernSyntaxWithSolidusAlphaValue =
      parseCSSProperty<CSSColor>("hsl(70 190% 75% 0.5)");
  EXPECT_TRUE(
      std::holds_alternative<CSSColor>(modernSyntaxWithSolidusAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxWithSolidusAlphaValue).r, 234);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxWithSolidusAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxWithSolidusAlphaValue).b, 128);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxWithSolidusAlphaValue).a, 128);

  auto percentageAlphaValue =
      parseCSSProperty<CSSColor>("hsl(70 190% 75% 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(percentageAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(percentageAlphaValue).r, 234);
  EXPECT_EQ(std::get<CSSColor>(percentageAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(percentageAlphaValue).b, 128);
  EXPECT_EQ(std::get<CSSColor>(percentageAlphaValue).a, 128);

  auto hslaWithSolidusAlphaValue =
      parseCSSProperty<CSSColor>("hsla(70 190% 75% / 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hslaWithSolidusAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(hslaWithSolidusAlphaValue).r, 234);
  EXPECT_EQ(std::get<CSSColor>(hslaWithSolidusAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hslaWithSolidusAlphaValue).b, 128);
  EXPECT_EQ(std::get<CSSColor>(hslaWithSolidusAlphaValue).a, 128);

  auto rgbLegacySyntaxWithSolidusAlphaValue =
      parseCSSProperty<CSSColor>("hsl(1, 4, 5 / 0.5)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(
          rgbLegacySyntaxWithSolidusAlphaValue));

  auto hslaWithoutAlphaValue = parseCSSProperty<CSSColor>("hsla(70 190% 75%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hslaWithoutAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(hslaWithoutAlphaValue).r, 234);
  EXPECT_EQ(std::get<CSSColor>(hslaWithoutAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hslaWithoutAlphaValue).b, 128);
  EXPECT_EQ(std::get<CSSColor>(hslaWithoutAlphaValue).a, 255);

  auto surroundingWhitespaceValue =
      parseCSSProperty<CSSColor>("  hsl(180, 50%, 50%) ");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(surroundingWhitespaceValue));
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).r, 64);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).g, 191);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).b, 191);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).a, 255);

  auto modernSyntaxWithNumberComponent =
      parseCSSProperty<CSSColor>("hsl(180 50 50%)");
  EXPECT_TRUE(
      std::holds_alternative<CSSColor>(modernSyntaxWithNumberComponent));
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxWithNumberComponent).r, 64);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxWithNumberComponent).g, 191);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxWithNumberComponent).b, 191);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxWithNumberComponent).a, 255);

  auto legacySyntaxWithNumberComponent =
      parseCSSProperty<CSSColor>("hsl(180, 50, 50%)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(legacySyntaxWithNumberComponent));

  auto clampedComponentValue =
      parseCSSProperty<CSSColor>("hsl(360, -100%, 120%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(clampedComponentValue));
  EXPECT_EQ(std::get<CSSColor>(clampedComponentValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(clampedComponentValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(clampedComponentValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(clampedComponentValue).a, 255);

  auto manyDegreesValue = parseCSSProperty<CSSColor>("hsl(540deg, 50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(manyDegreesValue));
  EXPECT_EQ(std::get<CSSColor>(manyDegreesValue).r, 64);
  EXPECT_EQ(std::get<CSSColor>(manyDegreesValue).g, 191);
  EXPECT_EQ(std::get<CSSColor>(manyDegreesValue).b, 191);
  EXPECT_EQ(std::get<CSSColor>(manyDegreesValue).a, 255);

  auto negativeDegreesValue =
      parseCSSProperty<CSSColor>("hsl(-180deg, 50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(negativeDegreesValue));
  EXPECT_EQ(std::get<CSSColor>(negativeDegreesValue).r, 64);
  EXPECT_EQ(std::get<CSSColor>(negativeDegreesValue).g, 191);
  EXPECT_EQ(std::get<CSSColor>(negativeDegreesValue).b, 191);
  EXPECT_EQ(std::get<CSSColor>(negativeDegreesValue).a, 255);

  auto valueWithSingleComponent = parseCSSProperty<CSSColor>("hsl(180deg)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueWithSingleComponent));

  auto valueWithTooFewComponents =
      parseCSSProperty<CSSColor>("hsl(180deg, 50%)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(valueWithTooFewComponents));

  auto valueWithTooManyComponents =
      parseCSSProperty<CSSColor>("hsl(70 190% 75% 0.5 0.5)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(valueWithTooManyComponents));

  auto valueStartingWithComma =
      parseCSSProperty<CSSColor>("hsl(,540deg, 50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueStartingWithComma));

  auto valueEndingWithComma =
      parseCSSProperty<CSSColor>("hsl(540deg, 50%, 50%,)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueEndingWithComma));
}

TEST(CSSColor, hwb_values) {
  auto simpleValue = parseCSSProperty<CSSColor>("hwb(208 14% 42%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(simpleValue));
  EXPECT_EQ(std::get<CSSColor>(simpleValue).r, 36);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).g, 96);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).b, 148);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).a, 255);

  auto grayValue = parseCSSProperty<CSSColor>("hwb(208 100 100)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(grayValue));
  EXPECT_EQ(std::get<CSSColor>(grayValue).r, 128);
  EXPECT_EQ(std::get<CSSColor>(grayValue).g, 128);
  EXPECT_EQ(std::get<CSSColor>(grayValue).b, 128);
  EXPECT_EQ(std::get<CSSColor>(grayValue).a, 255);

  auto angleValue = parseCSSProperty<CSSColor>("hwb(36.3028E-1rad 14% 42%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(angleValue));
  EXPECT_EQ(std::get<CSSColor>(angleValue).r, 36);
  EXPECT_EQ(std::get<CSSColor>(angleValue).g, 96);
  EXPECT_EQ(std::get<CSSColor>(angleValue).b, 148);
  EXPECT_EQ(std::get<CSSColor>(angleValue).a, 255);

  auto legacySyntaxValue = parseCSSProperty<CSSColor>("hwb(208, 14%, 42%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(legacySyntaxValue));

  auto alphaValue = parseCSSProperty<CSSColor>("hwb(208 14% 42% 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(alphaValue));
  EXPECT_EQ(std::get<CSSColor>(alphaValue).r, 36);
  EXPECT_EQ(std::get<CSSColor>(alphaValue).g, 96);
  EXPECT_EQ(std::get<CSSColor>(alphaValue).b, 148);
  EXPECT_EQ(std::get<CSSColor>(alphaValue).a, 128);

  auto alphaPercentageValue =
      parseCSSProperty<CSSColor>("hwb(208 14% 42% 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(alphaPercentageValue));
  EXPECT_EQ(std::get<CSSColor>(alphaPercentageValue).r, 36);
  EXPECT_EQ(std::get<CSSColor>(alphaPercentageValue).g, 96);
  EXPECT_EQ(std::get<CSSColor>(alphaPercentageValue).b, 148);
  EXPECT_EQ(std::get<CSSColor>(alphaPercentageValue).a, 128);

  auto alphaSolidusValue = parseCSSProperty<CSSColor>("hwb(208 14% 42% / 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(alphaSolidusValue));
  EXPECT_EQ(std::get<CSSColor>(alphaSolidusValue).r, 36);
  EXPECT_EQ(std::get<CSSColor>(alphaSolidusValue).g, 96);
  EXPECT_EQ(std::get<CSSColor>(alphaSolidusValue).b, 148);
  EXPECT_EQ(std::get<CSSColor>(alphaSolidusValue).a, 128);

  auto mixedWhitespaceValue =
      parseCSSProperty<CSSColor>(" hwb(     208 14% 42% /0.5 )   ");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(mixedWhitespaceValue));
  EXPECT_EQ(std::get<CSSColor>(mixedWhitespaceValue).r, 36);
  EXPECT_EQ(std::get<CSSColor>(mixedWhitespaceValue).g, 96);
  EXPECT_EQ(std::get<CSSColor>(mixedWhitespaceValue).b, 148);
  EXPECT_EQ(std::get<CSSColor>(mixedWhitespaceValue).a, 128);

  auto extraDegreesValue = parseCSSProperty<CSSColor>("hwb(568 14% 42% / 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(extraDegreesValue));
  EXPECT_EQ(std::get<CSSColor>(extraDegreesValue).r, 36);
  EXPECT_EQ(std::get<CSSColor>(extraDegreesValue).g, 96);
  EXPECT_EQ(std::get<CSSColor>(extraDegreesValue).b, 148);
  EXPECT_EQ(std::get<CSSColor>(extraDegreesValue).a, 128);

  auto negativeDegreesValue =
      parseCSSProperty<CSSColor>("hwb(-152 14% 42% / 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(negativeDegreesValue));
  EXPECT_EQ(std::get<CSSColor>(negativeDegreesValue).r, 36);
  EXPECT_EQ(std::get<CSSColor>(negativeDegreesValue).g, 96);
  EXPECT_EQ(std::get<CSSColor>(negativeDegreesValue).b, 148);
  EXPECT_EQ(std::get<CSSColor>(negativeDegreesValue).a, 128);

  auto missingComponentsValue = parseCSSProperty<CSSColor>("hwb(208 14%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(missingComponentsValue));

  auto tooManyComponentsValue =
      parseCSSProperty<CSSColor>("hwb(208 14% 42% 0.5 0.5)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(tooManyComponentsValue));

  auto valueStartingWithComma =
      parseCSSProperty<CSSColor>("hwb(,208 14% 42% / 0.5)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueStartingWithComma));

  auto valueEndingWithComma =
      parseCSSProperty<CSSColor>("hwb(208 14% 42% / 0.5,)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueEndingWithComma));
}

namespace {

void expectColor(std::string_view input, int r, int g, int b, int a) {
  auto value = parseCSSProperty<CSSColor>(input);
  ASSERT_TRUE(std::holds_alternative<CSSColor>(value)) << input;
  EXPECT_EQ(static_cast<int>(std::get<CSSColor>(value).r), r) << input;
  EXPECT_EQ(static_cast<int>(std::get<CSSColor>(value).g), g) << input;
  EXPECT_EQ(static_cast<int>(std::get<CSSColor>(value).b), b) << input;
  EXPECT_EQ(static_cast<int>(std::get<CSSColor>(value).a), a) << input;
}

void expectInvalid(std::string_view input) {
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(parseCSSProperty<CSSColor>(input)))
      << input;
}

} // namespace

// Expected values in the lab(), lch(), oklab(), and oklch() tests match the
// CSS Color 4 reference conversions and gamut mapping, as implemented by the
// ColorAide library (https://github.com/facelessuser/coloraide).

TEST(CSSColor, oklch_values) {
  expectColor("oklch(0.628 0.2577 29.23)", 255, 0, 0, 255);
  expectColor("oklch(1 0 0)", 255, 255, 255, 255);
  expectColor("oklch(0 0 0)", 0, 0, 0, 255);
  expectColor("oklch(0.5 0 0)", 99, 99, 99, 255);

  // Tailwind CSS v4 palette: blue-500, green-500, orange-500
  expectColor("oklch(62.3% 0.214 259.815)", 43, 127, 255, 255);
  expectColor("oklch(72.3% 0.219 149.579)", 0, 201, 80, 255);
  expectColor("oklch(70.5% 0.213 47.604)", 255, 105, 0, 255);

  // 100% lightness is 1, and 100% chroma is 0.4
  expectColor("oklch(50% 50% 180)", 0, 119, 102, 255);

  expectColor("OKLCH(0.7 0.1 30)", 213, 134, 121, 255);
  expectColor("  oklch(   0.7   0.1 30   /0.5 )  ", 213, 134, 121, 128);
}

TEST(CSSColor, oklch_hue_values) {
  expectColor("oklch(0.7 0.1 30)", 213, 134, 121, 255);
  expectColor("oklch(0.7 0.1 30deg)", 213, 134, 121, 255);
  expectColor("oklch(0.7 0.1 0.5236rad)", 213, 134, 121, 255);
  expectColor("oklch(0.7 0.1 33.3333grad)", 213, 134, 121, 255);
  expectColor("oklch(0.7 0.1 0.083333turn)", 213, 134, 121, 255);
  expectColor("oklch(0.7 0.1 390)", 213, 134, 121, 255);
  expectColor("oklch(0.7 0.1 -330)", 213, 134, 121, 255);

  // Hue has no effect on an achromatic color
  expectColor("oklch(0.5 0 180)", 99, 99, 99, 255);
}

TEST(CSSColor, oklab_values) {
  expectColor("oklab(0.5 0.1 -0.1)", 129, 69, 154, 255);
  expectColor("oklab(0.62796 0.22486 0.12585)", 255, 0, 0, 255);
  expectColor("oklab(1 0 0)", 255, 255, 255, 255);

  // 100% lightness is 1, and 100% of a and b is 0.4
  expectColor("oklab(50% 25% -25%)", 129, 69, 154, 255);

  expectColor("Oklab(0.5 0.1 -0.1 / 0.5)", 129, 69, 154, 128);
}

TEST(CSSColor, lab_values) {
  expectColor("lab(50 0 0)", 119, 119, 119, 255);
  expectColor("lab(100 0 0)", 255, 255, 255, 255);
  expectColor("lab(0 0 0)", 0, 0, 0, 255);
  expectColor("lab(54.29 80.8 69.89)", 255, 0, 0, 255);
  expectColor("lab(50 40 30)", 187, 88, 70, 255);

  // 100% lightness is 100, and 100% of a and b is 125
  expectColor("lab(50% 40% 20%)", 199, 76, 80, 255);

  expectColor("LAB(50 40 30)", 187, 88, 70, 255);
}

TEST(CSSColor, lch_values) {
  expectColor("lch(50 0 0)", 119, 119, 119, 255);
  expectColor("lch(54.29 106.84 40.85)", 255, 0, 0, 255);
  expectColor("lch(50 60 120)", 84, 132, 4, 255);

  // 100% lightness is 100, and 100% chroma is 150
  expectColor("lch(50% 40% 90)", 137, 118, 0, 255);

  expectColor("lch(50 60 120deg / 25%)", 84, 132, 4, 64);
}

TEST(CSSColor, lab_family_alpha_values) {
  expectColor("oklch(0.7 0.1 30 / 0.5)", 213, 134, 121, 128);
  expectColor("oklch(0.7 0.1 30 / 50%)", 213, 134, 121, 128);
  expectColor("oklch(0.7 0.1 30 / 1.5)", 213, 134, 121, 255);
  expectColor("oklch(0.7 0.1 30 / -0.5)", 213, 134, 121, 0);
}

TEST(CSSColor, lab_family_none_components) {
  // A missing component resolves to zero
  expectColor("oklch(none 0.1 30)", 0, 0, 0, 255);
  expectColor("oklch(0.7 none 30)", 158, 158, 158, 255);
  expectColor("oklch(0.5 0 none)", 99, 99, 99, 255);
  expectColor("oklch(0.7 0.1 30 / none)", 213, 134, 121, 0);
  expectColor("oklab(0.5 none none)", 99, 99, 99, 255);
  expectColor("lab(50 none 30)", 132, 118, 67, 255);
  expectColor("lch(50 60 none)", 206, 63, 122, 255);
}

TEST(CSSColor, lab_family_clamped_components) {
  // Lightness is clamped to [0%, 100%]
  expectColor("oklch(1.5 0.1 30)", 255, 255, 255, 255);
  expectColor("oklch(150% 0.1 30)", 255, 255, 255, 255);
  expectColor("oklch(-0.5 0.1 30)", 0, 0, 0, 255);
  expectColor("lab(150 0 0)", 255, 255, 255, 255);
  expectColor("lab(-10 0 0)", 0, 0, 0, 255);

  // Negative chroma is clamped to zero
  expectColor("oklch(0.5 -0.1 30)", 99, 99, 99, 255);
  expectColor("lch(50 -60 120)", 119, 119, 119, 255);
}

TEST(CSSColor, lab_family_gamut_mapping) {
  // Colors outside of sRGB reduce chroma until clipping is imperceptible,
  // preserving lightness and hue. Clipping each channel on its own would
  // instead give rgb(255, 0, 0) for this orange.
  expectColor("oklab(0.7 0.4 0.4)", 255, 97, 0, 255);
  expectColor("oklch(0.7 0.4 145)", 0, 195, 0, 255);
  expectColor("oklch(0.9 0.3 100)", 255, 223, 0, 255);
  expectColor("lab(50 150 -150)", 184, 100, 255, 255);
  expectColor("lch(50 200 300)", 30, 143, 255, 255);

  // Extreme chroma still converges
  expectColor("oklch(0.5 10000000000 30)", 195, 0, 0, 255);
  expectColor("lch(50 1000000 30)", 255, 255, 255, 255);
}

TEST(CSSColor, lab_family_invalid_values) {
  // No legacy comma-separated syntax
  expectInvalid("oklch(0.7, 0.1, 30)");
  expectInvalid("oklab(0.5, 0.1, -0.1)");
  expectInvalid("lab(50, 40, 30)");
  expectInvalid("lch(50, 60, 120)");

  // Wrong number of components
  expectInvalid("oklch()");
  expectInvalid("oklch(0.7)");
  expectInvalid("oklch(0.7 0.1)");
  expectInvalid("oklab(0.5 0.1)");
  expectInvalid("lab(50 40)");
  expectInvalid("oklch(0.7 0.1 30 / 0.5 0.5)");

  // Alpha must follow a solidus
  expectInvalid("oklch(0.7 0.1 30 0.5)");
  expectInvalid("oklab(0.5 0.1 -0.1 0.5)");
  expectInvalid("oklch(0.7 0.1 30 /)");

  // Stray commas
  expectInvalid("oklch(0.7 0.1 30,)");
  expectInvalid("oklch(,0.7 0.1 30)");
  expectInvalid("lab(50 40 30 / 0.5,)");

  // Components of the wrong type
  expectInvalid("oklch(30deg 0.1 30)");
  expectInvalid("oklch(0.7 0.1deg 30)");
  expectInvalid("oklch(0.7 0.1 30%)");
  expectInvalid("oklch(0.7 0.1 auto)");
  expectInvalid("oklch(0.7 0.1 30 / 30deg)");
  expectInvalid("oklab(0.5 0.1 30deg)");
  expectInvalid("lch(50 60deg 120)");
  expectInvalid("lch(50 60 120%)");

  // A hue which overflows when converted to degrees
  expectInvalid("oklch(0.7 0.1 1e38rad)");
}

TEST(CSSColor, constexpr_values) {
  [[maybe_unused]] constexpr auto emptyValue = parseCSSProperty<CSSColor>("");

  [[maybe_unused]] constexpr auto hexColorValue =
      parseCSSProperty<CSSColor>("#fff");

  [[maybe_unused]] constexpr auto rgbFunctionValue =
      parseCSSProperty<CSSColor>("rgb(255, 255, 255)");
}

// The PlatformColor fallback is a raw CSS <color> parsed by this same parser on
// a token miss. Pins the promised fallback formats to their RGBA, and checks
// that unparseable input yields std::monostate so native degrades to
// transparent.
TEST(CSSColor, platform_color_fallback_contract) {
  auto expectColor = [](std::string_view input, int r, int g, int b, int a) {
    auto value = parseCSSProperty<CSSColor>(input);
    ASSERT_TRUE(std::holds_alternative<CSSColor>(value)) << input;
    EXPECT_EQ(static_cast<int>(std::get<CSSColor>(value).r), r) << input;
    EXPECT_EQ(static_cast<int>(std::get<CSSColor>(value).g), g) << input;
    EXPECT_EQ(static_cast<int>(std::get<CSSColor>(value).b), b) << input;
    EXPECT_EQ(static_cast<int>(std::get<CSSColor>(value).a), a) << input;
  };

  expectColor("#0f0", 0, 255, 0, 255); // #RGB
  expectColor("#ff0000", 255, 0, 0, 255); // #RRGGBB
  expectColor(
      "#ff000080", 255, 0, 0, 128); // #RRGGBBAA — alpha is the LAST byte
  expectColor("rgb(0, 128, 255)", 0, 128, 255, 255);
  expectColor("rgba(0, 128, 255, 0.5)", 0, 128, 255, 128);
  expectColor("hsl(120, 100%, 50%)", 0, 255, 0, 255);
  expectColor("hsla(120, 100%, 50%, 0.5)", 0, 255, 0, 128);
  expectColor("cornflowerblue", 100, 149, 237, 255);
  expectColor("transparent", 0, 0, 0, 0);

  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(parseCSSProperty<CSSColor>("")));
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(
          parseCSSProperty<CSSColor>("not-a-color")));
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(
          parseCSSProperty<CSSColor>("#GG0000")));
}

} // namespace facebook::react
