/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CSSConversions.h"

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

SharedColor coerceColor(
    const RawValue& value,
    const PropsParserContext& context) {
  if (value.hasType<std::string>()) {
    auto cssColor = parseCSSProperty<CSSColor>((std::string)value);
    if (!std::holds_alternative<CSSColor>(cssColor)) {
      return {};
    }

    const auto& color = std::get<CSSColor>(cssColor);
    return colorFromRGBA(color.r, color.g, color.b, color.a);
  }

  SharedColor color;
  fromRawValue(context.contextContainer, context.surfaceId, value, color);
  return color;
}

std::optional<Float> coerceLength(const RawValue& value) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }

  if (value.hasType<std::string>()) {
    auto length = parseCSSProperty<CSSLength>((std::string)value);
    if (!std::holds_alternative<CSSLength>(length)) {
      return {};
    }

    auto cssLength = std::get<CSSLength>(length);
    if (cssLength.unit != CSSLengthUnit::Px) {
      return {};
    }

    return cssLength.value;
  }

  return {};
}

} // namespace facebook::react
