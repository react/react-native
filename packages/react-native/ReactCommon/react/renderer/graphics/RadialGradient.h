/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/ColorStop.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <optional>

#if RN_DEBUG_STRING_CONVERTIBLE
#include <sstream>
#endif

#include <variant>
#include <vector>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

enum class RadialGradientShape { Circle, Ellipse };

struct RadialGradientSize {
  enum class SizeKeyword { ClosestSide, FarthestSide, ClosestCorner, FarthestCorner };

  struct Dimensions {
    ValueUnit x;
    ValueUnit y;

    bool operator==(const Dimensions &other) const = default;

#ifdef RN_SERIALIZABLE_STATE
    folly::dynamic toDynamic() const;
#endif
  };

  std::variant<SizeKeyword, Dimensions> value;

  bool operator==(const RadialGradientSize &other) const = default;

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif
};

struct RadialGradientPosition {
  std::optional<ValueUnit> top;
  std::optional<ValueUnit> left;
  std::optional<ValueUnit> right;
  std::optional<ValueUnit> bottom;

  bool operator==(const RadialGradientPosition &other) const = default;

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif
};

struct RadialGradient {
  RadialGradientShape shape;
  RadialGradientSize size;
  RadialGradientPosition position;
  std::vector<ColorStop> colorStops;

  bool operator==(const RadialGradient &other) const = default;

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
  void toString(std::stringstream &ss) const;
#endif
};
}; // namespace facebook::react
