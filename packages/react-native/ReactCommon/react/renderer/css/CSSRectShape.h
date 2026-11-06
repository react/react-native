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
#include <react/utils/iequals.h>

namespace facebook::react {

struct CSSRectShape {
  std::variant<CSSLength, CSSPercentage> top;
  std::variant<CSSLength, CSSPercentage> right;
  std::variant<CSSLength, CSSPercentage> bottom;
  std::variant<CSSLength, CSSPercentage> left;
  std::optional<std::variant<CSSLength, CSSPercentage>> borderRadius;

  bool operator==(const CSSRectShape &other) const = default;
};

template <>
struct CSSDataTypeParser<CSSRectShape> {
  static auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser) -> std::optional<CSSRectShape>
  {
    if (!iequals(func.name, "rect")) {
      return {};
    }

    auto top = parser.parseNextValue<CSSKeyword, CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(top)) {
      return std::nullopt;
    }

    parser.syntaxParser().consumeWhitespace();

    auto right = parser.parseNextValue<CSSKeyword, CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(right)) {
      return std::nullopt;
    }

    parser.syntaxParser().consumeWhitespace();

    auto bottom = parser.parseNextValue<CSSKeyword, CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(bottom)) {
      return std::nullopt;
    }

    parser.syntaxParser().consumeWhitespace();

    auto left = parser.parseNextValue<CSSKeyword, CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(left)) {
      return std::nullopt;
    }

    CSSRectShape shape;

    if (std::holds_alternative<CSSLength>(top)) {
      shape.top = std::get<CSSLength>(top);
    } else if (std::holds_alternative<CSSPercentage>(top)) {
      shape.top = std::get<CSSPercentage>(top);
    } else if (std::holds_alternative<CSSKeyword>(top)) {
      shape.top = CSSPercentage{0.0f};
    }

    if (std::holds_alternative<CSSLength>(right)) {
      shape.right = std::get<CSSLength>(right);
    } else if (std::holds_alternative<CSSPercentage>(right)) {
      shape.right = std::get<CSSPercentage>(right);
    } else if (std::holds_alternative<CSSKeyword>(right)) {
      shape.right = CSSPercentage{100.0f};
    }

    if (std::holds_alternative<CSSLength>(bottom)) {
      shape.bottom = std::get<CSSLength>(bottom);
    } else if (std::holds_alternative<CSSPercentage>(bottom)) {
      shape.bottom = std::get<CSSPercentage>(bottom);
    } else if (std::holds_alternative<CSSKeyword>(bottom)) {
      shape.bottom = CSSPercentage{100.0f};
    }

    if (std::holds_alternative<CSSLength>(left)) {
      shape.left = std::get<CSSLength>(left);
    } else if (std::holds_alternative<CSSPercentage>(left)) {
      shape.left = std::get<CSSPercentage>(left);
    } else if (std::holds_alternative<CSSKeyword>(left)) {
      shape.left = CSSPercentage{0.0f};
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

static_assert(CSSDataType<CSSRectShape>);

} // namespace facebook::react
