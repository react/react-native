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
 * Representation of CSS <percentage> data type
 * https://www.w3.org/TR/css-values-4/#percentages
 */
struct CSSPercentage {
  float value{};

  constexpr bool operator==(const CSSPercentage& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSPercentage> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken& token)
      -> std::optional<CSSPercentage> {
    if (token.type() == CSSTokenType::Percentage) {
      return CSSPercentage{token.numericValue()};
    }

    return {};
  }
};

static_assert(CSSDataType<CSSPercentage>);

} // namespace facebook::react
