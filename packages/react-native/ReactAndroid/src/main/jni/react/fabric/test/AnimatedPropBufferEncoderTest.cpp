/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/fabric/AnimatedPropBufferEncoder.h>
#include <react/renderer/animationbackend/AnimatedPropsBuilder.h>
#include <cmath>
#include <limits>
#include <numbers>

namespace facebook::react {

namespace {

// Protocol codes read by BatchedAnimatedPropsMountItem.
enum Command : int {
  CMD_START_OF_VIEW = 1,
  CMD_START_OF_TRANSFORM = 2,
  CMD_END_OF_TRANSFORM = 3,
  CMD_END_OF_VIEW = 4,
  CMD_RAW_PROPS = 5,
  CMD_OPACITY = 10,
  CMD_BACKGROUND_COLOR = 15,
  CMD_PLACEHOLDER_TEXT_COLOR = 18,
  CMD_SHADOW_COLOR = 19,
  CMD_BORDER_RADIUS = 20,
  CMD_BORDER_BLOCK_COLOR = 47,
  CMD_BORDER_BLOCK_START_COLOR = 48,
  CMD_BORDER_BLOCK_END_COLOR = 49,
  CMD_OUTLINE_COLOR = 50,
  CMD_OUTLINE_OFFSET = 51,
  CMD_OUTLINE_WIDTH = 52,
  CMD_TRANSFORM_TRANSLATE_X = 100,
  CMD_TRANSFORM_ROTATE = 105,
  CMD_TRANSFORM_SKEW_Y = 110,
  CMD_UNIT_PX = 202,
  CMD_UNIT_PERCENT = 203,
};

} // namespace

TEST(
    AnimatedPropBufferEncoderTest,
    encodesDynamicOpacityAndTransformWithoutConsumingInput) {
  folly::dynamic rawProps = folly::dynamic::object("opacity", 0.25)(
      "transform",
      folly::dynamic::array(
          folly::dynamic::object("translateX", 10),
          folly::dynamic::object("scale", 2)));
  std::unordered_map<Tag, AnimatedProps> updates;
  updates.emplace(10, AnimatedProps{{}, std::make_unique<RawProps>(rawProps)});
  auto buffer = encodeAnimatedProps(updates);
  EXPECT_EQ(updates.at(10).rawProps->toDynamic(), rawProps);
  EXPECT_EQ(buffer.ints[0], CMD_START_OF_VIEW);
  EXPECT_EQ(buffer.ints[1], 10);
  EXPECT_EQ(buffer.ints.back(), CMD_END_OF_VIEW);
  EXPECT_TRUE(buffer.rawProps.empty());
  auto again = encodeAnimatedProps(updates);
  EXPECT_EQ(buffer.ints, again.ints);
  EXPECT_EQ(buffer.doubles, again.doubles);
}

TEST(AnimatedPropBufferEncoderTest, copiesFallbackPropsWithoutConsumingInput) {
  folly::dynamic rawProps = folly::dynamic::object("opacity", nullptr)(
      "transform",
      folly::dynamic::array(folly::dynamic::object("futureTransform", 1)))(
      "shadowOffset", folly::dynamic::object("width", 2)("height", 3));
  std::unordered_map<Tag, AnimatedProps> updates;
  updates.emplace(10, AnimatedProps{{}, std::make_unique<RawProps>(rawProps)});
  auto buffer = encodeAnimatedProps(updates);
  EXPECT_EQ(updates.at(10).rawProps->toDynamic(), rawProps);
  ASSERT_EQ(buffer.rawProps.size(), 1);
  EXPECT_EQ(buffer.rawProps[0], rawProps);
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
  EXPECT_TRUE(buffer.doubles.empty());
}

TEST(AnimatedPropBufferEncoderTest, convertsJSIProps) {
  auto runtime = hermes::makeHermesRuntime();
  auto object = jsi::Object(*runtime);
  object.setProperty(*runtime, "opacity", 0.5);
  std::unordered_map<Tag, AnimatedProps> updates;
  updates.emplace(
      10,
      AnimatedProps{
          {},
          std::make_unique<RawProps>(*runtime, jsi::Value(*runtime, object))});
  auto buffer = encodeAnimatedProps(updates);
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{CMD_START_OF_VIEW, 10, CMD_OPACITY, CMD_END_OF_VIEW}));
  EXPECT_EQ(buffer.doubles, (std::vector<double>{0.5}));
  EXPECT_TRUE(buffer.rawProps.empty());
}

TEST(AnimatedPropBufferEncoderTest, convertsJSIFallbackWithoutConsumingInput) {
  auto runtime = hermes::makeHermesRuntime();
  auto object = jsi::Object(*runtime);
  object.setProperty(*runtime, "testID", "animated-view");
  std::unordered_map<Tag, AnimatedProps> updates;
  updates.emplace(
      10,
      AnimatedProps{
          {},
          std::make_unique<RawProps>(*runtime, jsi::Value(*runtime, object))});
  auto buffer = encodeAnimatedProps(updates);
  folly::dynamic expected = folly::dynamic::object("testID", "animated-view");
  ASSERT_EQ(buffer.rawProps.size(), 1);
  EXPECT_EQ(buffer.rawProps[0], expected);
  EXPECT_EQ(updates.at(10).rawProps->toDynamic(), expected);
}

namespace {
AnimatedPropsBuffer encodeRawProps(const folly::dynamic& props) {
  std::unordered_map<Tag, AnimatedProps> updates;
  updates.emplace(10, AnimatedProps{{}, std::make_unique<RawProps>(props)});
  return encodeAnimatedProps(updates);
}
} // namespace

TEST(AnimatedPropBufferEncoderTest, encodesIntegerRadiusAndTranslation) {
  auto radius = encodeRawProps(folly::dynamic::object("borderRadius", 4));
  EXPECT_EQ(
      radius.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW,
          10,
          CMD_BORDER_RADIUS,
          CMD_UNIT_PX,
          CMD_END_OF_VIEW}));
  EXPECT_EQ(radius.doubles, (std::vector<double>{4}));
  EXPECT_TRUE(radius.rawProps.empty());
  auto transform = encodeRawProps(
      folly::dynamic::object(
          "transform",
          folly::dynamic::array(folly::dynamic::object("translateX", 10))));
  EXPECT_EQ(
      transform.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW,
          10,
          CMD_START_OF_TRANSFORM,
          CMD_TRANSFORM_TRANSLATE_X,
          CMD_UNIT_PX,
          CMD_END_OF_TRANSFORM,
          CMD_END_OF_VIEW}));
  EXPECT_EQ(transform.doubles, (std::vector<double>{10}));
  EXPECT_TRUE(transform.rawProps.empty());
}

TEST(AnimatedPropBufferEncoderTest, encodesPercentAndConvertsAnglesToRadians) {
  folly::dynamic props = folly::dynamic::object(
      "transform",
      folly::dynamic::array(
          folly::dynamic::object("translateX", "12.345678901%"),
          folly::dynamic::object("rotate", "45.123456789deg"),
          folly::dynamic::object("skewY", "0.123456789rad")));
  auto buffer = encodeRawProps(props);
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW,
          10,
          CMD_START_OF_TRANSFORM,
          CMD_TRANSFORM_TRANSLATE_X,
          CMD_UNIT_PERCENT,
          CMD_TRANSFORM_ROTATE,
          CMD_TRANSFORM_SKEW_Y,
          CMD_END_OF_TRANSFORM,
          CMD_END_OF_VIEW}));
  EXPECT_EQ(
      buffer.doubles,
      (std::vector<double>{
          12.345678901, 45.123456789 * std::numbers::pi / 180, 0.123456789}));
  EXPECT_TRUE(buffer.rawProps.empty());
}

TEST(AnimatedPropBufferEncoderTest, sendsWholeViewAsRawPropsOnUnsupportedProp) {
  folly::dynamic props = folly::dynamic::object("opacity", 0.5)(
      "transform",
      folly::dynamic::array(
          folly::dynamic::object("scale", 2),
          folly::dynamic::object("translateX", "auto")));
  auto buffer = encodeRawProps(props);
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
  EXPECT_TRUE(buffer.doubles.empty());
  ASSERT_EQ(buffer.rawProps.size(), 1);
  EXPECT_EQ(buffer.rawProps[0], props);
}

TEST(AnimatedPropBufferEncoderTest, preservesUnsupportedPropsAndResets) {
  folly::dynamic props =
      folly::dynamic::object("opacity", nullptr)("backgroundColor", nullptr)(
          "transformOrigin", folly::dynamic::array("50%", 10, 0))(
          "filter",
          folly::dynamic::array(folly::dynamic::object("brightness", 0.5)));
  auto buffer = encodeRawProps(props);
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
  ASSERT_EQ(buffer.rawProps.size(), 1);
  EXPECT_EQ(buffer.rawProps[0], props);
}

TEST(AnimatedPropBufferEncoderTest, rollsBackInvalidRadiusAndMatrix) {
  for (const auto& props : std::vector<folly::dynamic>{
           folly::dynamic::object("borderRadius", "wrong"),
           folly::dynamic::object(
               "transform",
               folly::dynamic::array(
                   folly::dynamic::object(
                       "matrix", folly::dynamic::array(1, 2, 3))))}) {
    auto buffer = encodeRawProps(props);
    EXPECT_EQ(
        buffer.ints,
        (std::vector<int>{
            CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
    EXPECT_TRUE(buffer.doubles.empty());
    ASSERT_EQ(buffer.rawProps.size(), 1);
    EXPECT_EQ(buffer.rawProps[0], props);
  }
}

TEST(AnimatedPropBufferEncoderTest, encodesColorWithoutSignLoss) {
  auto buffer = encodeRawProps(
      folly::dynamic::object("backgroundColor", int64_t{0xff112233}));
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW,
          10,
          CMD_BACKGROUND_COLOR,
          static_cast<int32_t>(0xff112233),
          CMD_END_OF_VIEW}));
  EXPECT_TRUE(buffer.rawProps.empty());
}

TEST(AnimatedPropBufferEncoderTest, encodesAdditionalSynchronousColors) {
  for (const auto& [name, command] : std::vector<std::pair<const char*, int>>{
           {"placeholderTextColor", CMD_PLACEHOLDER_TEXT_COLOR},
           {"shadowColor", CMD_SHADOW_COLOR},
           {"borderBlockColor", CMD_BORDER_BLOCK_COLOR},
           {"borderBlockStartColor", CMD_BORDER_BLOCK_START_COLOR},
           {"borderBlockEndColor", CMD_BORDER_BLOCK_END_COLOR},
           {"outlineColor", CMD_OUTLINE_COLOR}}) {
    SCOPED_TRACE(name);
    for (const auto& color : std::vector<folly::dynamic>{
             int64_t{0xff112233}, double{0xff112233}, int64_t{-15654349}}) {
      auto buffer = encodeRawProps(folly::dynamic::object(name, color));
      EXPECT_EQ(
          buffer.ints,
          (std::vector<int>{
              CMD_START_OF_VIEW,
              10,
              command,
              static_cast<int32_t>(0xff112233),
              CMD_END_OF_VIEW}));
      EXPECT_TRUE(buffer.doubles.empty());
      EXPECT_TRUE(buffer.rawProps.empty());
    }
    for (const auto& color : std::vector<folly::dynamic>{
             nullptr,
             folly::dynamic::object(
                 "resource_paths",
                 folly::dynamic::array("?attr/colorAccent"))}) {
      folly::dynamic props = folly::dynamic::object(name, color);
      auto buffer = encodeRawProps(props);
      EXPECT_EQ(
          buffer.ints,
          (std::vector<int>{
              CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
      EXPECT_TRUE(buffer.doubles.empty());
      ASSERT_EQ(buffer.rawProps.size(), 1);
      EXPECT_EQ(buffer.rawProps[0], props);
    }
  }
}

TEST(AnimatedPropBufferEncoderTest, encodesDoubleColor) {
  auto buffer = encodeRawProps(
      folly::dynamic::object("backgroundColor", double{0xff112233}));
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW,
          10,
          CMD_BACKGROUND_COLOR,
          static_cast<int32_t>(0xff112233),
          CMD_END_OF_VIEW}));
  EXPECT_TRUE(buffer.rawProps.empty());
}

TEST(
    AnimatedPropBufferEncoderTest,
    preservesUnsupportedNumericColorsInFallback) {
  for (double color :
       {-16777215.5,
        1.5,
        std::numeric_limits<double>::lowest(),
        std::numeric_limits<double>::max(),
        -std::numeric_limits<double>::infinity(),
        std::numeric_limits<double>::infinity(),
        std::numeric_limits<double>::quiet_NaN()}) {
    SCOPED_TRACE(color);
    auto buffer = encodeRawProps(
        folly::dynamic::object("opacity", 0.5)("backgroundColor", color));
    EXPECT_EQ(
        buffer.ints,
        (std::vector<int>{
            CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
    EXPECT_TRUE(buffer.doubles.empty());
    ASSERT_EQ(buffer.rawProps.size(), 1);
    EXPECT_EQ(buffer.rawProps[0]["opacity"], 0.5);
    auto decodedColor = buffer.rawProps[0]["backgroundColor"].asDouble();
    if (std::isnan(color)) {
      EXPECT_TRUE(std::isnan(decodedColor));
    } else {
      EXPECT_EQ(decodedColor, color);
    }
  }
}

TEST(AnimatedPropBufferEncoderTest, fallsBackForOutOfRangeIntegerColors) {
  for (const auto& color : std::vector<folly::dynamic>{
           int64_t{std::numeric_limits<uint32_t>::max()} + 1,
           int64_t{std::numeric_limits<int32_t>::min()} - 1,
           double{0x100000000}}) {
    SCOPED_TRACE(color.asString());
    auto buffer =
        encodeRawProps(folly::dynamic::object("backgroundColor", color));
    EXPECT_EQ(
        buffer.ints,
        (std::vector<int>{
            CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
    ASSERT_EQ(buffer.rawProps.size(), 1);
    EXPECT_EQ(buffer.rawProps[0]["backgroundColor"], color);
  }
}

TEST(AnimatedPropBufferEncoderTest, encodesOutlineDimensions) {
  for (const auto& [name, command] : std::vector<std::pair<const char*, int>>{
           {"outlineOffset", CMD_OUTLINE_OFFSET},
           {"outlineWidth", CMD_OUTLINE_WIDTH}}) {
    SCOPED_TRACE(name);
    for (const auto& value : std::vector<folly::dynamic>{-2, 1.25}) {
      auto buffer = encodeRawProps(folly::dynamic::object(name, value));
      EXPECT_EQ(
          buffer.ints,
          (std::vector<int>{CMD_START_OF_VIEW, 10, command, CMD_END_OF_VIEW}));
      EXPECT_EQ(buffer.doubles, (std::vector<double>{value.asDouble()}));
      EXPECT_TRUE(buffer.rawProps.empty());
    }
    for (const auto& value : std::vector<folly::dynamic>{nullptr, "10%"}) {
      folly::dynamic props = folly::dynamic::object(name, value);
      auto buffer = encodeRawProps(props);
      EXPECT_EQ(
          buffer.ints,
          (std::vector<int>{
              CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
      EXPECT_TRUE(buffer.doubles.empty());
      ASSERT_EQ(buffer.rawProps.size(), 1);
      EXPECT_EQ(buffer.rawProps[0], props);
    }
  }
}

TEST(AnimatedPropBufferEncoderTest, typedPropsOverrideRawPropsInFallback) {
  AnimatedPropsBuilder builder;
  builder.setShadowOffset(Size{2, 3});
  auto props = builder.get();
  props.rawProps = std::make_unique<RawProps>(
      folly::dynamic::object("shadowOffset", nullptr)("opacity", 0.5));
  std::unordered_map<Tag, AnimatedProps> updates;
  updates.emplace(10, std::move(props));
  auto buffer = encodeAnimatedProps(updates);
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
  EXPECT_TRUE(buffer.doubles.empty());
  ASSERT_EQ(buffer.rawProps.size(), 1);
  folly::dynamic expected = folly::dynamic::object("opacity", 0.5)(
      "shadowOffset", folly::dynamic::object("width", 2)("height", 3));
  EXPECT_EQ(buffer.rawProps[0], expected);
}

TEST(AnimatedPropBufferEncoderTest, sendsTypedPropsAsRawProps) {
  AnimatedPropsBuilder builder;
  builder.setOpacity(0.75);
  auto props = builder.get();
  props.rawProps =
      std::make_unique<RawProps>(folly::dynamic::object("opacity", 0.25));
  std::unordered_map<Tag, AnimatedProps> updates;
  updates.emplace(10, std::move(props));
  auto buffer = encodeAnimatedProps(updates);
  EXPECT_EQ(
      buffer.ints,
      (std::vector<int>{
          CMD_START_OF_VIEW, 10, CMD_RAW_PROPS, CMD_END_OF_VIEW}));
  EXPECT_TRUE(buffer.doubles.empty());
  ASSERT_EQ(buffer.rawProps.size(), 1);
  folly::dynamic expected = folly::dynamic::object("opacity", 0.75);
  EXPECT_EQ(buffer.rawProps[0], expected);
}

} // namespace facebook::react
