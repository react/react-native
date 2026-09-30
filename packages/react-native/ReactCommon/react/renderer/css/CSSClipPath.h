/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <variant>

#include <react/renderer/css/CSSCircleShape.h>
#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSEllipseShape.h>
#include <react/renderer/css/CSSInsetShape.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSPolygonShape.h>
#include <react/renderer/css/CSSRectShape.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/css/CSSXywhShape.h>
#include <react/utils/fnv1a.h>
#include <react/utils/iequals.h>

namespace facebook::react {

enum class CSSGeometryBox : uint8_t {
  BorderBox,
  PaddingBox,
  ContentBox,
  MarginBox,
  FillBox,
  StrokeBox,
  ViewBox,
};

template <>
struct CSSDataTypeParser<CSSGeometryBox> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken &token) -> std::optional<CSSGeometryBox>
  {
    if (token.type() == CSSTokenType::Ident) {
      auto lowercase = fnv1aLowercase(token.stringValue());
      if (lowercase == fnv1a("border-box")) {
        return CSSGeometryBox::BorderBox;
      } else if (lowercase == fnv1a("padding-box")) {
        return CSSGeometryBox::PaddingBox;
      } else if (lowercase == fnv1a("content-box")) {
        return CSSGeometryBox::ContentBox;
      } else if (lowercase == fnv1a("margin-box")) {
        return CSSGeometryBox::MarginBox;
      } else if (lowercase == fnv1a("fill-box")) {
        return CSSGeometryBox::FillBox;
      } else if (lowercase == fnv1a("stroke-box")) {
        return CSSGeometryBox::StrokeBox;
      } else if (lowercase == fnv1a("view-box")) {
        return CSSGeometryBox::ViewBox;
      }
    }
    return {};
  }
};

static_assert(CSSDataType<CSSGeometryBox>);

/**
 * Compound type for parsing basic shapes
 */
using CSSBasicShapeTypes =
    CSSCompoundDataType<CSSInsetShape, CSSCircleShape, CSSEllipseShape, CSSPolygonShape, CSSRectShape, CSSXywhShape>;

/**
 * Variant type for basic shapes in clip-path
 */
using CSSBasicShape = CSSVariantWithTypes<CSSBasicShapeTypes>;


/**
 * Representation of <clip-path>
 * https://www.w3.org/TR/css-masking-1/#the-clip-path
 *
 * Supports:
 * - <basic-shape>
 * - <geometry-box>
 * - <basic-shape> <geometry-box>
 * - <geometry-box> <basic-shape>
 */
struct CSSClipPath {
  std::optional<CSSBasicShape> shape;
  std::optional<CSSGeometryBox> geometryBox;

  bool operator==(const CSSClipPath &rhs) const
  {
    return shape == rhs.shape && geometryBox == rhs.geometryBox;
  }
};

template <>
struct CSSDataTypeParser<CSSClipPath> {
  static auto consume(CSSValueParser &parser) -> std::optional<CSSClipPath>
  {
    auto shape = parser.parseNextValue<CSSBasicShapeTypes>();

    if (!std::holds_alternative<std::monostate>(shape)) {
      auto geometryBox = parser.parseNextValue<CSSGeometryBox>(CSSDelimiter::Whitespace);

      CSSClipPath result;
      if (std::holds_alternative<CSSInsetShape>(shape)) {
        result.shape = std::get<CSSInsetShape>(shape);
      } else if (std::holds_alternative<CSSCircleShape>(shape)) {
        result.shape = std::get<CSSCircleShape>(shape);
      } else if (std::holds_alternative<CSSEllipseShape>(shape)) {
        result.shape = std::get<CSSEllipseShape>(shape);
      } else if (std::holds_alternative<CSSPolygonShape>(shape)) {
        result.shape = std::get<CSSPolygonShape>(shape);
      } else if (std::holds_alternative<CSSRectShape>(shape)) {
        result.shape = std::get<CSSRectShape>(shape);
      } else if (std::holds_alternative<CSSXywhShape>(shape)) {
        result.shape = std::get<CSSXywhShape>(shape);
      }

      if (std::holds_alternative<CSSGeometryBox>(geometryBox)) {
        result.geometryBox = std::get<CSSGeometryBox>(geometryBox);
      }

      return result;
    }

    auto geometryBox = parser.parseNextValue<CSSGeometryBox>();

    if (!std::holds_alternative<std::monostate>(geometryBox)) {
      auto shapeAfter = parser.parseNextValue<CSSBasicShapeTypes>(CSSDelimiter::Whitespace);

      CSSClipPath result;
      result.geometryBox = std::get<CSSGeometryBox>(geometryBox);

      if (std::holds_alternative<CSSInsetShape>(shapeAfter)) {
        result.shape = std::get<CSSInsetShape>(shapeAfter);
      } else if (std::holds_alternative<CSSCircleShape>(shapeAfter)) {
        result.shape = std::get<CSSCircleShape>(shapeAfter);
      } else if (std::holds_alternative<CSSEllipseShape>(shapeAfter)) {
        result.shape = std::get<CSSEllipseShape>(shapeAfter);
      } else if (std::holds_alternative<CSSPolygonShape>(shapeAfter)) {
        result.shape = std::get<CSSPolygonShape>(shapeAfter);
      } else if (std::holds_alternative<CSSRectShape>(shapeAfter)) {
        result.shape = std::get<CSSRectShape>(shapeAfter);
      } else if (std::holds_alternative<CSSXywhShape>(shapeAfter)) {
        result.shape = std::get<CSSXywhShape>(shapeAfter);
      }

      return result;
    }

    return {};
  }
};

static_assert(CSSDataType<CSSClipPath>);

} // namespace facebook::react
