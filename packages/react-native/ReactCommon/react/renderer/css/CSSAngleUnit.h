/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include <cstdint>
#include <optional>
#include <string_view>

#include <react/utils/fnv1a.h>

namespace facebook::react {

/**
 * Unit for the CSS <angle> type.
 * https://www.w3.org/TR/css-values-4/#angles
 */
enum class CSSAngleUnit : uint8_t {
  Deg,
  Grad,
  Rad,
  Turn,
};

/**
 * Parses a unit from a dimension token into a CSS angle unit.
 */
constexpr std::optional<CSSAngleUnit> parseCSSAngleUnit(std::string_view unit) {
  switch (fnv1aLowercase(unit)) {
    case fnv1a("deg"):
      return CSSAngleUnit::Deg;
    case fnv1a("grad"):
      return CSSAngleUnit::Grad;
    case fnv1a("rad"):
      return CSSAngleUnit::Rad;
    case fnv1a("turn"):
      return CSSAngleUnit::Turn;
    default:
      return std::nullopt;
  }
}

/**
 * Converts a specified CSS angle to its cannonical unit (degrees)
 */
constexpr float canonicalize(float value, CSSAngleUnit unit) {
  switch (unit) {
    case CSSAngleUnit::Deg:
      return value;
    case CSSAngleUnit::Grad:
      return value * 0.9f;
    case CSSAngleUnit::Rad:
      return value * 57.295779513f;
    case CSSAngleUnit::Turn:
      return value * 360.0f;
    default:
      return std::numeric_limits<float>::quiet_NaN();
  }
}

} // namespace facebook::react
