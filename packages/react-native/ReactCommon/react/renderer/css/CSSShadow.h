/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <tuple>

#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSKeyword.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSList.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/to_underlying.h>

namespace facebook::react {

/**
 * Representation of CSS <shadow> data type
 * https://drafts.csswg.org/css-backgrounds/#typedef-shadow
 */
struct CSSShadow {
  CSSLength offsetX{};
  CSSLength offsetY{};
  CSSLength blurRadius{};
  CSSLength spreadDistance{};
  CSSColor color{CSSColor::black()};
  bool inset{false};

  constexpr bool operator==(const CSSShadow &rhs) const = default;
};

/**
 * Represents a keyword for an inset shadow.
 */
enum class CSSInsetShadowKeyword : std::underlying_type_t<CSSKeyword> {
  Inset = to_underlying(CSSKeyword::Inset),
};

static_assert(CSSDataType<CSSInsetShadowKeyword>);

template <>
struct CSSDataTypeParser<CSSShadow> {
  static constexpr auto consume(CSSValueParser &parser) -> std::optional<CSSShadow>
  {
    std::optional<CSSColor> color{};
    bool inset{false};
    std::optional<std::tuple<CSSLength, CSSLength, CSSLength, CSSLength>> lengths{};

    for (auto nextValue = parser.parseNextValue<CSSLength, CSSColor, CSSInsetShadowKeyword>();
         !std::holds_alternative<std::monostate>(nextValue);
         nextValue = parser.parseNextValue<CSSLength, CSSColor, CSSInsetShadowKeyword>(CSSDelimiter::Whitespace)) {
      if (std::holds_alternative<CSSLength>(nextValue)) {
        if (lengths.has_value()) {
          return {};
        }
        lengths = parseRestLengths(std::get<CSSLength>(nextValue), parser);
        if (!lengths.has_value()) {
          return {};
        }
        continue;
      }

      if (std::holds_alternative<CSSColor>(nextValue)) {
        if (color.has_value()) {
          return {};
        }
        color = std::get<CSSColor>(nextValue);
        continue;
      }

      if (std::holds_alternative<CSSInsetShadowKeyword>(nextValue)) {
        if (inset) {
          return {};
        }
        inset = true;
        continue;
      }
    }

    if (!lengths.has_value()) {
      return {};
    }

    return CSSShadow{
        .offsetX = std::get<0>(*lengths),
        .offsetY = std::get<1>(*lengths),
        .blurRadius = std::get<2>(*lengths),
        .spreadDistance = std::get<3>(*lengths),
        .color = color.value_or(CSSColor::black()),
        .inset = inset,
    };
  }

 private:
  static constexpr auto parseRestLengths(CSSLength offsetX, CSSValueParser &parser)
      -> std::optional<std::tuple<CSSLength, CSSLength, CSSLength, CSSLength>>
  {
    auto offsetY = parser.parseNextValue<CSSLength>(CSSDelimiter::Whitespace);
    if (std::holds_alternative<std::monostate>(offsetY)) {
      return {};
    }

    auto blurRadius = parser.parseNextValue<CSSLength>(CSSDelimiter::Whitespace);
    if (std::holds_alternative<std::monostate>(blurRadius)) {
      return std::make_tuple(offsetX, std::get<CSSLength>(offsetY), CSSLength{}, CSSLength{});
    }
    if (std::get<CSSLength>(blurRadius).value < 0) {
      return {};
    }

    auto spreadDistance = parser.parseNextValue<CSSLength>(CSSDelimiter::Whitespace);
    if (std::holds_alternative<std::monostate>(spreadDistance)) {
      return std::make_tuple(offsetX, std::get<CSSLength>(offsetY), std::get<CSSLength>(blurRadius), CSSLength{});
    }

    return std::make_tuple(
        offsetX, std::get<CSSLength>(offsetY), std::get<CSSLength>(blurRadius), std::get<CSSLength>(spreadDistance));
  }
};

static_assert(CSSDataType<CSSShadow>);

/**
 * Represents a comma separated list of at least one <shadow>
 * <shadow>#
 */
using CSSShadowList = CSSCommaSeparatedList<CSSShadow>;

} // namespace facebook::react
