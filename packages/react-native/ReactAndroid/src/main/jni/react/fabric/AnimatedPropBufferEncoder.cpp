/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimatedPropBufferEncoder.h"

#include <folly/Conv.h>
#include <react/renderer/animationbackend/AnimatedPropsSerializer.h>
#include <numbers>
#include <optional>
#include <string_view>
#include <unordered_map>

namespace facebook::react {

namespace {

// A view is START_OF_VIEW, tag, its props, END_OF_VIEW. Props take their values
// from the int and double buffers in order. A view with a prop that has no
// command is RAW_PROPS instead, taking the next map of the raw props buffer.
// Keep in sync with BatchedAnimatedPropsMountItem.kt on the Java side.

constexpr int CMD_START_OF_VIEW = 1;
constexpr int CMD_START_OF_TRANSFORM = 2;
constexpr int CMD_END_OF_TRANSFORM = 3;
constexpr int CMD_END_OF_VIEW = 4;
constexpr int CMD_RAW_PROPS = 5;

constexpr int CMD_OPACITY = 10;
constexpr int CMD_ELEVATION = 11;
constexpr int CMD_Z_INDEX = 12;
constexpr int CMD_SHADOW_OPACITY = 13;
constexpr int CMD_SHADOW_RADIUS = 14;

constexpr int CMD_BACKGROUND_COLOR = 15;
constexpr int CMD_COLOR = 16;
constexpr int CMD_TINT_COLOR = 17;
constexpr int CMD_PLACEHOLDER_TEXT_COLOR = 18;
constexpr int CMD_SHADOW_COLOR = 19;

constexpr int CMD_BORDER_RADIUS = 20;
constexpr int CMD_BORDER_TOP_LEFT_RADIUS = 21;
constexpr int CMD_BORDER_TOP_RIGHT_RADIUS = 22;
constexpr int CMD_BORDER_TOP_START_RADIUS = 23;
constexpr int CMD_BORDER_TOP_END_RADIUS = 24;
constexpr int CMD_BORDER_BOTTOM_LEFT_RADIUS = 25;
constexpr int CMD_BORDER_BOTTOM_RIGHT_RADIUS = 26;
constexpr int CMD_BORDER_BOTTOM_START_RADIUS = 27;
constexpr int CMD_BORDER_BOTTOM_END_RADIUS = 28;
constexpr int CMD_BORDER_START_START_RADIUS = 29;
constexpr int CMD_BORDER_START_END_RADIUS = 30;
constexpr int CMD_BORDER_END_START_RADIUS = 31;
constexpr int CMD_BORDER_END_END_RADIUS = 32;

constexpr int CMD_BORDER_COLOR = 40;
constexpr int CMD_BORDER_TOP_COLOR = 41;
constexpr int CMD_BORDER_BOTTOM_COLOR = 42;
constexpr int CMD_BORDER_LEFT_COLOR = 43;
constexpr int CMD_BORDER_RIGHT_COLOR = 44;
constexpr int CMD_BORDER_START_COLOR = 45;
constexpr int CMD_BORDER_END_COLOR = 46;
constexpr int CMD_BORDER_BLOCK_COLOR = 47;
constexpr int CMD_BORDER_BLOCK_START_COLOR = 48;
constexpr int CMD_BORDER_BLOCK_END_COLOR = 49;

constexpr int CMD_OUTLINE_COLOR = 50;
constexpr int CMD_OUTLINE_OFFSET = 51;
constexpr int CMD_OUTLINE_WIDTH = 52;

constexpr int CMD_TRANSFORM_TRANSLATE_X = 100;
constexpr int CMD_TRANSFORM_TRANSLATE_Y = 101;
constexpr int CMD_TRANSFORM_SCALE = 102;
constexpr int CMD_TRANSFORM_SCALE_X = 103;
constexpr int CMD_TRANSFORM_SCALE_Y = 104;
constexpr int CMD_TRANSFORM_ROTATE = 105;
constexpr int CMD_TRANSFORM_ROTATE_X = 106;
constexpr int CMD_TRANSFORM_ROTATE_Y = 107;
constexpr int CMD_TRANSFORM_ROTATE_Z = 108;
constexpr int CMD_TRANSFORM_SKEW_X = 109;
constexpr int CMD_TRANSFORM_SKEW_Y = 110;
constexpr int CMD_TRANSFORM_MATRIX = 111;
constexpr int CMD_TRANSFORM_PERSPECTIVE = 112;

constexpr int CMD_UNIT_PX = 202;
constexpr int CMD_UNIT_PERCENT = 203;

std::optional<int> propNameToCommand(const std::string& name) {
  static const std::unordered_map<std::string_view, int> kMap = {
      {"opacity", CMD_OPACITY},
      {"elevation", CMD_ELEVATION},
      {"zIndex", CMD_Z_INDEX},
      {"shadowOpacity", CMD_SHADOW_OPACITY},
      {"shadowRadius", CMD_SHADOW_RADIUS},
      {"backgroundColor", CMD_BACKGROUND_COLOR},
      {"color", CMD_COLOR},
      {"tintColor", CMD_TINT_COLOR},
      {"placeholderTextColor", CMD_PLACEHOLDER_TEXT_COLOR},
      {"shadowColor", CMD_SHADOW_COLOR},
      {"borderRadius", CMD_BORDER_RADIUS},
      {"borderTopLeftRadius", CMD_BORDER_TOP_LEFT_RADIUS},
      {"borderTopRightRadius", CMD_BORDER_TOP_RIGHT_RADIUS},
      {"borderTopStartRadius", CMD_BORDER_TOP_START_RADIUS},
      {"borderTopEndRadius", CMD_BORDER_TOP_END_RADIUS},
      {"borderBottomLeftRadius", CMD_BORDER_BOTTOM_LEFT_RADIUS},
      {"borderBottomRightRadius", CMD_BORDER_BOTTOM_RIGHT_RADIUS},
      {"borderBottomStartRadius", CMD_BORDER_BOTTOM_START_RADIUS},
      {"borderBottomEndRadius", CMD_BORDER_BOTTOM_END_RADIUS},
      {"borderStartStartRadius", CMD_BORDER_START_START_RADIUS},
      {"borderStartEndRadius", CMD_BORDER_START_END_RADIUS},
      {"borderEndStartRadius", CMD_BORDER_END_START_RADIUS},
      {"borderEndEndRadius", CMD_BORDER_END_END_RADIUS},
      {"borderColor", CMD_BORDER_COLOR},
      {"borderTopColor", CMD_BORDER_TOP_COLOR},
      {"borderBottomColor", CMD_BORDER_BOTTOM_COLOR},
      {"borderLeftColor", CMD_BORDER_LEFT_COLOR},
      {"borderRightColor", CMD_BORDER_RIGHT_COLOR},
      {"borderStartColor", CMD_BORDER_START_COLOR},
      {"borderEndColor", CMD_BORDER_END_COLOR},
      {"borderBlockColor", CMD_BORDER_BLOCK_COLOR},
      {"borderBlockStartColor", CMD_BORDER_BLOCK_START_COLOR},
      {"borderBlockEndColor", CMD_BORDER_BLOCK_END_COLOR},
      {"outlineColor", CMD_OUTLINE_COLOR},
      {"outlineOffset", CMD_OUTLINE_OFFSET},
      {"outlineWidth", CMD_OUTLINE_WIDTH},
      {"transform", CMD_START_OF_TRANSFORM},
  };
  auto it = kMap.find(name);
  if (it == kMap.end()) {
    return std::nullopt;
  }
  return it->second;
}

std::optional<int> transformNameToCommand(const std::string& name) {
  static const std::unordered_map<std::string_view, int> kMap = {
      {"translateX", CMD_TRANSFORM_TRANSLATE_X},
      {"translateY", CMD_TRANSFORM_TRANSLATE_Y},
      {"scale", CMD_TRANSFORM_SCALE},
      {"scaleX", CMD_TRANSFORM_SCALE_X},
      {"scaleY", CMD_TRANSFORM_SCALE_Y},
      {"rotate", CMD_TRANSFORM_ROTATE},
      {"rotateX", CMD_TRANSFORM_ROTATE_X},
      {"rotateY", CMD_TRANSFORM_ROTATE_Y},
      {"rotateZ", CMD_TRANSFORM_ROTATE_Z},
      {"skewX", CMD_TRANSFORM_SKEW_X},
      {"skewY", CMD_TRANSFORM_SKEW_Y},
      {"matrix", CMD_TRANSFORM_MATRIX},
      {"perspective", CMD_TRANSFORM_PERSPECTIVE},
  };
  auto it = kMap.find(name);
  if (it == kMap.end()) {
    return std::nullopt;
  }
  return it->second;
}

bool packLength(
    const folly::dynamic& value,
    std::vector<int>& intBuffer,
    std::vector<double>& doubleBuffer) {
  if (value.isNumber()) {
    intBuffer.push_back(CMD_UNIT_PX);
    doubleBuffer.push_back(value.asDouble());
    return true;
  }
  if (!value.isString() || !value.getString().ends_with("%")) {
    return false;
  }
  const auto& text = value.getString();
  auto percent = folly::tryTo<double>(text.substr(0, text.size() - 1));
  if (!percent.hasValue()) {
    return false;
  }
  intBuffer.push_back(CMD_UNIT_PERCENT);
  doubleBuffer.push_back(percent.value());
  return true;
}

std::optional<double> toRadians(const folly::dynamic& value) {
  if (value.isNumber()) {
    return value.asDouble();
  }
  if (!value.isString()) {
    return std::nullopt;
  }
  const auto& text = value.getString();
  bool isDegrees = text.ends_with("deg");
  if (!isDegrees && !text.ends_with("rad")) {
    return std::nullopt;
  }
  auto angle = folly::tryTo<double>(text.substr(0, text.size() - 3));
  if (!angle.hasValue()) {
    return std::nullopt;
  }
  return isDegrees ? angle.value() * std::numbers::pi / 180 : angle.value();
}

bool packTransformToBuffers(
    const folly::dynamic& transform,
    std::vector<int>& intBuffer,
    std::vector<double>& doubleBuffer) {
  if (!transform.isArray()) {
    return false;
  }
  intBuffer.push_back(CMD_START_OF_TRANSFORM);
  for (const auto& item : transform) {
    if (!item.isObject() || item.size() != 1) {
      return false;
    }
    const auto& [name, value] = *item.items().begin();
    auto cmd = transformNameToCommand(name.getString());
    if (!cmd.has_value()) {
      return false;
    }
    intBuffer.push_back(cmd.value());
    switch (cmd.value()) {
      case CMD_TRANSFORM_SCALE:
      case CMD_TRANSFORM_SCALE_X:
      case CMD_TRANSFORM_SCALE_Y:
      case CMD_TRANSFORM_PERSPECTIVE:
        if (!value.isNumber()) {
          return false;
        }
        doubleBuffer.push_back(value.asDouble());
        break;
      case CMD_TRANSFORM_TRANSLATE_X:
      case CMD_TRANSFORM_TRANSLATE_Y:
        if (!packLength(value, intBuffer, doubleBuffer)) {
          return false;
        }
        break;
      case CMD_TRANSFORM_ROTATE:
      case CMD_TRANSFORM_ROTATE_X:
      case CMD_TRANSFORM_ROTATE_Y:
      case CMD_TRANSFORM_ROTATE_Z:
      case CMD_TRANSFORM_SKEW_X:
      case CMD_TRANSFORM_SKEW_Y: {
        auto radians = toRadians(value);
        if (!radians.has_value()) {
          return false;
        }
        doubleBuffer.push_back(radians.value());
        break;
      }
      case CMD_TRANSFORM_MATRIX:
        if (!value.isArray() || value.size() != 16) {
          return false;
        }
        for (const auto& element : value) {
          if (!element.isNumber()) {
            return false;
          }
          doubleBuffer.push_back(element.asDouble());
        }
        break;
      default:
        return false;
    }
  }
  intBuffer.push_back(CMD_END_OF_TRANSFORM);
  return true;
}

bool packDynamicEntryToBuffers(
    const std::string& key,
    const folly::dynamic& value,
    std::vector<int>& intBuffer,
    std::vector<double>& doubleBuffer) {
  auto cmd = propNameToCommand(key);
  if (!cmd.has_value()) {
    return false;
  }

  switch (cmd.value()) {
    case CMD_OPACITY:
    case CMD_ELEVATION:
    case CMD_Z_INDEX:
    case CMD_SHADOW_OPACITY:
    case CMD_SHADOW_RADIUS:
    case CMD_OUTLINE_OFFSET:
    case CMD_OUTLINE_WIDTH:
      if (!value.isNumber()) {
        return false;
      }
      intBuffer.push_back(cmd.value());
      doubleBuffer.push_back(value.asDouble());
      return true;

    case CMD_BACKGROUND_COLOR:
    case CMD_COLOR:
    case CMD_TINT_COLOR:
    case CMD_PLACEHOLDER_TEXT_COLOR:
    case CMD_SHADOW_COLOR:
    case CMD_BORDER_COLOR:
    case CMD_BORDER_TOP_COLOR:
    case CMD_BORDER_BOTTOM_COLOR:
    case CMD_BORDER_LEFT_COLOR:
    case CMD_BORDER_RIGHT_COLOR:
    case CMD_BORDER_START_COLOR:
    case CMD_BORDER_END_COLOR:
    case CMD_BORDER_BLOCK_COLOR:
    case CMD_BORDER_BLOCK_START_COLOR:
    case CMD_BORDER_BLOCK_END_COLOR:
    case CMD_OUTLINE_COLOR: {
      if (!value.isNumber()) {
        return false;
      }
      auto color = value.isInt() ? folly::tryTo<int64_t>(value.getInt())
                                 : folly::tryTo<int64_t>(value.getDouble());
      if (!color.hasValue() ||
          color.value() < std::numeric_limits<int32_t>::min() ||
          color.value() > std::numeric_limits<uint32_t>::max()) {
        return false;
      }
      intBuffer.push_back(cmd.value());
      intBuffer.push_back(static_cast<int32_t>(color.value()));
      return true;
    }

    case CMD_BORDER_RADIUS:
    case CMD_BORDER_TOP_LEFT_RADIUS:
    case CMD_BORDER_TOP_RIGHT_RADIUS:
    case CMD_BORDER_TOP_START_RADIUS:
    case CMD_BORDER_TOP_END_RADIUS:
    case CMD_BORDER_BOTTOM_LEFT_RADIUS:
    case CMD_BORDER_BOTTOM_RIGHT_RADIUS:
    case CMD_BORDER_BOTTOM_START_RADIUS:
    case CMD_BORDER_BOTTOM_END_RADIUS:
    case CMD_BORDER_START_START_RADIUS:
    case CMD_BORDER_START_END_RADIUS:
    case CMD_BORDER_END_START_RADIUS:
    case CMD_BORDER_END_END_RADIUS:
      intBuffer.push_back(cmd.value());
      return packLength(value, intBuffer, doubleBuffer);

    case CMD_START_OF_TRANSFORM:
      return packTransformToBuffers(value, intBuffer, doubleBuffer);

    default:
      return false;
  }
}

bool packAnimatedPropsToBuffers(
    const AnimatedProps& animatedProps,
    std::vector<int>& intBuffer,
    std::vector<double>& doubleBuffer) {
  if (!animatedProps.props.empty()) {
    return false;
  }
  if (animatedProps.rawProps) {
    std::optional<folly::dynamic> converted;
    const auto* rawProps = animatedProps.rawProps->getDynamic();
    if (rawProps == nullptr) {
      rawProps = &converted.emplace(animatedProps.rawProps->toDynamic());
    }
    for (const auto& [key, value] : rawProps->items()) {
      if (!packDynamicEntryToBuffers(
              key.getString(), value, intBuffer, doubleBuffer)) {
        return false;
      }
    }
  }
  return true;
}

} // namespace

AnimatedPropsBuffer encodeAnimatedProps(
    const std::unordered_map<Tag, AnimatedProps>& updates) {
  AnimatedPropsBuffer buffer;
  buffer.ints.reserve(updates.size() * 4);
  buffer.doubles.reserve(updates.size());
  for (const auto& [tag, animatedProps] : updates) {
    buffer.ints.push_back(CMD_START_OF_VIEW);
    buffer.ints.push_back(tag);
    auto intSize = buffer.ints.size();
    auto doubleSize = buffer.doubles.size();
    if (!packAnimatedPropsToBuffers(
            animatedProps, buffer.ints, buffer.doubles)) {
      buffer.ints.resize(intSize);
      buffer.doubles.resize(doubleSize);
      buffer.ints.push_back(CMD_RAW_PROPS);
      buffer.rawProps.push_back(
          animationbackend::packAnimatedProps(animatedProps));
    }
    buffer.ints.push_back(CMD_END_OF_VIEW);
  }
  return buffer;
}

} // namespace facebook::react
