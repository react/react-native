/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <variant>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

/**
 * Representation of CSS <ratio> data type
 * https://www.w3.org/TR/css-values-4/#ratios
 */
struct CSSRatio {
  float numerator{};
  float denominator{};

  constexpr bool operator==(const CSSRatio &rhs) const = default;

  constexpr bool isDegenerate() const
  {
    // If either number in the <ratio> is 0 or infinite, it represents a
    // degenerate ratio (and, generally, won’t do anything).
    // https://www.w3.org/TR/css-values-4/#ratios
    return numerator == 0.0f || numerator == std::numeric_limits<float>::infinity() || denominator == 0.0f ||
        denominator == std::numeric_limits<float>::infinity();
  }
};

template <>
struct CSSDataTypeParser<CSSRatio> {
  static constexpr auto consume(CSSValueParser &parser) -> std::optional<CSSRatio>
  {
    // <ratio> = <number [0,∞]> [ / <number [0,∞]> ]?
    // https://www.w3.org/TR/css-values-4/#ratio
    auto numerator = parser.parseNextValue<CSSNumber>();
    if (!std::holds_alternative<CSSNumber>(numerator)) {
      return {};
    }

    auto numeratorValue = std::get<CSSNumber>(numerator).value;
    if (numeratorValue >= 0) {
      auto denominator = parser.peekNextValue<CSSNumber>(CSSDelimiter::Solidus);
      if (std::holds_alternative<CSSNumber>(denominator) && std::get<CSSNumber>(denominator).value >= 0) {
        parser.parseNextValue<CSSNumber>(CSSDelimiter::Solidus);
        return CSSRatio{.numerator = numeratorValue, .denominator = std::get<CSSNumber>(denominator).value};
      }

      return CSSRatio{.numerator = numeratorValue, .denominator = 1.0f};
    }

    return {};
  }
};

static_assert(CSSDataType<CSSRatio>);

} // namespace facebook::react
