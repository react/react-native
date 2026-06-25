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

#if RN_DEBUG_STRING_CONVERTIBLE
#include <sstream>
#endif

#include <variant>
#include <vector>

namespace facebook::react {

enum class [[deprecated("Use std::holds_alternative")]] GradientDirectionType {
  Angle,
  Keyword,
};

enum class GradientKeyword : uint8_t {
  ToTopRight,
  ToBottomRight,
  ToTopLeft,
  ToBottomLeft,
};

using GradientDirection = std::variant<Float, GradientKeyword>;

struct LinearGradient {
  GradientDirection direction;
  std::vector<ColorStop> colorStops;

  bool operator==(const LinearGradient &other) const = default;

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
  void toString(std::stringstream &ss) const;
#endif
};

}; // namespace facebook::react
