/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/view/BoxShadowPropsConversions.h>
#include <react/renderer/components/view/FilterPropsConversions.h>
#include <react/renderer/components/view/conversions.h>

namespace facebook::react {

TEST(ConversionsTest, unprocessed_box_shadow_string) {
  RawValue value{
      folly::dynamic("10px 2px 0 5px #fff, inset 20px 10px 5px 0 #000")};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_EQ(boxShadows.size(), 2);
  EXPECT_EQ(boxShadows[0].offsetX, 10);
  EXPECT_EQ(boxShadows[0].offsetY, 2);
  EXPECT_EQ(boxShadows[0].blurRadius, 0);
  EXPECT_EQ(boxShadows[0].spreadDistance, 5);
  EXPECT_EQ(boxShadows[0].color, colorFromRGBA(255, 255, 255, 255));
  EXPECT_FALSE(boxShadows[0].inset);

  EXPECT_EQ(boxShadows[1].offsetX, 20);
  EXPECT_EQ(boxShadows[1].offsetY, 10);
  EXPECT_EQ(boxShadows[1].blurRadius, 5);
  EXPECT_EQ(boxShadows[1].spreadDistance, 0);
  EXPECT_EQ(boxShadows[1].color, colorFromRGBA(0, 0, 0, 255));
  EXPECT_TRUE(boxShadows[1].inset);
}

TEST(ConversionsTest, unprocessed_box_shadow_objects) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("offsetX", 10)("offsetY", 2)("blurRadius", 3)(
          "spreadDistance", 5),
      folly::dynamic::object("offsetX", 20)("offsetY", 10)("spreadDistance", 2)(
          "color", "#fff")("inset", true))};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_EQ(boxShadows.size(), 2);
  EXPECT_EQ(boxShadows[0].offsetX, 10);
  EXPECT_EQ(boxShadows[0].offsetY, 2);
  EXPECT_EQ(boxShadows[0].blurRadius, 3);
  EXPECT_EQ(boxShadows[0].spreadDistance, 5);
  EXPECT_EQ(boxShadows[0].color, SharedColor{});
  EXPECT_FALSE(boxShadows[0].inset);

  EXPECT_EQ(boxShadows[1].offsetX, 20);
  EXPECT_EQ(boxShadows[1].offsetY, 10);
  EXPECT_EQ(boxShadows[1].blurRadius, 0);
  EXPECT_EQ(boxShadows[1].spreadDistance, 2);
  EXPECT_EQ(boxShadows[1].color, colorFromRGBA(255, 255, 255, 255));
  EXPECT_TRUE(boxShadows[1].inset);
}

TEST(ConversionsTest, unprocessed_box_object_invalid_color) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("offsetX", 10)("offsetY", 2)("blurRadius", 3)(
          "spreadDistance", 5)("color", "hello"))};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_TRUE(boxShadows.empty());
}

TEST(ConversionsTest, unprocessed_box_object_negative_blur) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("offsetX", 10)("offsetY", 2)("blurRadius", -3)(
          "spreadDistance", 5))};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_TRUE(boxShadows.empty());
}

TEST(ConversionsTest, unprocessed_filter_string) {
  RawValue value{folly::dynamic(
      "drop-shadow(10px -2px 0.5px #fff) blur(5px) hue-rotate(90deg) saturate(2) brightness(50%)")};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_EQ(filters.size(), 5);

  EXPECT_EQ(filters[0].type, FilterType::DropShadow);
  EXPECT_TRUE(std::holds_alternative<DropShadowParams>(filters[0].parameters));
  EXPECT_EQ(std::get<DropShadowParams>(filters[0].parameters).offsetX, 10);
  EXPECT_EQ(std::get<DropShadowParams>(filters[0].parameters).offsetY, -2);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[0].parameters).standardDeviation, 0.5);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[0].parameters).color,
      colorFromRGBA(255, 255, 255, 255));

  EXPECT_EQ(filters[1].type, FilterType::Blur);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[1].parameters));
  EXPECT_EQ(std::get<Float>(filters[1].parameters), 5.0f);

  EXPECT_EQ(filters[2].type, FilterType::HueRotate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[2].parameters));
  EXPECT_EQ(std::get<Float>(filters[2].parameters), 90.0f);

  EXPECT_EQ(filters[3].type, FilterType::Saturate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[3].parameters));
  EXPECT_EQ(std::get<Float>(filters[3].parameters), 2.0f);

  EXPECT_EQ(filters[4].type, FilterType::Brightness);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[4].parameters));
  EXPECT_EQ(std::get<Float>(filters[4].parameters), 0.5f);
}

TEST(ConversionsTest, unprocessed_filter_objects) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object(
          "drop-shadow",
          folly::dynamic::object("offsetX", 10)("offsetY", "-2px")(
              "standardDeviation", 0.5)),
      folly::dynamic::object("drop-shadow", "2px 0 0.5px #fff"),
      folly::dynamic::object("blur", 5),
      folly::dynamic::object("hue-rotate", "90deg"),
      folly::dynamic::object("saturate", 2),
      folly::dynamic::object("brightness", "50%"))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_EQ(filters.size(), 6);

  EXPECT_EQ(filters[0].type, FilterType::DropShadow);
  EXPECT_TRUE(std::holds_alternative<DropShadowParams>(filters[0].parameters));
  EXPECT_EQ(std::get<DropShadowParams>(filters[0].parameters).offsetX, 10);
  EXPECT_EQ(std::get<DropShadowParams>(filters[0].parameters).offsetY, -2);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[0].parameters).standardDeviation, 0.5);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[0].parameters).color, SharedColor{});

  EXPECT_EQ(filters[1].type, FilterType::DropShadow);
  EXPECT_TRUE(std::holds_alternative<DropShadowParams>(filters[1].parameters));
  EXPECT_EQ(std::get<DropShadowParams>(filters[1].parameters).offsetX, 2);
  EXPECT_EQ(std::get<DropShadowParams>(filters[1].parameters).offsetY, 0);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[1].parameters).standardDeviation, 0.5);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[1].parameters).color,
      colorFromRGBA(255, 255, 255, 255));

  EXPECT_EQ(filters[2].type, FilterType::Blur);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[2].parameters));
  EXPECT_EQ(std::get<Float>(filters[2].parameters), 5.0f);

  EXPECT_EQ(filters[3].type, FilterType::HueRotate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[3].parameters));
  EXPECT_EQ(std::get<Float>(filters[3].parameters), 90.0f);

  EXPECT_EQ(filters[4].type, FilterType::Saturate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[4].parameters));
  EXPECT_EQ(std::get<Float>(filters[4].parameters), 2.0f);

  EXPECT_EQ(filters[5].type, FilterType::Brightness);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[5].parameters));
  EXPECT_EQ(std::get<Float>(filters[5].parameters), 0.5f);
}

TEST(ConversionsTest, unprocessed_filter_objects_negative_shadow_blur) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object(
          "drop-shadow",
          folly::dynamic::object("offsetX", 10)("offsetY", "-2px")(
              "standardDeviation", -0.5)))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

TEST(ConversionsTest, unprocessed_filter_objects_negative_blur) {
  RawValue value{folly::dynamic::array(folly::dynamic::object("blur", -5))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

TEST(ConversionsTest, unprocessed_filter_objects_negative_contrast) {
  RawValue value{
      folly::dynamic::array(folly::dynamic::object("constrast", -5))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

TEST(ConversionsTest, unprocessed_filter_objects_negative_hue_rotate) {
  RawValue value{
      folly::dynamic::array(folly::dynamic::object("hue-rotate", -5))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_EQ(filters.size(), 1);

  EXPECT_EQ(filters[0].type, FilterType::HueRotate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[0].parameters));
  EXPECT_EQ(std::get<Float>(filters[0].parameters), -5.0f);
}

TEST(ConversionsTest, unprocessed_filter_objects_multiple_objects) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("blur", 5)("hue-rotate", "90deg"))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

TEST(ConversionsTest, unprocessed_filter_objects_unknown_type) {
  RawValue value{
      folly::dynamic::array(folly::dynamic::object("unknown-filter", 5))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

TEST(ConversionsTest, unprocessed_transform_css_string) {
  Transform result;
  parseUnprocessedTransformString(
      "rotate(45deg) scale(2) translateX(10px)", result);

  EXPECT_EQ(result.operations.size(), 3);

  // rotate(45deg) -> Rotate, z = 45 * PI / 180
  EXPECT_EQ(result.operations[0].type, TransformOperationType::Rotate);
  EXPECT_NEAR(
      result.operations[0].z.value,
      static_cast<float>(45.0 * M_PI / 180.0),
      0.001f);

  // scale(2) -> Scale, x=2, y=2
  EXPECT_EQ(result.operations[1].type, TransformOperationType::Scale);
  EXPECT_EQ(result.operations[1].x.value, 2.0f);
  EXPECT_EQ(result.operations[1].y.value, 2.0f);

  // translateX(10px) -> Translate, x=10
  EXPECT_EQ(result.operations[2].type, TransformOperationType::Translate);
  EXPECT_EQ(result.operations[2].x.value, 10.0f);
  EXPECT_EQ(result.operations[2].x.unit, UnitType::Point);
  EXPECT_EQ(result.operations[2].y.value, 0.0f);
}

TEST(ConversionsTest, unprocessed_transform_css_translate_percent) {
  Transform result;
  parseUnprocessedTransformString("translate(10px, 50%)", result);

  EXPECT_EQ(result.operations.size(), 1);
  EXPECT_EQ(result.operations[0].type, TransformOperationType::Translate);
  EXPECT_EQ(result.operations[0].x.value, 10.0f);
  EXPECT_EQ(result.operations[0].x.unit, UnitType::Point);
  EXPECT_EQ(result.operations[0].y.value, 50.0f);
  EXPECT_EQ(result.operations[0].y.unit, UnitType::Percent);
}

TEST(ConversionsTest, unprocessed_transform_css_perspective) {
  Transform result;
  parseUnprocessedTransformString("perspective(500px)", result);

  EXPECT_EQ(result.operations.size(), 1);
  EXPECT_EQ(result.operations[0].type, TransformOperationType::Perspective);
  EXPECT_EQ(result.operations[0].x.value, 500.0f);
}

TEST(ConversionsTest, unprocessed_transform_css_invalid_string) {
  Transform result;
  parseUnprocessedTransformString("not-a-transform", result);

  EXPECT_TRUE(result.operations.empty());
}

TEST(ConversionsTest, unprocessed_transform_rawvalue_string) {
  RawValue value{folly::dynamic("rotate(45deg) scale(2)")};
  Transform result;
  parseUnprocessedTransform(
      PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_EQ(result.operations.size(), 2);
  EXPECT_EQ(result.operations[0].type, TransformOperationType::Rotate);
  EXPECT_EQ(result.operations[1].type, TransformOperationType::Scale);
}

TEST(ConversionsTest, unprocessed_transform_rawvalue_array) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("rotate", "45deg"),
      folly::dynamic::object("scale", 2))};
  Transform result;
  parseUnprocessedTransform(
      PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_EQ(result.operations.size(), 2);
  EXPECT_EQ(result.operations[0].type, TransformOperationType::Rotate);
  EXPECT_EQ(result.operations[1].type, TransformOperationType::Scale);
  EXPECT_EQ(result.operations[1].x.value, 2.0f);
}

TEST(ConversionsTest, unprocessed_transform_rawvalue_matrix) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object(
          "matrix",
          folly::dynamic::array(
              1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)))};
  Transform result;
  parseUnprocessedTransform(
      PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_EQ(result.operations.size(), 1);
  EXPECT_EQ(result.operations[0].type, TransformOperationType::Arbitrary);
}

TEST(ConversionsTest, unprocessed_transform_rawvalue_translate_percent) {
  RawValue value{
      folly::dynamic::array(folly::dynamic::object("translateX", "50%"))};
  Transform result;
  parseUnprocessedTransform(
      PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_EQ(result.operations.size(), 1);
  EXPECT_EQ(result.operations[0].type, TransformOperationType::Translate);
  EXPECT_EQ(result.operations[0].x.value, 50.0f);
  EXPECT_EQ(result.operations[0].x.unit, UnitType::Percent);
}

TEST(ConversionsTest, unprocessed_transform_origin_css_top_left) {
  TransformOrigin result;
  parseUnprocessedTransformOriginString("top left", result);

  EXPECT_EQ(result.xy[0].value, 0.0f);
  EXPECT_EQ(result.xy[0].unit, UnitType::Percent);
  EXPECT_EQ(result.xy[1].value, 0.0f);
  EXPECT_EQ(result.xy[1].unit, UnitType::Percent);
  EXPECT_EQ(result.z, 0.0f);
}

TEST(ConversionsTest, unprocessed_transform_origin_css_center) {
  TransformOrigin result;
  parseUnprocessedTransformOriginString("center", result);

  EXPECT_EQ(result.xy[0].value, 50.0f);
  EXPECT_EQ(result.xy[0].unit, UnitType::Percent);
  EXPECT_EQ(result.xy[1].value, 50.0f);
  EXPECT_EQ(result.xy[1].unit, UnitType::Percent);
  EXPECT_EQ(result.z, 0.0f);
}

TEST(ConversionsTest, unprocessed_transform_origin_css_right_bottom) {
  TransformOrigin result;
  parseUnprocessedTransformOriginString("right bottom", result);

  EXPECT_EQ(result.xy[0].value, 100.0f);
  EXPECT_EQ(result.xy[0].unit, UnitType::Percent);
  EXPECT_EQ(result.xy[1].value, 100.0f);
  EXPECT_EQ(result.xy[1].unit, UnitType::Percent);
  EXPECT_EQ(result.z, 0.0f);
}

TEST(ConversionsTest, unprocessed_transform_origin_css_length_percent) {
  TransformOrigin result;
  parseUnprocessedTransformOriginString("10px 50%", result);

  EXPECT_EQ(result.xy[0].value, 10.0f);
  EXPECT_EQ(result.xy[0].unit, UnitType::Point);
  EXPECT_EQ(result.xy[1].value, 50.0f);
  EXPECT_EQ(result.xy[1].unit, UnitType::Percent);
  EXPECT_EQ(result.z, 0.0f);
}

TEST(ConversionsTest, unprocessed_transform_origin_processed_array) {
  RawValue value{folly::dynamic::array("50%", "50%", 0)};

  TransformOrigin result;
  parseProcessedTransformOrigin(
      PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_EQ(result.xy[0].value, 50.0f);
  EXPECT_EQ(result.xy[0].unit, UnitType::Percent);
  EXPECT_EQ(result.xy[1].value, 50.0f);
  EXPECT_EQ(result.xy[1].unit, UnitType::Percent);
  EXPECT_EQ(result.z, 0.0f);
}

TEST(ConversionsTest, unprocessed_transform_origin_rawvalue_string) {
  RawValue value{folly::dynamic("top left")};
  TransformOrigin result;
  parseUnprocessedTransformOrigin(
      PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_EQ(result.xy[0].value, 0.0f);
  EXPECT_EQ(result.xy[0].unit, UnitType::Percent);
  EXPECT_EQ(result.xy[1].value, 0.0f);
  EXPECT_EQ(result.xy[1].unit, UnitType::Percent);
  EXPECT_EQ(result.z, 0.0f);
}

TEST(ConversionsTest, unprocessed_transform_origin_rawvalue_array) {
  RawValue value{folly::dynamic::array(10, "50%", 5)};
  TransformOrigin result;
  parseUnprocessedTransformOrigin(
      PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_EQ(result.xy[0].value, 10.0f);
  EXPECT_EQ(result.xy[0].unit, UnitType::Point);
  EXPECT_EQ(result.xy[1].value, 50.0f);
  EXPECT_EQ(result.xy[1].unit, UnitType::Percent);
  EXPECT_EQ(result.z, 5.0f);
}

TEST(ConversionsTest, unprocessed_transform_origin_rawvalue_string_with_z) {
  RawValue value{folly::dynamic("center center 15px")};
  TransformOrigin result;
  parseUnprocessedTransformOrigin(
      PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_EQ(result.xy[0].value, 50.0f);
  EXPECT_EQ(result.xy[0].unit, UnitType::Percent);
  EXPECT_EQ(result.xy[1].value, 50.0f);
  EXPECT_EQ(result.xy[1].unit, UnitType::Percent);
  EXPECT_EQ(result.z, 15.0f);
}

TEST(ConversionsTest, unprocessed_font_variant_string_single) {
  FontVariant result{};
  parseUnprocessedFontVariantString("small-caps", result);

  EXPECT_EQ((int)result, (int)FontVariant::SmallCaps);
}

TEST(ConversionsTest, unprocessed_font_variant_string_multiple) {
  FontVariant result{};
  parseUnprocessedFontVariantString(
      "small-caps oldstyle-nums tabular-nums", result);

  EXPECT_EQ(
      (int)result,
      (int)FontVariant::SmallCaps | (int)FontVariant::OldstyleNums |
          (int)FontVariant::TabularNums);
}

TEST(ConversionsTest, unprocessed_font_variant_string_invalid) {
  FontVariant result{};
  parseUnprocessedFontVariantString("not-a-variant", result);

  EXPECT_EQ((int)result, (int)FontVariant::Default);
}

TEST(ConversionsTest, convert_aspect_ratio_float) {
  RawValue value{folly::dynamic(1.5)};
  auto result =
      convertAspectRatio(PropsParserContext{-1, ContextContainer{}}, value);

  EXPECT_FALSE(result.isUndefined());
  EXPECT_EQ(result.unwrap(), 1.5f);
}

TEST(ConversionsTest, convert_aspect_ratio_ratio_string) {
  // CSSRatio parses "16/9" as {numerator: 16, denominator: 9}
  auto ratio = parseCSSProperty<CSSRatio>("16/9");
  ASSERT_TRUE(std::holds_alternative<CSSRatio>(ratio));
  auto r = std::get<CSSRatio>(ratio);
  EXPECT_FALSE(r.isDegenerate());
  EXPECT_NEAR(r.numerator / r.denominator, 16.0f / 9.0f, 0.001f);
}

TEST(ConversionsTest, convert_aspect_ratio_number_string) {
  // CSSRatio parses "1.5" as {numerator: 1.5, denominator: 1.0}
  auto ratio = parseCSSProperty<CSSRatio>("1.5");
  ASSERT_TRUE(std::holds_alternative<CSSRatio>(ratio));
  auto r = std::get<CSSRatio>(ratio);
  EXPECT_FALSE(r.isDegenerate());
  EXPECT_EQ(r.numerator / r.denominator, 1.5f);
}

TEST(ConversionsTest, convert_aspect_ratio_degenerate) {
  auto ratio = parseCSSProperty<CSSRatio>("0/0");
  ASSERT_TRUE(std::holds_alternative<CSSRatio>(ratio));
  EXPECT_TRUE(std::get<CSSRatio>(ratio).isDegenerate());
}

TEST(ConversionsTest, float_optional_from_rawvalue_float) {
  RawValue value{folly::dynamic(1.5)};
  yoga::FloatOptional result;
  fromRawValue(PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_FALSE(result.isUndefined());
  EXPECT_EQ(result.unwrap(), 1.5f);
}

TEST(ConversionsTest, float_optional_undefined_for_non_float) {
  RawValue value{folly::dynamic(nullptr)};
  yoga::FloatOptional result;
  fromRawValue(PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_TRUE(result.isUndefined());
}

TEST(ConversionsTest, float_optional_undefined_for_string) {
  // fromRawValue for FloatOptional does not parse strings —
  // that is handled by convertAspectRatio specifically.
  RawValue value{folly::dynamic("16/9")};
  yoga::FloatOptional result;
  fromRawValue(PropsParserContext{-1, ContextContainer{}}, value, result);

  EXPECT_TRUE(result.isUndefined());
}

} // namespace facebook::react
