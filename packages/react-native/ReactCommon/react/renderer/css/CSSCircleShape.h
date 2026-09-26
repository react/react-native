/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/iequals.h>

namespace facebook::react {

struct CSSCircleShape {
  std::optional<std::variant<CSSLength, CSSPercentage>> radius;
  std::optional<std::variant<CSSLength, CSSPercentage>> cx;
  std::optional<std::variant<CSSLength, CSSPercentage>> cy;

  bool operator==(const CSSCircleShape &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSCircleShape> {
  static auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSCircleShape>
  {
    if (!iequals(func.name, "circle")) {
      return {};
    }

    CSSCircleShape shape;

    auto radius = parser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<CSSLength>(radius)) {
      shape.radius = std::get<CSSLength>(radius);
    } else if (std::holds_alternative<CSSPercentage>(radius)) {
      shape.radius = std::get<CSSPercentage>(radius);
    }
    parser.syntaxParser().consumeWhitespace();
    auto atResult = parser.syntaxParser().consumeComponentValue<bool>([](const CSSPreservedToken &token) -> bool {
      return token.type() == CSSTokenType::Ident && fnv1aLowercase(token.stringValue()) == fnv1a("at");
    });

    if (atResult) {
      parser.syntaxParser().consumeWhitespace();
      auto cx = parser.parseNextValue<CSSLengthPercentage>();
      if (std::holds_alternative<CSSLength>(cx)) {
        shape.cx = std::get<CSSLength>(cx);
      } else if (std::holds_alternative<CSSPercentage>(cx)) {
        shape.cx = std::get<CSSPercentage>(cx);
      }
      parser.syntaxParser().consumeWhitespace();
      auto cy = parser.parseNextValue<CSSLengthPercentage>();
      if (std::holds_alternative<CSSLength>(cy)) {
        shape.cy = std::get<CSSLength>(cy);
      } else if (std::holds_alternative<CSSPercentage>(cy)) {
        shape.cy = std::get<CSSPercentage>(cy);
      }
    }

    return shape;
  }
};

static_assert(CSSDataType<CSSCircleShape>);

} // namespace facebook::react
