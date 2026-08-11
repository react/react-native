/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSAngleUnit.h>
#include <react/renderer/css/CSSDataType.h>

namespace facebook::react {

/**
 * Representation of CSS <angle> data type
 * https://www.w3.org/TR/css-values-4/#angles
 */
struct CSSAngle {
  float degrees{};

  constexpr bool operator==(const CSSAngle& rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSAngle> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken& token)
      -> std::optional<CSSAngle> {
    if (token.type() == CSSTokenType::Dimension) {
      if (auto unit = parseCSSAngleUnit(token.unit())) {
        return CSSAngle{canonicalize(token.numericValue(), *unit)};
      }
    }
    return {};
  }
};

static_assert(CSSDataType<CSSAngle>);

} // namespace facebook::react
