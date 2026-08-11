/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>

namespace facebook::react {

inline SharedColor fromCSSColor(const CSSColor& cssColor) {
  return hostPlatformColorFromRGBA(
      cssColor.r, cssColor.g, cssColor.b, cssColor.a);
}

inline std::optional<Float> coerceAmount(const RawValue& value) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }

  if (value.hasType<std::string>()) {
    auto cssVal =
        parseCSSProperty<CSSNumber, CSSPercentage>((std::string)value);
    if (std::holds_alternative<CSSNumber>(cssVal)) {
      return std::get<CSSNumber>(cssVal).value;
    } else if (std::holds_alternative<CSSPercentage>(cssVal)) {
      return std::get<CSSPercentage>(cssVal).value / 100.0f;
    }
  }
  return {};
}

inline std::optional<Float> coerceAngle(const RawValue& value) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }

  if (value.hasType<std::string>()) {
    auto cssVal = parseCSSProperty<CSSAngle>((std::string)value);
    if (std::holds_alternative<CSSAngle>(cssVal)) {
      return std::get<CSSAngle>(cssVal).degrees;
    }
  }
  return {};
}

inline SharedColor coerceColor(
    const RawValue& value,
    const PropsParserContext& context) {
  if (value.hasType<std::string>()) {
    auto cssColor = parseCSSProperty<CSSColor>((std::string)value);
    if (!std::holds_alternative<CSSColor>(cssColor)) {
      return {};
    }
    return fromCSSColor(std::get<CSSColor>(cssColor));
  }

  SharedColor color;
  fromRawValue(context.contextContainer, context.surfaceId, value, color);
  return color;
}

inline std::optional<Float> coerceLength(const RawValue& value) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }

  if (value.hasType<std::string>()) {
    auto len = parseCSSProperty<CSSLength>((std::string)value);
    if (!std::holds_alternative<CSSLength>(len)) {
      return {};
    }

    auto cssLen = std::get<CSSLength>(len);
    if (cssLen.unit != CSSLengthUnit::Px) {
      return {};
    }

    return cssLen.value;
  }
  return {};
}

} // namespace facebook::react
