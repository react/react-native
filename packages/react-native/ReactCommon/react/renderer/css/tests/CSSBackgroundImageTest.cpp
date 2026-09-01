/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSBackgroundImage.h>

namespace facebook::react {

namespace {

CSSColorStop
makeCSSColorStop(uint8_t r, uint8_t g, uint8_t b, uint8_t a = 255) {
  return CSSColorStop{.color = CSSColor{.r = r, .g = g, .b = b, .a = a}};
}

} // namespace

class CSSBackgroundImageTest : public ::testing::Test {};

TEST_F(CSSBackgroundImageTest, LinearGradientToRight) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(to right, red, blue)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 90.0f}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientToBottomRight) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(to bottom right, red, blue)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{
              .value = CSSLinearGradientDirectionKeyword::ToBottomRight},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, EmptyStringReturnsEmptyArray) {
  auto result = parseCSSProperty<CSSBackgroundImageList>("");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSBackgroundImageTest, InvalidValueReturnsEmptyArray) {
  auto result = parseCSSProperty<CSSBackgroundImageList>("linear-");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithWhitespacesInDirection) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(to   bottom   right, red, blue)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{
              .value = CSSLinearGradientDirectionKeyword::ToBottomRight},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithRandomWhitespaces) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      " linear-gradient(to   bottom   right,  red  30%,  blue  80%)  ");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{
              .value = CSSLinearGradientDirectionKeyword::ToBottomRight},
      .items = {
          CSSColorStop{
              .color = CSSColor{.r = 255, .g = 0, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 30.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 80.0f}},
      }};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithAngle) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("linear-gradient(45deg, red, blue)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 45.0f}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientCaseInsensitive) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "LiNeAr-GradieNt(To Bottom, Red, Blue)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, MultipleLinearGradientsWithNewlines) {
  auto result = parseCSSProperty<CSSBackgroundImageList>(
      "\n      linear-gradient(to top, red, blue),\n      linear-gradient(to bottom, green, yellow)");
  decltype(result) expected = CSSBackgroundImageList{
      {CSSLinearGradientFunction{
           .direction =
               CSSLinearGradientDirection{.value = CSSAngle{.degrees = 0.0f}},
           .items =
               {CSSColorStop{
                    .color = CSSColor{.r = 255, .g = 0, .b = 0, .a = 255}},
                CSSColorStop{
                    .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255}}}},
       CSSLinearGradientFunction{
           .direction =
               CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
           .items = {
               CSSColorStop{
                   .color = CSSColor{.r = 0, .g = 128, .b = 0, .a = 255}},
               CSSColorStop{
                   .color = CSSColor{.r = 255, .g = 255, .b = 0, .a = 255}},
           }}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithMultipleColorStops) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(to bottom, red 0%, green 50%, blue 100%)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
      .items = {
          CSSColorStop{
              .color = CSSColor{.r = 255, .g = 0, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 0.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 128, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 50.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 100.0f}},
      }};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithColorStopEndPosition) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(red 10% 30%, blue 50%)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
      .items = {
          CSSColorStop{
              .color = CSSColor{.r = 255, .g = 0, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 10.0f},
              .endPosition = CSSPercentage{.value = 30.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 50.0f}}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientMixedPositionedStops) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(to right, red, green, blue 60%, yellow, purple)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 90.0f}},
      .items = {
          makeCSSColorStop(255, 0, 0),
          makeCSSColorStop(0, 128, 0),
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 60.0f}},
          makeCSSColorStop(255, 255, 0),
          makeCSSColorStop(128, 0, 128),
      }};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithHslColors) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(hsl(330, 100%, 45.1%), hsl(0, 100%, 50%))");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
      .items = {makeCSSColorStop(230, 0, 115), makeCSSColorStop(255, 0, 0)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithoutDirection) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("linear-gradient(#e66465, #9198e5)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
      .items = {
          makeCSSColorStop(230, 100, 101), makeCSSColorStop(145, 152, 229)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientInvalidCases) {
  const std::vector<std::string> invalidInputs = {
      "linear-gradient(45deg, rede, blue)",
      "linear-gradient(45 deg, red, blue)",
      "linear-gradient(to left2, red, blue)",
      "linear-gradient(to left, red 5, blue)"};
  for (const auto& input : invalidInputs) {
    const auto result = parseCSSProperty<CSSBackgroundImage>(input);
    ASSERT_TRUE(std::holds_alternative<std::monostate>(result))
        << "Input should be invalid: " << input;
  }
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithMultipleTransitionHints) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(red, 20%, blue, 60%, green, 80%, yellow)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
      .items = {
          makeCSSColorStop(255, 0, 0),
          CSSColorHint{.position = CSSPercentage{.value = 20.0f}},
          makeCSSColorStop(0, 0, 255),
          CSSColorHint{.position = CSSPercentage{.value = 60.0f}},
          makeCSSColorStop(0, 128, 0),
          CSSColorHint{.position = CSSPercentage{.value = 80.0f}},
          makeCSSColorStop(255, 255, 0),
      }};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, LinearGradientInvalidTransitionHints) {
  const std::vector<std::string> invalidInputs = {
      // color hints must be between two color stops
      "linear-gradient(red, 30%, blue, 60%, green, 80%)",
      "linear-gradient(red, 30%, 60%, green)",
      "linear-gradient(20%, red, green)"};
  for (const auto& input : invalidInputs) {
    const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
    ASSERT_TRUE(std::holds_alternative<std::monostate>(result))
        << "Input should be invalid: " << input;
  }
}

TEST_F(CSSBackgroundImageTest, LinearGradientWithMixedUnits) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "linear-gradient(red 10%, 20px, blue 30%, purple 40px)");
  decltype(result) expected = CSSLinearGradientFunction{
      .direction =
          CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
      .items = {
          CSSColorStop{
              .color = CSSColor{.r = 255, .g = 0, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 10.0f}},
          CSSColorHint{
              .position = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 30.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 128, .g = 0, .b = 128, .a = 255},
              .startPosition =
                  CSSLength{.value = 40.0f, .unit = CSSLengthUnit::Px}},
      }};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, RadialGradientBasic) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("radial-gradient(red, blue)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Ellipse,
      .size = CSSRadialGradientSizeKeyword::FarthestCorner,
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 50.0f},
              .left = CSSPercentage{.value = 50.0f}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, RadialGradientInferCircleFromSingleLength) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("radial-gradient(100px, red, blue)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Circle,
      .size =
          CSSRadialGradientExplicitSize{
              .sizeX = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
              .sizeY = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px}},
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 50.0f},
              .left = CSSPercentage{.value = 50.0f}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, RadialGradientInferEllipseFromDoubleLength) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "radial-gradient(100px 50px, red, blue)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Ellipse,
      .size =
          CSSRadialGradientExplicitSize{
              .sizeX = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
              .sizeY = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px}},
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 50.0f},
              .left = CSSPercentage{.value = 50.0f}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, RadialGradientExplicitShapeWithSize) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "radial-gradient(circle 100px at center, red, blue 80%)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Circle,
      .size =
          CSSRadialGradientExplicitSize{
              .sizeX = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
              .sizeY = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px}},
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 50.0f},
              .left = CSSPercentage{.value = 50.0f}},
      .items = {
          makeCSSColorStop(255, 0, 0),
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 80.0f}}}};
  ASSERT_EQ(result, expected);
}

// 1. position syntax: [ left | center | right | top | bottom |
// <length-percentage> ]
TEST_F(CSSBackgroundImageTest, RadialGradientPositionLengthSyntax) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "radial-gradient(circle at 20px, red, blue)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Circle,
      .size = CSSRadialGradientSizeKeyword::FarthestCorner,
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 50.0f},
              .left = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}
// 2. position syntax: [ left | center | right ] && [ top | center | bottom ]
TEST_F(CSSBackgroundImageTest, RadialGradientPositionKeywordCombinations) {
  const std::vector<std::string> inputs = {
      "radial-gradient(circle at left top, red, blue)",
      "radial-gradient(circle at top left, red, blue)"};
  decltype(parseCSSProperty<CSSBackgroundImage>(inputs[0])) expected =
      CSSRadialGradientFunction{
          .shape = CSSRadialGradientShape::Circle,
          .size = CSSRadialGradientSizeKeyword::FarthestCorner,
          .position =
              CSSRadialGradientPosition{
                  .top = CSSPercentage{.value = 0.0f},
                  .left = CSSPercentage{.value = 0.0f}},
          .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  for (const auto& input : inputs) {
    auto result = parseCSSProperty<CSSBackgroundImage>(input);
    ASSERT_EQ(result, expected) << "Failed for input: " << input;
  }
}

// 3. position syntax: [ left | center | right | <length-percentage> ] [ top
// | center | bottom | <length-percentage> ]
TEST_F(CSSBackgroundImageTest, RadialGradientComplexPositionSyntax) {
  const std::vector<std::pair<std::string, CSSRadialGradientPosition>>
      testCases = {
          {
              "radial-gradient(circle at left 20px, red, blue)",
              {.top = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
               .left = CSSPercentage{.value = 0.f}},
          },
          {
              "radial-gradient(circle at 20px 20px, red, blue)",
              {.top = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
               .left = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px}},
          },
          {
              "radial-gradient(circle at right 50px, red, blue)",
              {.top = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px},
               .right = CSSPercentage{.value = 0.f}},
          }};
  for (const auto& [input, expectedPosition] : testCases) {
    const auto result = parseCSSProperty<CSSBackgroundImage>(input);
    decltype(result) expected = CSSRadialGradientFunction{
        .shape = CSSRadialGradientShape::Circle,
        .size = CSSRadialGradientSizeKeyword::FarthestCorner,
        .position = expectedPosition,
        .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
    ASSERT_EQ(result, expected);
  }
}

// 4. position syntax: [ [ left | right ] <length-percentage> ] && [ [ top |
// bottom ] <length-percentage> ]
TEST_F(CSSBackgroundImageTest, RadialGradientSeparatePositionPercentages) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "radial-gradient(at top 0% right 10%, red, blue)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Ellipse,
      .size = CSSRadialGradientSizeKeyword::FarthestCorner,
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 0.0f},
              .right = CSSPercentage{.value = 10.0f}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, RadialGradientWithTransitionHints) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "radial-gradient(circle, red 0%, 25%, blue 50%, 75%, green 100%)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Circle,
      .size = CSSRadialGradientSizeKeyword::FarthestCorner,
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 50.0f},
              .left = CSSPercentage{.value = 50.0f}},
      .items = {
          CSSColorStop{
              .color = CSSColor{.r = 255, .g = 0, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 0.0f}},
          CSSColorHint{.position = CSSPercentage{.value = 25.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 50.0f}},
          CSSColorHint{.position = CSSPercentage{.value = 75.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 128, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 100.0f}},
      }};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, MultipleGradientsRadialAndLinear) {
  auto result = parseCSSProperty<CSSBackgroundImageList>(
      "radial-gradient(circle at top left, red, blue), linear-gradient(to bottom, green, yellow)");
  decltype(result) expected = CSSBackgroundImageList{
      {CSSRadialGradientFunction{
           .shape = CSSRadialGradientShape::Circle,
           .size = CSSRadialGradientSizeKeyword::FarthestCorner,
           .position =
               CSSRadialGradientPosition{
                   .top = CSSPercentage{.value = 0.0f},
                   .left = CSSPercentage{.value = 0.0f}},
           .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}},
       CSSLinearGradientFunction{
           .direction =
               CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
           .items = {
               makeCSSColorStop(0, 128, 0), makeCSSColorStop(255, 255, 0)}}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, RadialGradientMixedCase) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "RaDiAl-GrAdIeNt(CiRcLe ClOsEsT-sIdE aT cEnTeR, rEd, bLuE)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Circle,
      .size = CSSRadialGradientSizeKeyword::ClosestSide,
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 50.0f},
              .left = CSSPercentage{.value = 50.0f}},
      .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, RadialGradientWhitespaceVariations) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "radial-gradient(   circle    farthest-corner    at    25%    75%   ,   red   0%   ,   blue    100%   )");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Circle,
      .size = CSSRadialGradientSizeKeyword::FarthestCorner,
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 75.0f},
              .left = CSSPercentage{.value = 25.0f}},
      .items = {
          CSSColorStop{
              .color = CSSColor{.r = 255, .g = 0, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 0.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 100.0f}},
      }};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, RadialGradientInvalidCases) {
  const std::vector<std::string> invalidInputs = {
      "radial-gradient(circle at top leftt, red, blue)",
      "radial-gradient(circle at, red, blue)",
      "radial-gradient(ellipse 100px, red, blue)",
      "radial-gradient(ellipse at top 20% top 50%, red, blue)"};
  for (const auto& input : invalidInputs) {
    const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
    ASSERT_TRUE(std::holds_alternative<std::monostate>(result))
        << "Input should be invalid: " << input;
  }
}

TEST_F(CSSBackgroundImageTest, RadialGradientMultipleColorStops) {
  auto result = parseCSSProperty<CSSBackgroundImage>(
      "radial-gradient(red 0%, yellow 30%, green 60%, blue 100%)");
  decltype(result) expected = CSSRadialGradientFunction{
      .shape = CSSRadialGradientShape::Ellipse,
      .size = CSSRadialGradientSizeKeyword::FarthestCorner,
      .position =
          CSSRadialGradientPosition{
              .top = CSSPercentage{.value = 50.0f},
              .left = CSSPercentage{.value = 50.0f}},
      .items = {
          CSSColorStop{
              .color = CSSColor{.r = 255, .g = 0, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 0.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 255, .g = 255, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 30.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 128, .b = 0, .a = 255},
              .startPosition = CSSPercentage{.value = 60.0f}},
          CSSColorStop{
              .color = CSSColor{.r = 0, .g = 0, .b = 255, .a = 255},
              .startPosition = CSSPercentage{.value = 100.0f}}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, InvalidGradientFunctionName) {
  const std::string input =
      "aoeusntial-gradient(red 0%, yellow 30%, green 60%, blue 100%)";
  const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSBackgroundImageTest, RadialGradientNegativeRadius) {
  const std::vector<std::string> invalidInputs = {
      "radial-gradient(circle -100px, red, blue)",
      "radial-gradient(ellipse 100px -40px, red, blue)"};
  for (const auto& input : invalidInputs) {
    const auto result = parseCSSProperty<CSSBackgroundImageList>(input);
    ASSERT_TRUE(std::holds_alternative<std::monostate>(result))
        << "Input should be invalid: " << input;
  }
}

TEST_F(CSSBackgroundImageTest, URLBasicUnquoted) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("url(https://example.com/image.png)");
  decltype(result) expected = CSSURLFunction{.url = "https://example.com/image.png"};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, URLDoubleQuoted) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("url(\"https://example.com/image.png\")");
  decltype(result) expected = CSSURLFunction{.url = "https://example.com/image.png"};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, URLSingleQuoted) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("url('https://example.com/image.png')");
  decltype(result) expected = CSSURLFunction{.url = "https://example.com/image.png"};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, URLCaseInsensitive) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("UrL(https://example.com/image.png)");
  decltype(result) expected = CSSURLFunction{.url = "https://example.com/image.png"};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, URLWithQueryParams) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("url(https://example.com/image.png?size=Large&format=webp)");
  decltype(result) expected = CSSURLFunction{.url = "https://example.com/image.png?size=Large&format=webp"};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, URLWithWhitespace) {
  auto result =
      parseCSSProperty<CSSBackgroundImage>("url(  https://example.com/image.png  )");
  decltype(result) expected = CSSURLFunction{.url = "https://example.com/image.png"};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, MultipleURLs) {
  auto result = parseCSSProperty<CSSBackgroundImageList>(
      "url(https://example.com/bg1.png), url(https://example.com/bg2.png)");
  decltype(result) expected = CSSBackgroundImageList{
      {CSSURLFunction{.url = "https://example.com/bg1.png"},
       CSSURLFunction{.url = "https://example.com/bg2.png"}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, URLMixedWithGradients) {
  auto result = parseCSSProperty<CSSBackgroundImageList>(
      "radial-gradient(circle at top left, red, blue), url(https://example.com/image.png), linear-gradient(to bottom, green, yellow)");
  decltype(result) expected = CSSBackgroundImageList{
      {CSSRadialGradientFunction{
           .shape = CSSRadialGradientShape::Circle,
           .size = CSSRadialGradientSizeKeyword::FarthestCorner,
           .position =
               CSSRadialGradientPosition{
                   .top = CSSPercentage{.value = 0.0f},
                   .left = CSSPercentage{.value = 0.0f}},
           .items = {makeCSSColorStop(255, 0, 0), makeCSSColorStop(0, 0, 255)}},
       CSSURLFunction{.url = "https://example.com/image.png"},
       CSSLinearGradientFunction{
           .direction =
               CSSLinearGradientDirection{.value = CSSAngle{.degrees = 180.0f}},
           .items = {
               makeCSSColorStop(0, 128, 0), makeCSSColorStop(255, 255, 0)}}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSBackgroundImageTest, URLEmpty) {
  auto result = parseCSSProperty<CSSBackgroundImage>("url()");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSBackgroundImageTest, URLEmptyQuoted) {
  auto result = parseCSSProperty<CSSBackgroundImage>("url(\"\")");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

} // namespace facebook::react
