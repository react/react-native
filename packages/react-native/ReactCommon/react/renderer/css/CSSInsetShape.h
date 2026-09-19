/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <variant>
#include <vector>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/fnv1a.h>
#include <react/utils/iequals.h>

namespace facebook::react {

struct CSSInsetShape {
  std::optional<std::variant<CSSLength, CSSPercentage>> top{};
  std::optional<std::variant<CSSLength, CSSPercentage>> bottom{};
  std::optional<std::variant<CSSLength, CSSPercentage>> left{};
  std::optional<std::variant<CSSLength, CSSPercentage>> right{};
  std::optional<std::variant<CSSLength, CSSPercentage>> borderRadius{};

  bool operator==(const CSSInsetShape &rhs) const
  {
    return top == rhs.top && bottom == rhs.bottom && left == rhs.left && right == rhs.right &&
        borderRadius == rhs.borderRadius;
  }
};

template <>
struct CSSDataTypeParser<CSSInsetShape> {
  static auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSInsetShape>
  {
    if (!iequals(func.name, "inset")) {
      return {};
    }

    CSSInsetShape shape;

    std::vector<std::variant<CSSLength, CSSPercentage>> lengths;
    for (int i = 0; i < 4; ++i) {
      auto length = parser.parseNextValue<CSSLengthPercentage>();
      if (std::holds_alternative<CSSLength>(length)) {
        lengths.push_back(std::get<CSSLength>(length));
      } else if (std::holds_alternative<CSSPercentage>(length)) {
        lengths.push_back(std::get<CSSPercentage>(length));
      } else {
        break;
      }

      parser.syntaxParser().consumeWhitespace();
    }

    if (lengths.empty()) {
      return {};
    }

    if (lengths.size() == 1) {
      shape.top = shape.right = shape.bottom = shape.left = lengths[0];
    } else if (lengths.size() == 2) {
      shape.top = shape.bottom = lengths[0];
      shape.right = shape.left = lengths[1];
    } else if (lengths.size() == 3) {
      shape.top = lengths[0];
      shape.right = shape.left = lengths[1];
      shape.bottom = lengths[2];
    } else if (lengths.size() == 4) {
      shape.top = lengths[0];
      shape.right = lengths[1];
      shape.bottom = lengths[2];
      shape.left = lengths[3];
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

static_assert(CSSDataType<CSSInsetShape>);

} // namespace facebook::react
