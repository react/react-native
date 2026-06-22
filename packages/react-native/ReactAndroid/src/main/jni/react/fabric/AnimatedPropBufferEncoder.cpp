/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimatedPropBufferEncoder.h"
#include "AnimatedPropCommands.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/graphics/Transform.h>
#include <react/renderer/graphics/TransformUtils.h>
#include <optional>
#include <string_view>
#include <unordered_map>

namespace facebook::react {

namespace {

// Maps a rawProps key (as it appears in folly::dynamic) to its buffer-protocol
// command constant. Returns std::nullopt for keys that are not buffer-eligible.
// NOTE: Keep in sync with BatchedAnimatedPropsMountItem.commandToString on the
// Java side.
std::optional<int> propNameToCommand(const std::string& name) {
  static const std::unordered_map<std::string_view, int> kMap = {
      {"opacity", animationbackend::CMD_OPACITY},
      {"elevation", animationbackend::CMD_ELEVATION},
      {"zIndex", animationbackend::CMD_Z_INDEX},
      {"shadowOpacity", animationbackend::CMD_SHADOW_OPACITY},
      {"shadowRadius", animationbackend::CMD_SHADOW_RADIUS},
      {"backgroundColor", animationbackend::CMD_BACKGROUND_COLOR},
      {"color", animationbackend::CMD_COLOR},
      {"tintColor", animationbackend::CMD_TINT_COLOR},
      {"borderRadius", animationbackend::CMD_BORDER_RADIUS},
      {"borderTopLeftRadius", animationbackend::CMD_BORDER_TOP_LEFT_RADIUS},
      {"borderTopRightRadius", animationbackend::CMD_BORDER_TOP_RIGHT_RADIUS},
      {"borderTopStartRadius", animationbackend::CMD_BORDER_TOP_START_RADIUS},
      {"borderTopEndRadius", animationbackend::CMD_BORDER_TOP_END_RADIUS},
      {"borderBottomLeftRadius",
       animationbackend::CMD_BORDER_BOTTOM_LEFT_RADIUS},
      {"borderBottomRightRadius",
       animationbackend::CMD_BORDER_BOTTOM_RIGHT_RADIUS},
      {"borderBottomStartRadius",
       animationbackend::CMD_BORDER_BOTTOM_START_RADIUS},
      {"borderBottomEndRadius", animationbackend::CMD_BORDER_BOTTOM_END_RADIUS},
      {"borderStartStartRadius",
       animationbackend::CMD_BORDER_START_START_RADIUS},
      {"borderStartEndRadius", animationbackend::CMD_BORDER_START_END_RADIUS},
      {"borderEndStartRadius", animationbackend::CMD_BORDER_END_START_RADIUS},
      {"borderEndEndRadius", animationbackend::CMD_BORDER_END_END_RADIUS},
      {"borderColor", animationbackend::CMD_BORDER_COLOR},
      {"borderTopColor", animationbackend::CMD_BORDER_TOP_COLOR},
      {"borderBottomColor", animationbackend::CMD_BORDER_BOTTOM_COLOR},
      {"borderLeftColor", animationbackend::CMD_BORDER_LEFT_COLOR},
      {"borderRightColor", animationbackend::CMD_BORDER_RIGHT_COLOR},
      {"borderStartColor", animationbackend::CMD_BORDER_START_COLOR},
      {"borderEndColor", animationbackend::CMD_BORDER_END_COLOR},
      // "transform" is dispatched as the START_OF_TRANSFORM marker; the
      // packDynamicEntryToBuffers switch handles the nested operations.
      {"transform", animationbackend::CMD_START_OF_TRANSFORM},
  };
  auto it = kMap.find(name);
  if (it == kMap.end()) {
    return std::nullopt;
  }
  return it->second;
}

// Maps a transform operation name (e.g. "translateX", "rotate") to its
// transform command constant. Returns std::nullopt for unknown operations.
std::optional<int> transformNameToCommand(const std::string& name) {
  static const std::unordered_map<std::string_view, int> kMap = {
      {"translateX", animationbackend::CMD_TRANSFORM_TRANSLATE_X},
      {"translateY", animationbackend::CMD_TRANSFORM_TRANSLATE_Y},
      {"scale", animationbackend::CMD_TRANSFORM_SCALE},
      {"scaleX", animationbackend::CMD_TRANSFORM_SCALE_X},
      {"scaleY", animationbackend::CMD_TRANSFORM_SCALE_Y},
      {"rotate", animationbackend::CMD_TRANSFORM_ROTATE},
      {"rotateX", animationbackend::CMD_TRANSFORM_ROTATE_X},
      {"rotateY", animationbackend::CMD_TRANSFORM_ROTATE_Y},
      {"rotateZ", animationbackend::CMD_TRANSFORM_ROTATE_Z},
      {"skewX", animationbackend::CMD_TRANSFORM_SKEW_X},
      {"skewY", animationbackend::CMD_TRANSFORM_SKEW_Y},
      {"matrix", animationbackend::CMD_TRANSFORM_MATRIX},
      {"perspective", animationbackend::CMD_TRANSFORM_PERSPECTIVE},
  };
  auto it = kMap.find(name);
  if (it == kMap.end()) {
    return std::nullopt;
  }
  return it->second;
}

} // namespace

namespace animationbackend {

// Packs a single TransformOperation directly into the buffer protocol.
// Mirrors the (TransformOperation -> serialized name -> buffer command)
// path used by updateTransformProps + the dynamic-based packer, but reads
// the typed values straight from the operation.
static void packTransformOperationToBuffers(
    const Transform& transform,
    const TransformOperation& op,
    std::vector<int>& intBuffer,
    std::vector<double>& doubleBuffer) {
  auto pushUnit = [&](int cmd, const ValueUnit& vu) {
    intBuffer.push_back(cmd);
    intBuffer.push_back(
        vu.unit == UnitType::Percent ? CMD_UNIT_PERCENT : CMD_UNIT_PX);
    doubleBuffer.push_back(vu.value);
  };
  // updateTransformProps preserves rotation values as floats (radians);
  // ValueUnit carries no Deg/Rad distinction, so always emit RAD.
  auto pushAngle = [&](int cmd, const ValueUnit& vu) {
    intBuffer.push_back(cmd);
    intBuffer.push_back(CMD_UNIT_RAD);
    doubleBuffer.push_back(vu.value);
  };

  switch (op.type) {
    case TransformOperationType::Scale:
      if (op.x == op.y && op.x == op.z) {
        intBuffer.push_back(CMD_TRANSFORM_SCALE);
        doubleBuffer.push_back(op.x.value);
      } else {
        if (op.x.value != 1.0f) {
          intBuffer.push_back(CMD_TRANSFORM_SCALE_X);
          doubleBuffer.push_back(op.x.value);
        }
        if (op.y.value != 1.0f) {
          intBuffer.push_back(CMD_TRANSFORM_SCALE_Y);
          doubleBuffer.push_back(op.y.value);
        }
        // No CMD_TRANSFORM_SCALE_Z in the protocol.
      }
      return;
    case TransformOperationType::Translate:
      if (op.x.value != 0) {
        pushUnit(CMD_TRANSFORM_TRANSLATE_X, op.x);
      }
      if (op.y.value != 0) {
        pushUnit(CMD_TRANSFORM_TRANSLATE_Y, op.y);
      }
      // No CMD_TRANSFORM_TRANSLATE_Z in the protocol.
      return;
    case TransformOperationType::Rotate:
      if (op.x.value != 0) {
        pushAngle(CMD_TRANSFORM_ROTATE_X, op.x);
      }
      if (op.y.value != 0) {
        pushAngle(CMD_TRANSFORM_ROTATE_Y, op.y);
      }
      if (op.z.value != 0) {
        pushAngle(CMD_TRANSFORM_ROTATE_Z, op.z);
      }
      return;
    case TransformOperationType::Skew:
      if (op.x.value != 0) {
        pushAngle(CMD_TRANSFORM_SKEW_X, op.x);
      }
      if (op.y.value != 0) {
        pushAngle(CMD_TRANSFORM_SKEW_Y, op.y);
      }
      return;
    case TransformOperationType::Perspective:
      // updateTransformProps emits "perspectiveX/Y/Z" via
      // serializeTransformAxis which has no entries in transformNameToCommand,
      // so the dynamic path is a no-op. Match that behavior here.
      return;
    case TransformOperationType::Arbitrary:
      intBuffer.push_back(CMD_TRANSFORM_MATRIX);
      intBuffer.push_back(static_cast<int>(transform.matrix.size()));
      for (const auto& elem : transform.matrix) {
        doubleBuffer.push_back(elem);
      }
      return;
    case TransformOperationType::Identity:
      return;
  }
}

// Packs a single AnimatedPropBase straight into the buffer protocol,
// without going through folly::dynamic. Asserts the propName is one of
// the buffer-eligible props supported by this path; the caller of
// synchronouslyUpdatePropsBuffered is contractually required to only
// supply such props.
static void packAnimatedPropToBuffers(
    const AnimatedPropBase& animatedProp,
    std::vector<int>& intBuffer,
    std::vector<double>& doubleBuffer) {
  switch (animatedProp.propName) {
    case OPACITY:
      intBuffer.push_back(CMD_OPACITY);
      doubleBuffer.push_back(get<Float>(animatedProp));
      return;
    case BACKGROUND_COLOR:
      intBuffer.push_back(CMD_BACKGROUND_COLOR);
      intBuffer.push_back(
          static_cast<int32_t>(*get<SharedColor>(animatedProp)));
      return;
    case SHADOW_OPACITY:
      intBuffer.push_back(CMD_SHADOW_OPACITY);
      doubleBuffer.push_back(get<Float>(animatedProp));
      return;
    case SHADOW_RADIUS:
      intBuffer.push_back(CMD_SHADOW_RADIUS);
      doubleBuffer.push_back(get<Float>(animatedProp));
      return;
    case BORDER_RADII: {
      const auto borderRadii = get<CascadedBorderRadii>(animatedProp);
      auto pushCorner = [&](int cmd, const std::optional<ValueUnit>& corner) {
        if (corner.has_value()) {
          intBuffer.push_back(cmd);
          intBuffer.push_back(CMD_UNIT_PX);
          doubleBuffer.push_back(corner.value().value);
        }
      };
      pushCorner(CMD_BORDER_TOP_LEFT_RADIUS, borderRadii.topLeft);
      pushCorner(CMD_BORDER_TOP_RIGHT_RADIUS, borderRadii.topRight);
      pushCorner(CMD_BORDER_BOTTOM_LEFT_RADIUS, borderRadii.bottomLeft);
      pushCorner(CMD_BORDER_BOTTOM_RIGHT_RADIUS, borderRadii.bottomRight);
      pushCorner(CMD_BORDER_TOP_START_RADIUS, borderRadii.topStart);
      pushCorner(CMD_BORDER_TOP_END_RADIUS, borderRadii.topEnd);
      pushCorner(CMD_BORDER_BOTTOM_START_RADIUS, borderRadii.bottomStart);
      pushCorner(CMD_BORDER_BOTTOM_END_RADIUS, borderRadii.bottomEnd);
      pushCorner(CMD_BORDER_START_START_RADIUS, borderRadii.startStart);
      pushCorner(CMD_BORDER_START_END_RADIUS, borderRadii.startEnd);
      pushCorner(CMD_BORDER_END_START_RADIUS, borderRadii.endStart);
      pushCorner(CMD_BORDER_END_END_RADIUS, borderRadii.endEnd);
      pushCorner(CMD_BORDER_RADIUS, borderRadii.all);
      return;
    }
    case BORDER_COLOR: {
      const auto borderColors = get<CascadedBorderColors>(animatedProp);
      auto pushEdge = [&](int cmd, const std::optional<SharedColor>& color) {
        if (color.has_value() && color.value()) {
          intBuffer.push_back(cmd);
          intBuffer.push_back(static_cast<int32_t>(*color.value()));
        }
      };
      pushEdge(CMD_BORDER_LEFT_COLOR, borderColors.left);
      pushEdge(CMD_BORDER_TOP_COLOR, borderColors.top);
      pushEdge(CMD_BORDER_RIGHT_COLOR, borderColors.right);
      pushEdge(CMD_BORDER_BOTTOM_COLOR, borderColors.bottom);
      pushEdge(CMD_BORDER_START_COLOR, borderColors.start);
      pushEdge(CMD_BORDER_END_COLOR, borderColors.end);
      pushEdge(CMD_BORDER_COLOR, borderColors.all);
      return;
    }
    case TRANSFORM: {
      const auto transform = get<Transform>(animatedProp);
      intBuffer.push_back(CMD_START_OF_TRANSFORM);
      for (const auto& op : transform.operations) {
        packTransformOperationToBuffers(transform, op, intBuffer, doubleBuffer);
      }
      intBuffer.push_back(CMD_END_OF_TRANSFORM);
      return;
    }
    default:
      // Contract: synchronouslyUpdatePropsBuffered must only be invoked
      // with props that can flow through the buffer protocol.
      react_native_assert(false);
      return;
  }
}

// Packs a single rawProps (key, value) entry into the buffer protocol.
// rawProps still has to flow through folly::dynamic because RawProps
// exposes no public iteration API.
static void packDynamicEntryToBuffers(
    const std::string& key,
    const folly::dynamic& value,
    std::vector<int>& intBuffer,
    std::vector<double>& doubleBuffer) {
  auto cmd = propNameToCommand(key);
  react_native_assert(cmd.has_value());

  switch (cmd.value()) {
    case CMD_OPACITY:
    case CMD_ELEVATION:
    case CMD_Z_INDEX:
    case CMD_SHADOW_OPACITY:
    case CMD_SHADOW_RADIUS:
      intBuffer.push_back(cmd.value());
      doubleBuffer.push_back(value.asDouble());
      break;

    case CMD_BACKGROUND_COLOR:
    case CMD_COLOR:
    case CMD_TINT_COLOR:
    case CMD_BORDER_COLOR:
    case CMD_BORDER_TOP_COLOR:
    case CMD_BORDER_BOTTOM_COLOR:
    case CMD_BORDER_LEFT_COLOR:
    case CMD_BORDER_RIGHT_COLOR:
    case CMD_BORDER_START_COLOR:
    case CMD_BORDER_END_COLOR:
      intBuffer.push_back(cmd.value());
      intBuffer.push_back(value.asInt());
      break;

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
      if (value.isDouble()) {
        intBuffer.push_back(CMD_UNIT_PX);
        doubleBuffer.push_back(value.getDouble());
      } else if (value.isString()) {
        intBuffer.push_back(CMD_UNIT_PERCENT);
        auto str = value.getString();
        doubleBuffer.push_back(std::stof(str.substr(0, str.size() - 1)));
      }
      break;

    case CMD_START_OF_TRANSFORM:
      intBuffer.push_back(CMD_START_OF_TRANSFORM);
      if (value.isArray()) {
        for (const auto& item : value) {
          if (!item.isObject() || item.size() != 1) {
            continue;
          }
          auto transformName = item.keys().begin()->getString();
          auto transformCmd = transformNameToCommand(transformName);
          if (!transformCmd.has_value()) {
            continue;
          }
          const auto& transformValue = *item.values().begin();

          switch (transformCmd.value()) {
            case CMD_TRANSFORM_SCALE:
            case CMD_TRANSFORM_SCALE_X:
            case CMD_TRANSFORM_SCALE_Y:
            case CMD_TRANSFORM_PERSPECTIVE:
              intBuffer.push_back(transformCmd.value());
              doubleBuffer.push_back(transformValue.asDouble());
              break;
            case CMD_TRANSFORM_TRANSLATE_X:
            case CMD_TRANSFORM_TRANSLATE_Y:
              intBuffer.push_back(transformCmd.value());
              if (transformValue.isDouble()) {
                intBuffer.push_back(CMD_UNIT_PX);
                doubleBuffer.push_back(transformValue.getDouble());
              } else if (transformValue.isString()) {
                auto str = transformValue.getString();
                intBuffer.push_back(CMD_UNIT_PERCENT);
                doubleBuffer.push_back(
                    std::stof(str.substr(0, str.size() - 1)));
              }
              break;
            case CMD_TRANSFORM_ROTATE:
            case CMD_TRANSFORM_ROTATE_X:
            case CMD_TRANSFORM_ROTATE_Y:
            case CMD_TRANSFORM_ROTATE_Z:
            case CMD_TRANSFORM_SKEW_X:
            case CMD_TRANSFORM_SKEW_Y: {
              intBuffer.push_back(transformCmd.value());
              if (transformValue.isDouble()) {
                intBuffer.push_back(CMD_UNIT_RAD);
                doubleBuffer.push_back(transformValue.getDouble());
              } else {
                auto str = transformValue.getString();
                if (str.size() > 3 && str.substr(str.size() - 3) == "deg") {
                  intBuffer.push_back(CMD_UNIT_DEG);
                } else {
                  intBuffer.push_back(CMD_UNIT_RAD);
                }
                doubleBuffer.push_back(
                    std::stof(str.substr(0, str.size() - 3)));
              }
              break;
            }
            case CMD_TRANSFORM_MATRIX:
              intBuffer.push_back(transformCmd.value());
              if (transformValue.isArray()) {
                intBuffer.push_back(static_cast<int>(transformValue.size()));
                for (const auto& elem : transformValue) {
                  doubleBuffer.push_back(elem.asDouble());
                }
              }
              break;
          }
        }
      }
      intBuffer.push_back(CMD_END_OF_TRANSFORM);
      break;
  }
}

void packDynamicPropsToBuffers(
    Tag tag,
    const AnimatedProps& animatedProps,
    std::vector<int>& intBuffer,
    std::vector<double>& doubleBuffer) {
  intBuffer.push_back(CMD_START_OF_VIEW);
  intBuffer.push_back(tag);

  for (auto& animatedProp : animatedProps.props) {
    packAnimatedPropToBuffers(*animatedProp, intBuffer, doubleBuffer);
  }

  if (animatedProps.rawProps) {
    auto rawDyn = animatedProps.rawProps->toDynamic();
    for (auto& [key, value] : rawDyn.items()) {
      packDynamicEntryToBuffers(
          key.getString(), value, intBuffer, doubleBuffer);
    }
  }

  intBuffer.push_back(CMD_END_OF_VIEW);
}

} // namespace animationbackend

} // namespace facebook::react
