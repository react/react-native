/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLengthUnit.h>

namespace facebook::react {

/**
 * Representation of CSS <length> data type
 * https://www.w3.org/TR/css-values-4/#lengths
 */
struct CSSLength {
  float value{};
  CSSLengthUnit unit{CSSLengthUnit::Px};

  constexpr bool operator==(const CSSLength& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSLength> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken& token)
      -> std::optional<CSSLength> {
    switch (token.type()) {
      case CSSTokenType::Dimension:
        if (auto unit = parseCSSLengthUnit(token.unit())) {
          return CSSLength{.value = token.numericValue(), .unit = *unit};
        }
        break;
      case CSSTokenType::Number:
        // For zero lengths the unit identifier is optional (i.e. can be
        // syntactically represented as the <number> 0). However, if a 0
        // could be parsed as either a <number> or a <length> in a
        // property (such as line-height), it must parse as a <number>.
        // https://www.w3.org/TR/css-values-4/#lengths
        if (token.numericValue() == 0) {
          return CSSLength{
              .value = token.numericValue(), .unit = CSSLengthUnit::Px};
        }
        break;
      default:
        break;
    }

    return {};
  }
};

static_assert(CSSDataType<CSSLength>);

} // namespace facebook::react
