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
 * The value <zero> represents a literal number with the value 0. Expressions
 * that merely evaluate to a <number> with the value 0 (for example, calc(0)) do
 * not match <zero>; only literal <number-token>s do.
 *
 * https://www.w3.org/TR/css-values-4/#zero-value
 */
struct CSSZero {
  constexpr bool operator==(const CSSZero& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSZero> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken& token)
      -> std::optional<CSSZero> {
    if (token.type() == CSSTokenType::Number && token.numericValue() == 0) {
      return CSSZero{};
    }

    return {};
  }
};

static_assert(CSSDataType<CSSZero>);

} // namespace facebook::react
