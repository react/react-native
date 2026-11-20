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
#include <algorithm>
#include <array>
#include <cmath>
#include <limits>
#include <numbers>
#include <string>
#include <string_view>
#include <utility>

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
  CMD_BORDER_END_END_RADIUS = 32,
  CMD_BORDER_COLOR = 40,
  CMD_BORDER_BLOCK_COLOR = 47,
  CMD_BORDER_BLOCK_START_COLOR = 48,
  CMD_BORDER_BLOCK_END_COLOR = 49,
  CMD_OUTLINE_COLOR = 50,
  CMD_OUTLINE_OFFSET = 51,
  CMD_OUTLINE_WIDTH = 52,
  CMD_TRANSFORM_TRANSLATE_X = 100,
  CMD_TRANSFORM_TRANSLATE_Y = 101,
  CMD_TRANSFORM_ROTATE = 105,
  CMD_TRANSFORM_SKEW_Y = 110,
  CMD_TRANSFORM_MATRIX = 111,
  CMD_UNIT_PX = 202,
  CMD_UNIT_PERCENT = 203,
};

constexpr std::array<std::pair<const char*, int>, 37> kPropCommands{{
    {"opacity", 10},
    {"elevation", 11},
    {"zIndex", 12},
    {"shadowOpacity", 13},
    {"shadowRadius", 14},
    {"backgroundColor", 15},
    {"color", 16},
    {"tintColor", 17},
    {"placeholderTextColor", 18},
    {"shadowColor", 19},
    {"borderRadius", 20},
    {"borderTopLeftRadius", 21},
    {"borderTopRightRadius", 22},
    {"borderTopStartRadius", 23},
    {"borderTopEndRadius", 24},
    {"borderBottomLeftRadius", 25},
    {"borderBottomRightRadius", 26},
    {"borderBottomStartRadius", 27},
    {"borderBottomEndRadius", 28},
    {"borderStartStartRadius", 29},
    {"borderStartEndRadius", 30},
    {"borderEndStartRadius", 31},
    {"borderEndEndRadius", 32},
    {"borderColor", 40},
    {"borderTopColor", 41},
    {"borderBottomColor", 42},
    {"borderLeftColor", 43},
    {"borderRightColor", 44},
    {"borderStartColor", 45},
    {"borderEndColor", 46},
    {"borderBlockColor", 47},
    {"borderBlockStartColor", 48},
    {"borderBlockEndColor", 49},
    {"outlineColor", 50},
    {"outlineOffset", 51},
    {"outlineWidth", 52},
    {"transform", 2},
}};

constexpr std::array<std::pair<const char*, int>, 13> kTransformCommands{{
    {"translateX", 100},
    {"translateY", 101},
    {"scale", 102},
    {"scaleX", 103},
    {"scaleY", 104},
    {"rotate", 105},
    {"rotateX", 106},
    {"rotateY", 107},
    {"rotateZ", 108},
    {"skewX", 109},
    {"skewY", 110},
    {"matrix", 111},
    {"perspective", 112},
}};

std::array<std::string, 7> lookupBoundaryNames(std::string_view name) {
  auto differentCase = std::string{name};
  differentCase[0] = static_cast<char>(differentCase[0] - 'a' + 'A');
  return {
      "",
      std::string{name.substr(0, name.size() - 1)},
      std::string{name} + "Suffix",
      differentCase,
      std::string{name} + '\0',
      std::string(1, '\0') + std::string{name},
      std::string{name.substr(0, name.size() / 2)} + '\0' +
          std::string{name.substr(name.size() / 2)},
  };
}

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
  updates.emplace(
      10,
      AnimatedProps{
          .props = {}, .rawProps = std::make_unique<RawProps>(rawProps)});
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
  updates.emplace(
      10,
      AnimatedProps{
          .props = {}, .rawProps = std::make_unique<RawProps>(rawProps)});
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
          .props = {},
          .rawProps = std::make_unique<RawProps>(
              *runtime, jsi::Value(*runtime, object))});
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
          .props = {},
          .rawProps = std::make_unique<RawProps>(
              *runtime, jsi::Value(*runtime, object))});
  auto buffer = encodeAnimatedProps(updates);
  folly::dynamic expected = folly::dynamic::object("testID", "animated-view");
  ASSERT_EQ(buffer.rawProps.size(), 1);
  EXPECT_EQ(buffer.rawProps[0], expected);
  EXPECT_EQ(updates.at(10).rawProps->toDynamic(), expected);
}

namespace {
AnimatedPropsBuffer encodeRawProps(const folly::dynamic& props) {
  std::unordered_map<Tag, AnimatedProps> updates;
  updates.emplace(
      10,
      AnimatedProps{
          .props = {}, .rawProps = std::make_unique<RawProps>(props)});
  return encodeAnimatedProps(updates);
}
} // namespace

TEST(AnimatedPropBufferEncoderTest, encodesEveryPropertyCommand) {
  for (const auto& [name, command] : kPropCommands) {
    SCOPED_TRACE(name);
    folly::dynamic value = 1.25;
    std::vector<int> expectedInts{CMD_START_OF_VIEW, 10, command};
    std::vector<double> expectedDoubles;
    if (command == CMD_START_OF_TRANSFORM) {
      value = folly::dynamic::array;
      expectedInts.push_back(CMD_END_OF_TRANSFORM);
    } else if (
        (command >= CMD_BACKGROUND_COLOR && command <= CMD_SHADOW_COLOR) ||
        (command >= CMD_BORDER_COLOR && command <= CMD_OUTLINE_COLOR)) {
      value = int64_t{0xff112233};
      expectedInts.push_back(static_cast<int32_t>(0xff112233));
    } else {
      if (command >= CMD_BORDER_RADIUS &&
          command <= CMD_BORDER_END_END_RADIUS) {
        expectedInts.push_back(CMD_UNIT_PX);
      }
      expectedDoubles.push_back(1.25);
    }
    expectedInts.push_back(CMD_END_OF_VIEW);
    auto buffer = encodeRawProps(folly::dynamic::object(name, value));
    EXPECT_EQ(buffer.ints, expectedInts);
    EXPECT_EQ(buffer.doubles, expectedDoubles);
    EXPECT_TRUE(buffer.rawProps.empty());
  }
}

TEST(AnimatedPropBufferEncoderTest, encodesEveryTransformCommand) {
  for (const auto& [name, command] : kTransformCommands) {
    SCOPED_TRACE(name);
    folly::dynamic value = 1.25;
    std::vector<double> expectedDoubles{1.25};
    if (command == CMD_TRANSFORM_MATRIX) {
      value = folly::dynamic::array;
      for (int i = 0; i < 16; ++i) {
        value.push_back(1.25);
      }
      expectedDoubles.assign(16, 1.25);
    }
    std::vector<int> expectedInts{
        CMD_START_OF_VIEW, 10, CMD_START_OF_TRANSFORM, command};
    if (command == CMD_TRANSFORM_TRANSLATE_X ||
        command == CMD_TRANSFORM_TRANSLATE_Y) {
      expectedInts.push_back(CMD_UNIT_PX);
    }
    expectedInts.push_back(CMD_END_OF_TRANSFORM);
    expectedInts.push_back(CMD_END_OF_VIEW);
    auto buffer = encodeRawProps(
        folly::dynamic::object(
            "transform",
            folly::dynamic::array(folly::dynamic::object(name, value))));
    EXPECT_EQ(buffer.ints, expectedInts);
    EXPECT_EQ(buffer.doubles, expectedDoubles);
    EXPECT_TRUE(buffer.rawProps.empty());
  }
}

TEST(AnimatedPropBufferEncoderTest, preservesPropertyLookupBoundaryFallbacks) {
  for (const auto& mapping : kPropCommands) {
    for (const auto& name : lookupBoundaryNames(mapping.first)) {
      if (std::any_of(
              kPropCommands.begin(),
              kPropCommands.end(),
              [&](const auto& entry) { return name == entry.first; })) {
        continue;
      }
      SCOPED_TRACE(name);
      folly::dynamic props = folly::dynamic::object("opacity", 0.5)(name, 1);
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

TEST(AnimatedPropBufferEncoderTest, preservesTransformLookupBoundaryFallbacks) {
  for (const auto& mapping : kTransformCommands) {
    for (const auto& name : lookupBoundaryNames(mapping.first)) {
      if (std::any_of(
              kTransformCommands.begin(),
              kTransformCommands.end(),
              [&](const auto& entry) { return name == entry.first; })) {
        continue;
      }
      SCOPED_TRACE(name);
      folly::dynamic props = folly::dynamic::object("opacity", 0.5)(
          "transform",
          folly::dynamic::array(
              folly::dynamic::object("scale", 2),
              folly::dynamic::object(name, 1)));
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
  builder.setShadowOffset(Size{.width = 2, .height = 3});
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
