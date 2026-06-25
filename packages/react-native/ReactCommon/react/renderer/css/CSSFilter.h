/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <optional>
#include <variant>

#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSList.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSZero.h>
#include <react/utils/TemplateStringLiteral.h>
#include <react/utils/iequals.h>

namespace facebook::react {

namespace detail {
template <typename DataT, TemplateStringLiteral Name>
  requires(std::is_same_v<decltype(DataT::amount), float>)
struct CSSFilterSimpleAmountParser {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<DataT>
  {
    if (!iequals(func.name, Name)) {
      return {};
    }

    auto amount = parser.parseNextValue<CSSNumber, CSSPercentage>();
    if (std::holds_alternative<CSSNumber>(amount)) {
      if (std::get<CSSNumber>(amount).value < 0.0f) {
        return {};
      }
      return DataT{std::get<CSSNumber>(amount).value};
    } else if (std::holds_alternative<CSSPercentage>(amount)) {
      if (std::get<CSSPercentage>(amount).value < 0.0f) {
        return {};
      }
      return DataT{std::get<CSSPercentage>(amount).value / 100.0f};
    } else {
      return DataT{};
    }
  }
};

} // namespace detail

/**
 * Representation of blur() function
 */
struct CSSBlurFilter {
  CSSLength amount{};

  constexpr bool operator==(const CSSBlurFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSBlurFilter> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSBlurFilter>
  {
    if (!iequals(func.name, "blur")) {
      return {};
    }

    auto len = parser.parseNextValue<CSSLength>();
    return CSSBlurFilter{std::holds_alternative<CSSLength>(len) ? std::get<CSSLength>(len) : CSSLength{}};
  }
};

static_assert(CSSDataType<CSSBlurFilter>);

/**
 * Representation of brightness() function
 */
struct CSSBrightnessFilter {
  float amount{1.0f};

  constexpr bool operator==(const CSSBrightnessFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSBrightnessFilter>
    : public detail::CSSFilterSimpleAmountParser<CSSBrightnessFilter, "brightness"> {};

static_assert(CSSDataType<CSSBrightnessFilter>);

/**
 * Representation of contrast() function
 */
struct CSSContrastFilter {
  float amount{1.0f};

  constexpr bool operator==(const CSSContrastFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSContrastFilter>
    : public detail::CSSFilterSimpleAmountParser<CSSContrastFilter, "contrast"> {};

static_assert(CSSDataType<CSSContrastFilter>);

/**
 * Representation of drop-shadow() function
 */
struct CSSDropShadowFilter {
  CSSLength offsetX{};
  CSSLength offsetY{};
  CSSLength standardDeviation{};
  CSSColor color{};

  constexpr bool operator==(const CSSDropShadowFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSDropShadowFilter> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSDropShadowFilter>
  {
    if (!iequals(func.name, "drop-shadow")) {
      return {};
    }

    std::optional<CSSColor> color{};
    std::optional<std::array<CSSLength, 3>> lengths{};

    auto firstVal = parser.parseNextValue<CSSColor, CSSLength>();
    if (std::holds_alternative<std::monostate>(firstVal)) {
      return {};
    }

    if (std::holds_alternative<CSSColor>(firstVal)) {
      color = std::get<CSSColor>(firstVal);
    } else {
      lengths = parseLengths(std::get<CSSLength>(firstVal), parser);
      if (!lengths.has_value()) {
        return {};
      }
    }

    auto secondVal = parser.parseNextValue<CSSColor, CSSLength>(CSSDelimiter::Whitespace);
    if (std::holds_alternative<CSSColor>(secondVal)) {
      if (color.has_value()) {
        return {};
      }
      color = std::get<CSSColor>(secondVal);
    } else if (std::holds_alternative<CSSLength>(secondVal)) {
      if (lengths.has_value()) {
        return {};
      }
      lengths = parseLengths(std::get<CSSLength>(secondVal), parser);
    }

    if (!lengths.has_value()) {
      return {};
    }

    return CSSDropShadowFilter{
        .offsetX = (*lengths)[0],
        .offsetY = (*lengths)[1],
        .standardDeviation = (*lengths)[2],
        .color = color.value_or(CSSColor::black()),
    };
  }

 private:
  static constexpr std::optional<std::array<CSSLength, 3>> parseLengths(CSSLength offsetX, CSSValueParser &parser)
  {
    auto offsetY = parser.parseNextValue<CSSLength>(CSSDelimiter::Whitespace);
    if (!std::holds_alternative<CSSLength>(offsetY)) {
      return {};
    }

    auto standardDeviation = parser.parseNextValue<CSSLength>(CSSDelimiter::Whitespace);
    if (std::holds_alternative<CSSLength>(standardDeviation) && std::get<CSSLength>(standardDeviation).value < 0.0f) {
      return {};
    }

    return std::array<CSSLength, 3>{
        offsetX,
        std::get<CSSLength>(offsetY),
        std::holds_alternative<CSSLength>(standardDeviation) ? std::get<CSSLength>(standardDeviation) : CSSLength{}};
  }
};

static_assert(CSSDataType<CSSDropShadowFilter>);

/**
 * Representation of grayscale() function
 */
struct CSSGrayscaleFilter {
  float amount{1.0f};

  constexpr bool operator==(const CSSGrayscaleFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSGrayscaleFilter>
    : public detail::CSSFilterSimpleAmountParser<CSSGrayscaleFilter, "grayscale"> {};

static_assert(CSSDataType<CSSGrayscaleFilter>);

/**
 * Representation of hue-rotate() function
 */
struct CSSHueRotateFilter {
  float degrees{};

  constexpr bool operator==(const CSSHueRotateFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSHueRotateFilter> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSHueRotateFilter>
  {
    if (!iequals(func.name, "hue-rotate")) {
      return {};
    }

    auto angle = parser.parseNextValue<CSSAngle, CSSZero>();
    return CSSHueRotateFilter{std::holds_alternative<CSSAngle>(angle) ? std::get<CSSAngle>(angle).degrees : 0.0f};
  }
};

static_assert(CSSDataType<CSSHueRotateFilter>);

/**
 * Representation of invert() function
 */
struct CSSInvertFilter {
  float amount{1.0f};

  constexpr bool operator==(const CSSInvertFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSInvertFilter> : public detail::CSSFilterSimpleAmountParser<CSSInvertFilter, "invert"> {};

static_assert(CSSDataType<CSSInvertFilter>);

/**
 * Representation of opacity() function
 */
struct CSSOpacityFilter {
  float amount{1.0f};

  constexpr bool operator==(const CSSOpacityFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSOpacityFilter> : public detail::CSSFilterSimpleAmountParser<CSSOpacityFilter, "opacity"> {};

static_assert(CSSDataType<CSSOpacityFilter>);

/**
 * Representation of saturate() function
 */
struct CSSSaturateFilter {
  float amount{1.0f};

  constexpr bool operator==(const CSSSaturateFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSSaturateFilter>
    : public detail::CSSFilterSimpleAmountParser<CSSSaturateFilter, "saturate"> {};

static_assert(CSSDataType<CSSSaturateFilter>);

/**
 * Representation of sepia() function
 */
struct CSSSepiaFilter {
  float amount{1.0f};

  constexpr bool operator==(const CSSSepiaFilter &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSSepiaFilter> : public detail::CSSFilterSimpleAmountParser<CSSSepiaFilter, "sepia"> {};

static_assert(CSSDataType<CSSSepiaFilter>);

/**
 * Representation of <filter-function>
 * https://www.w3.org/TR/filter-effects-1/#typedef-filter-function
 */
using CSSFilterFunction = CSSCompoundDataType<
    CSSBlurFilter,
    CSSBrightnessFilter,
    CSSContrastFilter,
    CSSDropShadowFilter,
    CSSGrayscaleFilter,
    CSSHueRotateFilter,
    CSSInvertFilter,
    CSSOpacityFilter,
    CSSSaturateFilter,
    CSSSepiaFilter>;

/**
 * Representation of <filter-value-list>
 * https://www.w3.org/TR/filter-effects-1/#typedef-filter-value-list
 */
using CSSFilterList = CSSWhitespaceSeparatedList<CSSFilterFunction>;

} // namespace facebook::react
