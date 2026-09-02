/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string_view>

#include <react/utils/fnv1a.h>

namespace facebook::react {

/**
 * Numeric keyword constants usable within CSS math functions.
 * https://www.w3.org/TR/css-values-4/#calc-constants
 */
enum class CSSMathConstant {
  E,
  Pi,
  Infinity,
  NegativeInfinity,
  NaN,
};

constexpr auto parseCSSMathConstant(std::string_view unit) -> std::optional<CSSMathConstant> 
{
  switch (fnv1aLowercase(unit)) {
    case fnv1a("e"):
      return CSSMathConstant::E;
    case fnv1a("pi"):
      return CSSMathConstant::Pi;
    case fnv1a("infinity"):
      return CSSMathConstant::Infinity;
    case fnv1a("-infinity"):
      return CSSMathConstant::NegativeInfinity;
    case fnv1a("nan"):
      return CSSMathConstant::NaN;
    default:
      return std::nullopt;
  }
}

} // namespace facebook::react
