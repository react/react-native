/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <type_traits>
#include <variant>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

/**
 * One of the positional keywords for the `transform-origin` property.
 */
enum class CSSTransformOriginKeyword : std::underlying_type_t<CSSKeyword> {
  Center = static_cast<std::underlying_type_t<CSSKeyword>>(CSSKeyword::Center),
  Left = static_cast<std::underlying_type_t<CSSKeyword>>(CSSKeyword::Left),
  Right = static_cast<std::underlying_type_t<CSSKeyword>>(CSSKeyword::Right),
  Top = static_cast<std::underlying_type_t<CSSKeyword>>(CSSKeyword::Top),
  Bottom = static_cast<std::underlying_type_t<CSSKeyword>>(CSSKeyword::Bottom),
};

static_assert(CSSDataType<CSSTransformOriginKeyword>);

/**
 * Representation of the value produced by the `transform-origin` property.
 * https://drafts.csswg.org/css-transforms/#propdef-transform-origin
 */
struct CSSTransformOrigin {
  std::variant<CSSLength, CSSPercentage> x{};
  std::variant<CSSLength, CSSPercentage> y{};
  CSSLength z{};

  constexpr bool operator==(const CSSTransformOrigin &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTransformOrigin> {
  static constexpr auto consume(CSSValueParser &parser) -> std::optional<CSSTransformOrigin>
  {
    //  [ left | center | right | top | bottom | <length-percentage> ]
    // |
    //   [ left | center | right | <length-percentage> ]
    //   [ top | center | bottom | <length-percentage> ] <length>?
    // |
    //   [ [ center | left | right ] && [ center | top | bottom ] ] <length>?

    auto firstValue = parser.parseNextValue<CSSLengthPercentage, CSSTransformOriginKeyword>();
    if (std::holds_alternative<std::monostate>(firstValue)) {
      return {};
    }

    auto secondValue = parser.parseNextValue<CSSLengthPercentage, CSSTransformOriginKeyword>(CSSDelimiter::Whitespace);

    if (std::holds_alternative<std::monostate>(secondValue)) {
      return singleValue(firstValue);
    }

    auto thirdValue = parser.parseNextValue<CSSLength>(CSSDelimiter::Whitespace);

    if (std::holds_alternative<CSSLength>(firstValue) || std::holds_alternative<CSSPercentage>(firstValue) ||
        std::holds_alternative<CSSLength>(secondValue) || std::holds_alternative<CSSPercentage>(secondValue)) {
      return xyLengthPercentageValue(firstValue, secondValue, thirdValue);
    }

    if (std::holds_alternative<CSSTransformOriginKeyword>(firstValue) &&
        std::holds_alternative<CSSTransformOriginKeyword>(secondValue)) {
      return xyKeywordValue(
          std::get<CSSTransformOriginKeyword>(firstValue),
          std::get<CSSTransformOriginKeyword>(secondValue),
          thirdValue);
    }

    return {};
  }

 private:
  static constexpr CSSTransformOrigin singleValue(
      const std::variant<std::monostate, CSSLength, CSSPercentage, CSSTransformOriginKeyword> &value)
  {
    CSSTransformOrigin result{};

    if (std::holds_alternative<CSSLength>(value)) {
      result.x = std::get<CSSLength>(value);
      result.y = keywordPercentage(CSSTransformOriginKeyword::Center);
    } else if (std::holds_alternative<CSSPercentage>(value)) {
      result.x = std::get<CSSPercentage>(value);
      result.y = keywordPercentage(CSSTransformOriginKeyword::Center);
    } else if (std::holds_alternative<CSSTransformOriginKeyword>(value)) {
      if (isHorizontalKeyword(std::get<CSSTransformOriginKeyword>(value))) {
        result.x = keywordPercentage(std::get<CSSTransformOriginKeyword>(value));
        result.y = keywordPercentage(CSSTransformOriginKeyword::Center);
      } else {
        result.x = keywordPercentage(CSSTransformOriginKeyword::Center);
        result.y = keywordPercentage(std::get<CSSTransformOriginKeyword>(value));
      }
    }

    return result;
  }

  static constexpr std::optional<CSSTransformOrigin> xyLengthPercentageValue(
      const std::variant<std::monostate, CSSLength, CSSPercentage, CSSTransformOriginKeyword> &val1,
      const std::variant<std::monostate, CSSLength, CSSPercentage, CSSTransformOriginKeyword> &val2,
      const std::variant<std::monostate, CSSLength> &val3)
  {
    CSSTransformOrigin result{};

    if (std::holds_alternative<CSSLength>(val1)) {
      result.x = std::get<CSSLength>(val1);
    } else if (std::holds_alternative<CSSPercentage>(val1)) {
      result.x = std::get<CSSPercentage>(val1);
    } else if (std::holds_alternative<CSSTransformOriginKeyword>(val1)) {
      if (!isHorizontalKeyword(std::get<CSSTransformOriginKeyword>(val1))) {
        return {};
      }

      result.x = keywordPercentage(std::get<CSSTransformOriginKeyword>(val1));
    }

    if (std::holds_alternative<CSSLength>(val2)) {
      result.y = std::get<CSSLength>(val2);
    } else if (std::holds_alternative<CSSPercentage>(val2)) {
      result.y = std::get<CSSPercentage>(val2);
    } else if (std::holds_alternative<CSSTransformOriginKeyword>(val2)) {
      if (!isVerticalKeyword(std::get<CSSTransformOriginKeyword>(val2))) {
        return {};
      }

      result.y = keywordPercentage(std::get<CSSTransformOriginKeyword>(val2));
    }

    if (std::holds_alternative<CSSLength>(val3)) {
      result.z = std::get<CSSLength>(val3);
    }

    return result;
  }

  static constexpr std::optional<CSSTransformOrigin> xyKeywordValue(
      CSSTransformOriginKeyword val1,
      CSSTransformOriginKeyword val2,
      const std::variant<std::monostate, CSSLength> &val3)
  {
    if (isHorizontalKeyword(val1) && isVerticalKeyword(val2)) {
      return CSSTransformOrigin{
          .x = keywordPercentage(val1),
          .y = keywordPercentage(val2),
          .z = std::holds_alternative<CSSLength>(val3) ? std::get<CSSLength>(val3) : CSSLength{}};
    }

    if (isVerticalKeyword(val1) && isHorizontalKeyword(val2)) {
      return CSSTransformOrigin{
          .x = keywordPercentage(val2),
          .y = keywordPercentage(val1),
          .z = std::holds_alternative<CSSLength>(val3) ? std::get<CSSLength>(val3) : CSSLength{}};
    }

    return {};
  }

  static constexpr bool isHorizontalKeyword(CSSTransformOriginKeyword keyword)
  {
    return keyword == CSSTransformOriginKeyword::Left || keyword == CSSTransformOriginKeyword::Center ||
        keyword == CSSTransformOriginKeyword::Right;
  }

  static constexpr bool isVerticalKeyword(CSSTransformOriginKeyword keyword)
  {
    return keyword == CSSTransformOriginKeyword::Top || keyword == CSSTransformOriginKeyword::Center ||
        keyword == CSSTransformOriginKeyword::Bottom;
  }

  static constexpr CSSPercentage keywordPercentage(CSSTransformOriginKeyword keyword)
  {
    switch (keyword) {
      case CSSTransformOriginKeyword::Left:
        return CSSPercentage{0.0f};
      case CSSTransformOriginKeyword::Top:
        return CSSPercentage{0.0f};
      case CSSTransformOriginKeyword::Center:
        return CSSPercentage{50.0f};
      case CSSTransformOriginKeyword::Right:
        return CSSPercentage{100.0f};
      case CSSTransformOriginKeyword::Bottom:
        return CSSPercentage{100.0f};
    }

    return {};
  }
};

static_assert(CSSDataType<CSSTransformOrigin>);

} // namespace facebook::react
