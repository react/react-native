/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextAttributes.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/utils/FloatComparison.h>
#include <cmath>

#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

void TextAttributes::apply(TextAttributes textAttributes) {
  // Color
  foregroundColor = textAttributes.foregroundColor
      ? textAttributes.foregroundColor
      : foregroundColor;
  backgroundColor = textAttributes.backgroundColor
      ? textAttributes.backgroundColor
      : backgroundColor;
  opacity =
      !std::isnan(textAttributes.opacity) ? textAttributes.opacity : opacity;

  // Font
  fontFamily = !textAttributes.fontFamily.empty() ? textAttributes.fontFamily
                                                  : fontFamily;
  fontSize =
      !std::isnan(textAttributes.fontSize) ? textAttributes.fontSize : fontSize;
  fontSizeMultiplier = !std::isnan(textAttributes.fontSizeMultiplier)
      ? textAttributes.fontSizeMultiplier
      : fontSizeMultiplier;
  fontWeight = textAttributes.fontWeight.has_value() ? textAttributes.fontWeight
                                                     : fontWeight;
  fontStyle = textAttributes.fontStyle.has_value() ? textAttributes.fontStyle
                                                   : fontStyle;
  fontVariant = textAttributes.fontVariant.has_value()
      ? textAttributes.fontVariant
      : fontVariant;
  allowFontScaling = textAttributes.allowFontScaling.has_value()
      ? textAttributes.allowFontScaling
      : allowFontScaling;
  maxFontSizeMultiplier = !std::isnan(textAttributes.maxFontSizeMultiplier)
      ? textAttributes.maxFontSizeMultiplier
      : maxFontSizeMultiplier;
  dynamicTypeRamp = textAttributes.dynamicTypeRamp.has_value()
      ? textAttributes.dynamicTypeRamp
      : dynamicTypeRamp;
  letterSpacing = !std::isnan(textAttributes.letterSpacing)
      ? textAttributes.letterSpacing
      : letterSpacing;
  textTransform = textAttributes.textTransform.has_value()
      ? textAttributes.textTransform
      : textTransform;

  // Paragraph Styles
  lineHeight = !std::isnan(textAttributes.lineHeight)
      ? textAttributes.lineHeight
      : lineHeight;
  alignment = textAttributes.alignment.has_value() ? textAttributes.alignment
                                                   : alignment;
  baseWritingDirection = textAttributes.baseWritingDirection.has_value()
      ? textAttributes.baseWritingDirection
      : baseWritingDirection;
  lineBreakStrategy = textAttributes.lineBreakStrategy.has_value()
      ? textAttributes.lineBreakStrategy
      : lineBreakStrategy;
  lineBreakMode = textAttributes.lineBreakMode.has_value()
      ? textAttributes.lineBreakMode
      : lineBreakMode;

  // Decoration
  textDecorationColor = textAttributes.textDecorationColor
      ? textAttributes.textDecorationColor
      : textDecorationColor;
  textDecorationLineType = textAttributes.textDecorationLineType.has_value()
      ? textAttributes.textDecorationLineType
      : textDecorationLineType;
  textDecorationStyle = textAttributes.textDecorationStyle.has_value()
      ? textAttributes.textDecorationStyle
      : textDecorationStyle;

  // Shadow
  textShadowOffset = textAttributes.textShadowOffset.has_value()
      ? textAttributes.textShadowOffset
      : textShadowOffset;
  textShadowRadius = !std::isnan(textAttributes.textShadowRadius)
      ? textAttributes.textShadowRadius
      : textShadowRadius;
  textShadowColor = textAttributes.textShadowColor
      ? textAttributes.textShadowColor
      : textShadowColor;

  // Special
  isHighlighted = textAttributes.isHighlighted.has_value()
      ? textAttributes.isHighlighted
      : isHighlighted;
  // TextAttributes "inherits" the isPressable value from ancestors, so this
  // only applies the current node's value for isPressable if it is truthy.
  isPressable =
      textAttributes.isPressable.has_value() && *textAttributes.isPressable
      ? textAttributes.isPressable
      : isPressable;
  layoutDirection = textAttributes.layoutDirection.has_value()
      ? textAttributes.layoutDirection
      : layoutDirection;
  accessibilityRole = textAttributes.accessibilityRole.has_value()
      ? textAttributes.accessibilityRole
      : accessibilityRole;
  role = textAttributes.role.has_value() ? textAttributes.role : role;
  textEffects = !textAttributes.textEffects.empty() ? textAttributes.textEffects
                                                    : textEffects;
}

#pragma mark - Operators

bool TextAttributes::operator==(const TextAttributes& rhs) const {
  return std::tie(
             foregroundColor,
             backgroundColor,
             fontFamily,
             fontWeight,
             fontStyle,
             fontVariant,
             allowFontScaling,
             dynamicTypeRamp,
             alignment,
             baseWritingDirection,
             lineBreakStrategy,
             textDecorationColor,
             textDecorationLineType,
             textDecorationStyle,
             textShadowOffset,
             textShadowColor,
             isHighlighted,
             isPressable,
             layoutDirection,
             accessibilityRole,
             role,
             textTransform,
             textEffects) ==
      std::tie(
             rhs.foregroundColor,
             rhs.backgroundColor,
             rhs.fontFamily,
             rhs.fontWeight,
             rhs.fontStyle,
             rhs.fontVariant,
             rhs.allowFontScaling,
             rhs.dynamicTypeRamp,
             rhs.alignment,
             rhs.baseWritingDirection,
             rhs.lineBreakStrategy,
             rhs.textDecorationColor,
             rhs.textDecorationLineType,
             rhs.textDecorationStyle,
             rhs.textShadowOffset,
             rhs.textShadowColor,
             rhs.isHighlighted,
             rhs.isPressable,
             rhs.layoutDirection,
             rhs.accessibilityRole,
             rhs.role,
             rhs.textTransform,
             rhs.textEffects) &&
      floatEquality(maxFontSizeMultiplier, rhs.maxFontSizeMultiplier) &&
      floatEquality(opacity, rhs.opacity) &&
      floatEquality(fontSize, rhs.fontSize) &&
      floatEquality(fontSizeMultiplier, rhs.fontSizeMultiplier) &&
      floatEquality(letterSpacing, rhs.letterSpacing) &&
      floatEquality(lineHeight, rhs.lineHeight) &&
      floatEquality(textShadowRadius, rhs.textShadowRadius);
}

TextAttributes TextAttributes::defaultTextAttributes() {
  static auto textAttributes = [] {
    auto defaultAttrs = TextAttributes{};
    // Non-obvious (can be different among platforms) default text attributes.
    defaultAttrs.foregroundColor = blackColor();
    defaultAttrs.backgroundColor = clearColor();
    defaultAttrs.fontSize = 14.0;
    defaultAttrs.fontSizeMultiplier = 1.0;
    return defaultAttrs;
  }();
  return textAttributes;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList TextAttributes::getDebugProps() const {
  const auto& textAttributes = TextAttributes::defaultTextAttributes();
  return {
      // Color
      debugStringConvertibleItem(
          "backgroundColor", backgroundColor, textAttributes.backgroundColor),
      debugStringConvertibleItem(
          "foregroundColor", foregroundColor, textAttributes.foregroundColor),
      debugStringConvertibleItem("opacity", opacity, textAttributes.opacity),

      // Font
      debugStringConvertibleItem(
          "fontFamily", fontFamily, textAttributes.fontFamily),
      debugStringConvertibleItem("fontSize", fontSize, textAttributes.fontSize),
      debugStringConvertibleItem(
          "fontSizeMultiplier",
          fontSizeMultiplier,
          textAttributes.fontSizeMultiplier),
      debugStringConvertibleItem(
          "fontWeight", fontWeight, textAttributes.fontWeight),
      debugStringConvertibleItem(
          "fontStyle", fontStyle, textAttributes.fontStyle),
      debugStringConvertibleItem(
          "fontVariant", fontVariant, textAttributes.fontVariant),
      debugStringConvertibleItem(
          "allowFontScaling",
          allowFontScaling,
          textAttributes.allowFontScaling),
      debugStringConvertibleItem(
          "maxFontSizeMultiplier",
          maxFontSizeMultiplier,
          textAttributes.maxFontSizeMultiplier),
      debugStringConvertibleItem(
          "dynamicTypeRamp", dynamicTypeRamp, textAttributes.dynamicTypeRamp),
      debugStringConvertibleItem(
          "letterSpacing", letterSpacing, textAttributes.letterSpacing),

      // Paragraph Styles
      debugStringConvertibleItem(
          "lineHeight", lineHeight, textAttributes.lineHeight),
      debugStringConvertibleItem(
          "alignment", alignment, textAttributes.alignment),
      debugStringConvertibleItem(
          "writingDirection",
          baseWritingDirection,
          textAttributes.baseWritingDirection),
      debugStringConvertibleItem(
          "lineBreakStrategyIOS",
          lineBreakStrategy,
          textAttributes.lineBreakStrategy),
      debugStringConvertibleItem(
          "lineBreakModeIOS", lineBreakMode, textAttributes.lineBreakMode),

      // Decoration
      debugStringConvertibleItem(
          "textDecorationColor",
          textDecorationColor,
          textAttributes.textDecorationColor),
      debugStringConvertibleItem(
          "textDecorationLineType",
          textDecorationLineType,
          textAttributes.textDecorationLineType),
      debugStringConvertibleItem(
          "textDecorationStyle",
          textDecorationStyle,
          textAttributes.textDecorationStyle),

      // Shadow
      debugStringConvertibleItem(
          "textShadowOffset",
          textShadowOffset,
          textAttributes.textShadowOffset),
      debugStringConvertibleItem(
          "textShadowRadius",
          textShadowRadius,
          textAttributes.textShadowRadius),
      debugStringConvertibleItem(
          "textShadowColor", textShadowColor, textAttributes.textShadowColor),

      // Special
      debugStringConvertibleItem(
          "isHighlighted", isHighlighted, textAttributes.isHighlighted),
      debugStringConvertibleItem(
          "isPressable", isPressable, textAttributes.isPressable),
      debugStringConvertibleItem(
          "layoutDirection", layoutDirection, textAttributes.layoutDirection),
      debugStringConvertibleItem(
          "accessibilityRole",
          accessibilityRole,
          textAttributes.accessibilityRole),
      debugStringConvertibleItem("role", role, textAttributes.role),
  };
}
#endif

} // namespace facebook::react
