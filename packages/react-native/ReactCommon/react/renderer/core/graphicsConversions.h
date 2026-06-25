/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <unordered_map>

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/PlatformColorParser.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/RectangleCorners.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <react/renderer/graphics/Size.h>

#ifdef RN_SERIALIZABLE_STATE
#include <yoga/Yoga.h>
#endif

namespace facebook::react {

#pragma mark - Color

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, SharedColor &result)
{
  fromRawValue(context.contextContainer, context.surfaceId, value, result);
}

#ifdef ANDROID
inline int toAndroidRepr(const SharedColor &color)
{
  return *color;
}
#endif

inline std::string toString(const SharedColor &value)
{
  return value.toString();
}

#pragma mark - Geometry

#ifdef RN_SERIALIZABLE_STATE
inline folly::dynamic toDynamic(const YGValue &dimension)
{
  switch (dimension.unit) {
    case YGUnitUndefined:
      return "undefined";
    case YGUnitAuto:
      return "auto";
    case YGUnitMaxContent:
      return "max-content";
    case YGUnitFitContent:
      return "fit-content";
    case YGUnitStretch:
      return "stretch";
    case YGUnitPoint:
      return dimension.value;
    case YGUnitPercent:
      return std::format("{}%", dimension.value);
  }

  return nullptr;
}

inline folly::dynamic toDynamic(const Point &point)
{
  folly::dynamic pointResult = folly::dynamic::object();
  pointResult["x"] = point.x;
  pointResult["y"] = point.y;
  return pointResult;
}
#endif

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, Point &result)
{
  if (value.hasType<std::unordered_map<std::string, Float>>()) {
    auto map = (std::unordered_map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "x") {
        result.x = pair.second;
      } else if (pair.first == "y") {
        result.y = pair.second;
      }
    }
    return;
  }

  react_native_expect(value.hasType<std::vector<Float>>());
  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    react_native_expect(array.size() == 2);
    if (array.size() >= 2) {
      result = {.x = array.at(0), .y = array.at(1)};
    } else {
      result = {.x = 0, .y = 0};
      LOG(ERROR) << "Unsupported Point vector size: " << array.size();
    }
  } else {
    LOG(ERROR) << "Unsupported Point type";
  }
}

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, Size &result)
{
  if (value.hasType<std::unordered_map<std::string, Float>>()) {
    auto map = (std::unordered_map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "width") {
        result.width = pair.second;
      } else if (pair.first == "height") {
        result.height = pair.second;
      } else {
        LOG(ERROR) << "Unsupported Size map key: " << pair.first;
        react_native_expect(false);
      }
    }
    return;
  }

  react_native_expect(value.hasType<std::vector<Float>>());
  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    react_native_expect(array.size() == 2);
    if (array.size() >= 2) {
      result = {.width = array.at(0), .height = array.at(1)};
    } else {
      result = {.width = 0, .height = 0};
      LOG(ERROR) << "Unsupported Size vector size: " << array.size();
    }
  } else {
    LOG(ERROR) << "Unsupported Size type";
  }
}

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, EdgeInsets &result)
{
  if (value.hasType<Float>()) {
    auto number = (Float)value;
    result = {.left = number, .top = number, .right = number, .bottom = number};
    return;
  }

  if (value.hasType<std::unordered_map<std::string, Float>>()) {
    auto map = (std::unordered_map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "top") {
        result.top = pair.second;
      } else if (pair.first == "left") {
        result.left = pair.second;
      } else if (pair.first == "bottom") {
        result.bottom = pair.second;
      } else if (pair.first == "right") {
        result.right = pair.second;
      } else {
        LOG(ERROR) << "Unsupported EdgeInsets map key: " << pair.first;
        react_native_expect(false);
      }
    }
    return;
  }

  react_native_expect(value.hasType<std::vector<Float>>());
  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    react_native_expect(array.size() == 4);
    if (array.size() >= 4) {
      result = {.left = array.at(0), .top = array.at(1), .right = array.at(2), .bottom = array.at(3)};
    } else {
      result = {.left = 0, .top = 0, .right = 0, .bottom = 0};
      LOG(ERROR) << "Unsupported EdgeInsets vector size: " << array.size();
    }
  } else {
    LOG(ERROR) << "Unsupported EdgeInsets type";
  }
}

#ifdef RN_SERIALIZABLE_STATE
inline folly::dynamic toDynamic(const EdgeInsets &edgeInsets)
{
  folly::dynamic edgeInsetsResult = folly::dynamic::object();
  edgeInsetsResult["left"] = edgeInsets.left;
  edgeInsetsResult["top"] = edgeInsets.top;
  edgeInsetsResult["right"] = edgeInsets.right;
  edgeInsetsResult["bottom"] = edgeInsets.bottom;
  return edgeInsetsResult;
}
#endif

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, CornerInsets &result)
{
  if (value.hasType<Float>()) {
    auto number = (Float)value;
    result = {.topLeft = number, .topRight = number, .bottomLeft = number, .bottomRight = number};
    return;
  }

  if (value.hasType<std::unordered_map<std::string, Float>>()) {
    auto map = (std::unordered_map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "topLeft") {
        result.topLeft = pair.second;
      } else if (pair.first == "topRight") {
        result.topRight = pair.second;
      } else if (pair.first == "bottomLeft") {
        result.bottomLeft = pair.second;
      } else if (pair.first == "bottomRight") {
        result.bottomRight = pair.second;
      } else {
        LOG(ERROR) << "Unsupported CornerInsets map key: " << pair.first;
        react_native_expect(false);
      }
    }
    return;
  }

  react_native_expect(value.hasType<std::vector<Float>>());
  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    react_native_expect(array.size() == 4);
    if (array.size() >= 4) {
      result = {.topLeft = array.at(0), .topRight = array.at(1), .bottomLeft = array.at(2), .bottomRight = array.at(3)};
    } else {
      LOG(ERROR) << "Unsupported CornerInsets vector size: " << array.size();
    }
  }

  // Error case - we should only here if all other supported cases fail
  // In dev we would crash on assert before this point
  result = {.topLeft = 0, .topRight = 0, .bottomLeft = 0, .bottomRight = 0};
  LOG(ERROR) << "Unsupported CornerInsets type";
}

#if RN_DEBUG_STRING_CONVERTIBLE

inline std::string toString(const Point &point)
{
  return "{" + toString(point.x) + ", " + toString(point.y) + "}";
}

inline std::string toString(const Size &size)
{
  return "{" + toString(size.width) + ", " + toString(size.height) + "}";
}

inline std::string toString(const Rect &rect)
{
  return "{" + toString(rect.origin) + ", " + toString(rect.size) + "}";
}

inline std::string toString(const EdgeInsets &edgeInsets)
{
  return "{" + toString(edgeInsets.left) + ", " + toString(edgeInsets.top) + ", " + toString(edgeInsets.right) + ", " +
      toString(edgeInsets.bottom) + "}";
}

inline std::string toString(const CornerInsets &cornerInsets)
{
  return "{" + toString(cornerInsets.topLeft) + ", " + toString(cornerInsets.topRight) + ", " +
      toString(cornerInsets.bottomLeft) + ", " + toString(cornerInsets.bottomRight) + "}";
}

#endif

} // namespace facebook::react
