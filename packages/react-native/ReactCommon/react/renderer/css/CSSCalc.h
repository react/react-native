/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include <optional>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthUnit.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSSyntaxParser.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/iequals.h>

namespace facebook::react {

/**
 * Representation of CSS calc() function.
 * https://www.w3.org/TR/css-values-4/#calc-func
 */
struct CSSCalc {
  float px{0.0f};
  float percent{0.0f};
  float vw{0.0f};
  float vh{0.0f};
  bool unitless{false};

  constexpr bool operator==(const CSSCalc &rhs) const = default;

  constexpr CSSCalc operator+(const CSSCalc &rhs) const 
  {
    return CSSCalc{
        px + rhs.px,
        percent + rhs.percent,
        vw + rhs.vw,
        vh + rhs.vh,
        unitless && rhs.unitless};
  }

  constexpr CSSCalc operator-(const CSSCalc &rhs) const
  {
    return CSSCalc{
        px - rhs.px,
        percent - rhs.percent,
        vw - rhs.vw,
        vh - rhs.vh,
        unitless && rhs.unitless};
  }

  constexpr CSSCalc operator*(float scalar) const
  {
    return CSSCalc{
        px * scalar, percent * scalar, vw * scalar, vh * scalar, unitless};
  }

  constexpr CSSCalc operator/(float scalar) const
  {
    if (scalar == 0.0f) {
      return CSSCalc{};
    }
    return CSSCalc{
        px / scalar, percent / scalar, vw / scalar, vh / scalar, unitless};
  }

  constexpr CSSCalc operator-() const
  {
    return CSSCalc{-px, -percent, -vw, -vh, unitless};
  }

  float resolve(float percentRef, float viewportWidth, float viewportHeight)
      const
  {
    return px + (percent * percentRef * 0.01f) + (vw * viewportWidth * 0.01f) +
        (vh * viewportHeight * 0.01f);
  }

  constexpr bool isUnitless() const
  {
    return unitless;
  }

  constexpr bool isPointsOnly() const
  {
    return percent == 0.0f && vw == 0.0f && vh == 0.0f && !unitless;
  }

  constexpr bool isPercentOnly() const
  {
    return px == 0.0f && vw == 0.0f && vh == 0.0f && !unitless;
  }

  constexpr bool isZero() const
  {
    return px == 0.0f && percent == 0.0f && vw == 0.0f && vh == 0.0f;
  }

  static constexpr CSSCalc fromNumber(float value)
  {
    return CSSCalc{value, 0.0f, 0.0f, 0.0f, true};
  }

  static constexpr CSSCalc fromPoints(float value)
  {
    return CSSCalc{value, 0.0f, 0.0f, 0.0f, false};
  }

  static constexpr CSSCalc fromPercent(float value)
  {
    return CSSCalc{0.0f, value, 0.0f, 0.0f, false};
  }

  static constexpr CSSCalc fromVw(float value)
  {
    return CSSCalc{0.0f, 0.0f, value, 0.0f, false};
  }

  static constexpr CSSCalc fromVh(float value)
  {
    return CSSCalc{0.0f, 0.0f, 0.0f, value, false};
  }

  static constexpr std::optional<CSSCalc> fromLength(float value, CSSLengthUnit unit)
  {
    switch (unit) {
      case CSSLengthUnit::Px:
        return fromPoints(value);
      case CSSLengthUnit::Vw:
        return fromVw(value);
      case CSSLengthUnit::Vh:
        return fromVh(value);
      default:
        return std::nullopt;
    }
  }
};

template <>
struct CSSDataTypeParser<CSSCalc> {
  static constexpr auto consumeFunctionBlock(
      const CSSFunctionBlock &func,
      CSSValueParser &parser) -> std::optional<CSSCalc>
    {
    if (!iequals(func.name, "calc")) {
      return std::nullopt;
    }

    return parseCalcExpression(parser);
  }

    static constexpr auto parseCalcExpression(CSSValueParser &parser)
      -> std::optional<CSSCalc>
    {
    parser.syntaxParser().consumeWhitespace();
    auto result = parseAddSub(parser);
    parser.syntaxParser().consumeWhitespace();
    return result;
  }

  static constexpr auto consumeSimpleBlock(
      const CSSSimpleBlock &block,
      CSSValueParser &parser) -> std::optional<CSSCalc>
    {
    if (block.openBracketType != CSSTokenType::OpenParen) {
      return std::nullopt;
    }

    return parseCalcContents(parser);
  }

 private:
    static constexpr auto parseAddSub(CSSValueParser &parser)
      -> std::optional<CSSCalc>
    {
    auto left = parseMulDiv(parser);
    if (!left) {
      return std::nullopt;
    }

    while (true) {
      auto savedParser = parser.syntaxParser();
      parser.syntaxParser().consumeWhitespace();

      auto opResult =
          parser.syntaxParser().consumeComponentValue<std::optional<char>>(
              CSSDelimiter::None, [](const CSSPreservedToken &token) {
                if (token.type() == CSSTokenType::Delim) {
                  auto sv = token.stringValue();
                  if (!sv.empty() && (sv[0] == '+' || sv[0] == '-')) {
                    return std::optional<char>{sv[0]};
                  }
                }
                return std::optional<char>{};
              });

      if (!opResult) {
        parser.syntaxParser() = savedParser;
        break;
      }

      parser.syntaxParser().consumeWhitespace();
      auto right = parseMulDiv(parser);
      if (!right) {
        return std::nullopt;
      }

      if (left->isUnitless() != right->isUnitless()) {
        return std::nullopt;
      }

      if (*opResult == '+') {
        left = *left + *right;
      } else {
        left = *left - *right;
      }
    }

    return left;
  }

    static constexpr auto parseMulDiv(CSSValueParser &parser)
      -> std::optional<CSSCalc>
    {
    auto left = parseUnary(parser);
    if (!left) {
      return std::nullopt;
    }

    while (true) {
      auto savedParser = parser.syntaxParser();
      parser.syntaxParser().consumeWhitespace();

      auto opResult =
          parser.syntaxParser().consumeComponentValue<std::optional<char>>(
              CSSDelimiter::None, [](const CSSPreservedToken &token) {
                if (token.type() == CSSTokenType::Delim) {
                  auto sv = token.stringValue();
                  if (!sv.empty() && (sv[0] == '*' || sv[0] == '/')) {
                    return std::optional<char>{sv[0]};
                  }
                }
                return std::optional<char>{};
              });

      if (!opResult) {
        parser.syntaxParser() = savedParser;
        break;
      }

      parser.syntaxParser().consumeWhitespace();
      auto right = parseUnary(parser);
      if (!right) {
        return std::nullopt;
      }

      if (*opResult == '*') {
        if (right->isUnitless()) {
          left = *left * right->px;
        } else if (left->isUnitless()) {
          float scalar = left->px;
          left = *right * scalar;
        } else {
          return std::nullopt;
        }
      } else {
        if (!right->isUnitless() || right->px == 0.0f) {
          return std::nullopt;
        }
        left = *left / right->px;
      }
    }

    return left;
  }

    static constexpr auto parseUnary(CSSValueParser &parser)
      -> std::optional<CSSCalc>
    {
    auto savedParser = parser.syntaxParser();

    auto opResult =
        parser.syntaxParser().consumeComponentValue<std::optional<char>>(
          CSSDelimiter::None, [](const CSSPreservedToken &token) {
              if (token.type() == CSSTokenType::Delim) {
                auto sv = token.stringValue();
                if (!sv.empty() && (sv[0] == '+' || sv[0] == '-')) {
                  return std::optional<char>{sv[0]};
                }
              }
              return std::optional<char>{};
            });

    if (opResult) {
      parser.syntaxParser().consumeWhitespace();
      auto value = parseUnary(parser);
      if (!value) {
        return std::nullopt;
      }
      return *opResult == '-' ? -*value : *value;
    }

    parser.syntaxParser() = savedParser;
    return parsePrimary(parser);
  }

  static constexpr auto parsePrimary(CSSValueParser &parser)
      -> std::optional<CSSCalc>
  {
    auto value =
        parser.parseNextValue<CSSNumber, CSSPercentage, CSSLength, CSSCalc>();

    if (std::holds_alternative<CSSNumber>(value)) {
      return CSSCalc::fromNumber(std::get<CSSNumber>(value).value);
    }

    if (std::holds_alternative<CSSPercentage>(value)) {
      return CSSCalc::fromPercent(std::get<CSSPercentage>(value).value);
    }

    if (std::holds_alternative<CSSLength>(value)) {
      const auto &length = std::get<CSSLength>(value);
      return CSSCalc::fromLength(length.value, length.unit);
    }

    if (std::holds_alternative<CSSCalc>(value)) {
      return std::get<CSSCalc>(value);
    }

    return std::nullopt;
  }

    static constexpr auto parseCalcContents(CSSValueParser &parser)
      -> std::optional<CSSCalc>
    {
    parser.syntaxParser().consumeWhitespace();
    auto result = parseAddSub(parser);
    parser.syntaxParser().consumeWhitespace();
    return result;
  }
};

static_assert(CSSDataType<CSSCalc>);

} // namespace facebook::react
