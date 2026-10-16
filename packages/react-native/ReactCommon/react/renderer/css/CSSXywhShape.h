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
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/fnv1a.h>
#include <react/utils/iequals.h>

namespace facebook::react {

struct CSSXywhShape {
  std::variant<CSSLength, CSSPercentage> x;
  std::variant<CSSLength, CSSPercentage> y;
  std::variant<CSSLength, CSSPercentage> width;
  std::variant<CSSLength, CSSPercentage> height;
  std::optional<std::variant<CSSLength, CSSPercentage>> borderRadius;

  bool operator==(const CSSXywhShape &other) const
  {
    return x == other.x && y == other.y && width == other.width && height == other.height &&
        borderRadius == other.borderRadius;
  }
};

template <>
struct CSSDataTypeParser<CSSXywhShape> {
  static auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser) -> std::optional<CSSXywhShape>
  {
    if (!iequals(func.name, "xywh")) {
      return {};
    }

    auto x = parser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(x)) {
      return std::nullopt;
    }

    parser.syntaxParser().consumeWhitespace();

    auto y = parser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(y)) {
      return std::nullopt;
    }

    parser.syntaxParser().consumeWhitespace();

    auto width = parser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(width)) {
      return std::nullopt;
    }

    parser.syntaxParser().consumeWhitespace();

    auto height = parser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(height)) {
      return std::nullopt;
    }

    CSSXywhShape shape;

    if (std::holds_alternative<CSSLength>(x)) {
      shape.x = std::get<CSSLength>(x);
    } else if (std::holds_alternative<CSSPercentage>(x)) {
      shape.x = std::get<CSSPercentage>(x);
    }

    if (std::holds_alternative<CSSLength>(y)) {
      shape.y = std::get<CSSLength>(y);
    } else if (std::holds_alternative<CSSPercentage>(y)) {
      shape.y = std::get<CSSPercentage>(y);
    }

    if (std::holds_alternative<CSSLength>(width)) {
      shape.width = std::get<CSSLength>(width);
    } else if (std::holds_alternative<CSSPercentage>(width)) {
      shape.width = std::get<CSSPercentage>(width);
    }

    if (std::holds_alternative<CSSLength>(height)) {
      shape.height = std::get<CSSLength>(height);
    } else if (std::holds_alternative<CSSPercentage>(height)) {
      shape.height = std::get<CSSPercentage>(height);
    }

    parser.syntaxParser().consumeWhitespace();

    auto roundResult = parser.syntaxParser().consumeComponentValue<bool>([](const CSSPreservedToken &token) -> bool {
      return token.type() == CSSTokenType::Ident && fnv1aLowercase(token.stringValue()) == fnv1a("round");
    });

    if (roundResult) {
      parser.syntaxParser().consumeWhitespace();
      auto radius = parser.parseNextValue<CSSLengthPercentage>();
      if (std::holds_alternative<CSSLength>(radius)) {
        shape.borderRadius = std::get<CSSLength>(radius);
      } else if (std::holds_alternative<CSSPercentage>(radius)) {
        shape.borderRadius = std::get<CSSPercentage>(radius);
      }
    }

    return shape;
  }
};

static_assert(CSSDataType<CSSXywhShape>);

} // namespace facebook::react
