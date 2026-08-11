/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSDataType.h>

namespace facebook::react {

/**
 * Representation of CSS <number> data type
 * https://www.w3.org/TR/css-values-4/#numbers
 */
struct CSSNumber {
  float value{};

  constexpr bool operator==(const CSSNumber& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSNumber> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken& token)
      -> std::optional<CSSNumber> {
    if (token.type() == CSSTokenType::Number) {
      return CSSNumber{token.numericValue()};
    }

    return {};
  }
};

static_assert(CSSDataType<CSSNumber>);

} // namespace facebook::react
