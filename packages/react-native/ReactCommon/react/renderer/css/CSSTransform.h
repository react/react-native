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

#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSList.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/css/CSSZero.h>
#include <react/utils/TemplateStringLiteral.h>
#include <react/utils/iequals.h>

namespace facebook::react {

namespace detail {
template <typename DataT, TemplateStringLiteral Name, CSSDataType... AllowedComponentsT>
  requires(std::is_same_v<decltype(DataT::value), std::variant<AllowedComponentsT...>>)
struct CSSVariantComponentTransformParser {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<DataT>
  {
    if (!iequals(func.name, Name)) {
      return {};
    }

    auto val = parser.parseNextValue<AllowedComponentsT...>();

    return std::visit(
        [&](auto &&v) -> std::optional<DataT> {
          if constexpr (std::is_same_v<std::remove_cvref_t<decltype(v)>, std::monostate>) {
            return {};
          } else {
            return DataT{.value = std::forward<decltype(v)>(v)};
          }
        },
        val);
  }
};

template <typename DataT, TemplateStringLiteral Name>
  requires(std::is_same_v<decltype(DataT::value), float>)
struct CSSNumberPercentTransformParser {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<DataT>
  {
    if (!iequals(func.name, Name)) {
      return {};
    }

    auto val = parser.parseNextValue<CSSNumber, CSSPercentage>();
    if (std::holds_alternative<std::monostate>(val)) {
      return {};
    }

    return DataT{
        .value = std::holds_alternative<CSSNumber>(val) ? std::get<CSSNumber>(val).value
                                                        : std::get<CSSPercentage>(val).value / 100.0f};
  }
};

template <typename DataT, TemplateStringLiteral Name>
  requires(std::is_same_v<decltype(DataT::degrees), float>)
struct CSSAngleTransformParser {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<DataT>
  {
    if (!iequals(func.name, Name)) {
      return {};
    }

    auto value = parser.parseNextValue<CSSAngle, CSSZero>();
    if (std::holds_alternative<std::monostate>(value)) {
      return {};
    }

    return DataT{
        .degrees = std::holds_alternative<CSSAngle>(value) ? std::get<CSSAngle>(value).degrees : 0.0f,
    };
  }
};

} // namespace detail

/**
 * Representation of matrix() transform function.
 */
struct CSSMatrix {
  std::array<float, 6> values{};

  constexpr bool operator==(const CSSMatrix &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSMatrix> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSMatrix>
  {
    if (!iequals(func.name, "matrix")) {
      return {};
    }

    CSSMatrix matrix{};
    for (int i = 0; i < 6; i++) {
      auto value = parser.parseNextValue<CSSNumber>(i == 0 ? CSSDelimiter::None : CSSDelimiter::Comma);
      if (std::holds_alternative<std::monostate>(value)) {
        return {};
      }
      matrix.values[i] = std::get<CSSNumber>(value).value;
    }

    return matrix;
  }
};

static_assert(CSSDataType<CSSMatrix>);

/**
 * Representation of translate() transform function.
 */
struct CSSTranslate {
  std::variant<CSSLength, CSSPercentage> x{};
  std::variant<CSSLength, CSSPercentage> y{};

  constexpr bool operator==(const CSSTranslate &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTranslate> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSTranslate>
  {
    if (!iequals(func.name, "translate")) {
      return {};
    }

    auto x = parser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(x)) {
      return {};
    }

    auto y = parser.parseNextValue<CSSLengthPercentage>(CSSDelimiter::Comma);

    CSSTranslate translate{};
    translate.x = std::holds_alternative<CSSLength>(x)
        ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(x)}
        : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(x)};

    if (!std::holds_alternative<std::monostate>(y)) {
      translate.y = std::holds_alternative<CSSLength>(y)
          ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(y)}
          : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(y)};
    }

    return translate;
  }
};

static_assert(CSSDataType<CSSTranslate>);

/**
 * Representation of translate() transform function.
 */
struct CSSTranslate3D {
  std::variant<CSSLength, CSSPercentage> x{};
  std::variant<CSSLength, CSSPercentage> y{};
  CSSLength z{};

  constexpr bool operator==(const CSSTranslate3D &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTranslate3D> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSTranslate3D>
  {
    if (!iequals(func.name, "translate3d")) {
      return {};
    }

    auto x = parser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(x)) {
      return {};
    }

    auto y = parser.parseNextValue<CSSLengthPercentage>(CSSDelimiter::Comma);
    if (std::holds_alternative<std::monostate>(y)) {
      return {};
    }

    auto z = parser.parseNextValue<CSSLength>(CSSDelimiter::Comma);
    if (std::holds_alternative<std::monostate>(z)) {
      return {};
    }

    return CSSTranslate3D{
        .x = std::holds_alternative<CSSLength>(x) ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(x)}
                                                  : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(x)},
        .y = std::holds_alternative<CSSLength>(y) ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(y)}
                                                  : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(y)},
        .z = std::get<CSSLength>(z),
    };
  }
};

static_assert(CSSDataType<CSSTranslate3D>);

/**
 * Representation of translateX() transform function.
 */
struct CSSTranslateX {
  std::variant<CSSLength, CSSPercentage> value{};

  constexpr bool operator==(const CSSTranslateX &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTranslateX>
    : public detail::CSSVariantComponentTransformParser<CSSTranslateX, "translateX", CSSLength, CSSPercentage> {};

static_assert(CSSDataType<CSSTranslateX>);

/**
 * Representation of translateY() transform function.
 */
struct CSSTranslateY {
  std::variant<CSSLength, CSSPercentage> value{};

  constexpr bool operator==(const CSSTranslateY &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSTranslateY>
    : public detail::CSSVariantComponentTransformParser<CSSTranslateY, "translateY", CSSLength, CSSPercentage> {};

static_assert(CSSDataType<CSSTranslateY>);

/**
 * Representation of scale() transform function.
 */
struct CSSScale {
  float x{};
  float y{};

  constexpr bool operator==(const CSSScale &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSScale> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSScale>
  {
    if (!iequals(func.name, "scale")) {
      return {};
    }

    // Transforms module level 2 allows percentage syntax
    // https://drafts.csswg.org/css-transforms-2/#transform-functions
    auto x = parser.parseNextValue<CSSNumber, CSSPercentage>();
    if (std::holds_alternative<std::monostate>(x)) {
      return {};
    }

    auto y = parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Comma);

    auto normX =
        std::holds_alternative<CSSNumber>(x) ? std::get<CSSNumber>(x).value : std::get<CSSPercentage>(x).value / 100.0f;

    auto normY = std::holds_alternative<std::monostate>(y) ? normX
        : std::holds_alternative<CSSNumber>(y)             ? std::get<CSSNumber>(y).value
                                                           : std::get<CSSPercentage>(y).value / 100.0f;

    return CSSScale{.x = normX, .y = normY};
  }
};

static_assert(CSSDataType<CSSScale>);

/**
 * Representation of scaleX() transform function.
 */
struct CSSScaleX {
  float value{};

  constexpr bool operator==(const CSSScaleX &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSScaleX> : public detail::CSSNumberPercentTransformParser<CSSScaleX, "scaleX"> {};

static_assert(CSSDataType<CSSScaleX>);

/**
 * Representation of scaleY() transform function.
 */
struct CSSScaleY {
  float value{};

  constexpr bool operator==(const CSSScaleY &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSScaleY> : public detail::CSSNumberPercentTransformParser<CSSScaleY, "scaleY"> {};

static_assert(CSSDataType<CSSScaleY>);

/**
 * Representation of rotate() transform function.
 */
struct CSSRotate {
  float degrees{};

  constexpr bool operator==(const CSSRotate &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRotate> : public detail::CSSAngleTransformParser<CSSRotate, "rotate"> {};

static_assert(CSSDataType<CSSRotate>);

/**
 * Representation of rotateX() transform function.
 */
struct CSSRotateX {
  float degrees{};

  constexpr bool operator==(const CSSRotateX &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRotateX> : public detail::CSSAngleTransformParser<CSSRotateX, "rotateX"> {};

static_assert(CSSDataType<CSSRotateX>);

/**
 * Representation of rotateY() transform function.
 */
struct CSSRotateY {
  float degrees{};

  constexpr bool operator==(const CSSRotateY &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRotateY> : public detail::CSSAngleTransformParser<CSSRotateY, "rotateY"> {};

static_assert(CSSDataType<CSSRotateY>);

/**
 * Representation of rotateZ() transform function.
 */
struct CSSRotateZ {
  float degrees{};

  constexpr bool operator==(const CSSRotateZ &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRotateZ> : public detail::CSSAngleTransformParser<CSSRotateZ, "rotateZ"> {};

static_assert(CSSDataType<CSSRotateZ>);

/**
 * Representation of skewX() transform function.
 */
struct CSSSkewX {
  float degrees{};

  constexpr bool operator==(const CSSSkewX &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSSkewX> : public detail::CSSAngleTransformParser<CSSSkewX, "skewX"> {};

static_assert(CSSDataType<CSSSkewX>);

/**
 * Representation of skewY() transform function.
 */
struct CSSSkewY {
  float degrees{};

  constexpr bool operator==(const CSSSkewY &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSSkewY> : public detail::CSSAngleTransformParser<CSSSkewY, "skewY"> {};

static_assert(CSSDataType<CSSSkewY>);

/**
 * Representation of perspective() transform function.
 */
struct CSSPerspective {
  CSSLength length{};

  constexpr bool operator==(const CSSPerspective &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSPerspective> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSPerspective>
  {
    if (!iequals(func.name, "perspective")) {
      return {};
    }

    auto value = parser.parseNextValue<CSSLength>();
    if (std::holds_alternative<std::monostate>(value) || std::get<CSSLength>(value).value < 0) {
      return {};
    }

    return CSSPerspective{
        .length = std::get<CSSLength>(value),
    };
  }
};

static_assert(CSSDataType<CSSPerspective>);

/**
 * Represents one of the <transform-function> types supported by react-native.
 * https://drafts.csswg.org/css-transforms-2/#transform-functions
 */
using CSSTransformFunction = CSSCompoundDataType<
    CSSMatrix,
    CSSTranslate,
    CSSTranslateX,
    CSSTranslateY,
    CSSTranslate3D,
    CSSScale,
    CSSScaleX,
    CSSScaleY,
    CSSRotate,
    CSSRotateX,
    CSSRotateY,
    CSSRotateZ,
    CSSSkewX,
    CSSSkewY,
    CSSPerspective>;

/**
 * Represents the <transform-list> type.
 * https://drafts.csswg.org/css-transforms-1/#typedef-transform-list
 */
using CSSTransformList = CSSWhitespaceSeparatedList<CSSTransformFunction>;

} // namespace facebook::react
