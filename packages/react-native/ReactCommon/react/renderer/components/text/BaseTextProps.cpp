/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextProps.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/DebugStringConvertibleItem.h>
#include <react/utils/FloatComparison.h>

namespace facebook::react {

static TextAttributes convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const TextAttributes& sourceTextAttributes,
    const TextAttributes& defaultTextAttributes) {
  auto textAttributes = TextAttributes{};

  // Color (not accessed by ViewProps)
  textAttributes.foregroundColor = convertRawProp(
      context,
      rawProps,
      "color",
      sourceTextAttributes.foregroundColor,
      defaultTextAttributes.foregroundColor);

  // Font
  textAttributes.fontFamily = convertRawProp(
      context,
      rawProps,
      "fontFamily",
      sourceTextAttributes.fontFamily,
      defaultTextAttributes.fontFamily);
  textAttributes.fontSize = convertRawProp(
      context,
      rawProps,
      "fontSize",
      sourceTextAttributes.fontSize,
      defaultTextAttributes.fontSize);
  textAttributes.fontSizeMultiplier = convertRawProp(
      context,
      rawProps,
      "fontSizeMultiplier",
      sourceTextAttributes.fontSizeMultiplier,
      defaultTextAttributes.fontSizeMultiplier);
  textAttributes.fontWeight = convertRawProp(
      context,
      rawProps,
      "fontWeight",
      sourceTextAttributes.fontWeight,
      defaultTextAttributes.fontWeight);
  textAttributes.fontStyle = convertRawProp(
      context,
      rawProps,
      "fontStyle",
      sourceTextAttributes.fontStyle,
      defaultTextAttributes.fontStyle);
  textAttributes.fontVariant = convertRawProp(
      context,
      rawProps,
      "fontVariant",
      sourceTextAttributes.fontVariant,
      defaultTextAttributes.fontVariant);
  textAttributes.allowFontScaling = convertRawProp(
      context,
      rawProps,
      "allowFontScaling",
      sourceTextAttributes.allowFontScaling,
      defaultTextAttributes.allowFontScaling);
  textAttributes.maxFontSizeMultiplier = convertRawProp(
      context,
      rawProps,
      "maxFontSizeMultiplier",
      sourceTextAttributes.maxFontSizeMultiplier,
      defaultTextAttributes.maxFontSizeMultiplier);
  textAttributes.dynamicTypeRamp = convertRawProp(
      context,
      rawProps,
      "dynamicTypeRamp",
      sourceTextAttributes.dynamicTypeRamp,
      defaultTextAttributes.dynamicTypeRamp);
  textAttributes.letterSpacing = convertRawProp(
      context,
      rawProps,
      "letterSpacing",
      sourceTextAttributes.letterSpacing,
      defaultTextAttributes.letterSpacing);
  textAttributes.textTransform = convertRawProp(
      context,
      rawProps,
      "textTransform",
      sourceTextAttributes.textTransform,
      defaultTextAttributes.textTransform);

  // Paragraph
  textAttributes.lineHeight = convertRawProp(
      context,
      rawProps,
      "lineHeight",
      sourceTextAttributes.lineHeight,
      defaultTextAttributes.lineHeight);
  textAttributes.alignment = convertRawProp(
      context,
      rawProps,
      "textAlign",
      sourceTextAttributes.alignment,
      defaultTextAttributes.alignment);
  textAttributes.baseWritingDirection = convertRawProp(
      context,
      rawProps,
      "writingDirection",
      sourceTextAttributes.baseWritingDirection,
      defaultTextAttributes.baseWritingDirection);
  textAttributes.lineBreakStrategy = convertRawProp(
      context,
      rawProps,
      "lineBreakStrategyIOS",
      sourceTextAttributes.lineBreakStrategy,
      defaultTextAttributes.lineBreakStrategy);
  textAttributes.lineBreakMode = convertRawProp(
      context,
      rawProps,
      "lineBreakModeIOS",
      sourceTextAttributes.lineBreakMode,
      defaultTextAttributes.lineBreakMode);

  // Decoration
  textAttributes.textDecorationColor = convertRawProp(
      context,
      rawProps,
      "textDecorationColor",
      sourceTextAttributes.textDecorationColor,
      defaultTextAttributes.textDecorationColor);
  textAttributes.textDecorationLineType = convertRawProp(
      context,
      rawProps,
      "textDecorationLine",
      sourceTextAttributes.textDecorationLineType,
      defaultTextAttributes.textDecorationLineType);
  textAttributes.textDecorationStyle = convertRawProp(
      context,
      rawProps,
      "textDecorationStyle",
      sourceTextAttributes.textDecorationStyle,
      defaultTextAttributes.textDecorationStyle);

  // Shadow
  textAttributes.textShadowOffset = convertRawProp(
      context,
      rawProps,
      "textShadowOffset",
      sourceTextAttributes.textShadowOffset,
      defaultTextAttributes.textShadowOffset);
  textAttributes.textShadowRadius = convertRawProp(
      context,
      rawProps,
      "textShadowRadius",
      sourceTextAttributes.textShadowRadius,
      defaultTextAttributes.textShadowRadius);
  textAttributes.textShadowColor = convertRawProp(
      context,
      rawProps,
      "textShadowColor",
      sourceTextAttributes.textShadowColor,
      defaultTextAttributes.textShadowColor);

  // Special
  textAttributes.isHighlighted = convertRawProp(
      context,
      rawProps,
      "isHighlighted",
      sourceTextAttributes.isHighlighted,
      defaultTextAttributes.isHighlighted);
  textAttributes.isPressable = convertRawProp(
      context,
      rawProps,
      "isPressable",
      sourceTextAttributes.isPressable,
      defaultTextAttributes.isPressable);

  // In general, we want this class to access props in the same order
  // that ViewProps accesses them in, so that RawPropParser can optimize
  // accesses. This is both theoretical, and ParagraphProps takes advantage
  // of this.
  // In particular: accessibilityRole, opacity, and backgroundColor also
  // are parsed first by ViewProps (and indirectly AccessibilityProps).
  // However, since RawPropsParser will always store these props /before/
  // the unique BaseTextProps props, it is most efficient to parse these, in
  // order, /after/ all of the other BaseTextProps, so that the RawPropsParser
  // index rolls over only once instead of twice.
  textAttributes.accessibilityRole = convertRawProp(
      context,
      rawProps,
      "accessibilityRole",
      sourceTextAttributes.accessibilityRole,
      defaultTextAttributes.accessibilityRole);

  textAttributes.role = convertRawProp(
      context,
      rawProps,
      "role",
      sourceTextAttributes.role,
      defaultTextAttributes.role);

  // Color (accessed in this order by ViewProps)
  textAttributes.opacity = convertRawProp(
      context,
      rawProps,
      "opacity",
      sourceTextAttributes.opacity,
      defaultTextAttributes.opacity);
  textAttributes.backgroundColor = convertRawProp(
      context,
      rawProps,
      "backgroundColor",
      sourceTextAttributes.backgroundColor,
      defaultTextAttributes.backgroundColor);

  return textAttributes;
}

BaseTextProps::BaseTextProps(
    const PropsParserContext& context,
    const BaseTextProps& sourceProps,
    const RawProps& rawProps)
    : textAttributes(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.textAttributes
              : convertRawProp(
                    context,
                    rawProps,
                    sourceProps.textAttributes,
                    TextAttributes{})) {};

void BaseTextProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* /*propName*/,
    const RawValue& value) {
  static auto defaults = TextAttributes{};

  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, foregroundColor, "color");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontFamily, "fontFamily");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontSize, "fontSize");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        fontSizeMultiplier,
        "fontSizeMultiplier");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontWeight, "fontWeight");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontStyle, "fontStyle");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, fontVariant, "fontVariant");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, allowFontScaling, "allowFontScaling");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        maxFontSizeMultiplier,
        "maxFontSizeMultiplier");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, letterSpacing, "letterSpacing");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, textTransform, "textTransform");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, lineHeight, "lineHeight");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, alignment, "textAlign");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        baseWritingDirection,
        "baseWritingDirection");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        lineBreakStrategy,
        "lineBreakStrategyIOS");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, lineBreakMode, "lineBreakModeIOS");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        textDecorationColor,
        "textDecorationColor");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        textDecorationLineType,
        "textDecorationLine");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        textDecorationStyle,
        "textDecorationStyle");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, textShadowOffset, "textShadowOffset");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, textShadowRadius, "textShadowRadius");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, textShadowColor, "textShadowColor");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, isHighlighted, "isHighlighted");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, isPressable, "isPressable");
    REBUILD_FIELD_SWITCH_CASE(
        defaults,
        value,
        textAttributes,
        accessibilityRole,
        "accessibilityRole");
    REBUILD_FIELD_SWITCH_CASE(defaults, value, textAttributes, role, "role");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, opacity, "opacity");
    REBUILD_FIELD_SWITCH_CASE(
        defaults, value, textAttributes, backgroundColor, "backgroundColor");
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList BaseTextProps::getDebugProps() const {
  return textAttributes.getDebugProps();
}
#endif

#ifdef RN_SERIALIZABLE_STATE

static folly::dynamic toDynamic(const Size& size) {
  folly::dynamic sizeResult = folly::dynamic::object();
  sizeResult["width"] = size.width;
  sizeResult["height"] = size.height;
  return sizeResult;
}

void BaseTextProps::appendTextAttributesProps(
    folly::dynamic& result,
    const BaseTextProps* oldProps) const {
  if (textAttributes.foregroundColor !=
      oldProps->textAttributes.foregroundColor) {
    result["color"] = *textAttributes.foregroundColor;
  }

  if (textAttributes.fontFamily != oldProps->textAttributes.fontFamily) {
    result["fontFamily"] = textAttributes.fontFamily;
  }

  if (!floatEquality(
          textAttributes.fontSize, oldProps->textAttributes.fontSize)) {
    result["fontSize"] = textAttributes.fontSize;
  }

  if (!floatEquality(
          textAttributes.fontSizeMultiplier,
          oldProps->textAttributes.fontSizeMultiplier)) {
    result["fontSizeMultiplier"] = textAttributes.fontSizeMultiplier;
  }

  if (textAttributes.fontWeight != oldProps->textAttributes.fontWeight) {
    result["fontWeight"] = textAttributes.fontWeight.has_value()
        ? toString(textAttributes.fontWeight.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.fontStyle != oldProps->textAttributes.fontStyle) {
    result["fontStyle"] = textAttributes.fontStyle.has_value()
        ? toString(textAttributes.fontStyle.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.fontVariant != oldProps->textAttributes.fontVariant) {
    result["fontVariant"] = textAttributes.fontVariant.has_value()
        ? toString(textAttributes.fontVariant.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.allowFontScaling !=
      oldProps->textAttributes.allowFontScaling) {
    result["allowFontScaling"] = textAttributes.allowFontScaling.has_value()
        ? textAttributes.allowFontScaling.value()
        : folly::dynamic(nullptr);
  }

  if (!floatEquality(
          textAttributes.maxFontSizeMultiplier,
          oldProps->textAttributes.maxFontSizeMultiplier)) {
    result["maxFontSizeMultiplier"] = textAttributes.maxFontSizeMultiplier;
  }

  if (textAttributes.dynamicTypeRamp !=
      oldProps->textAttributes.dynamicTypeRamp) {
    result["dynamicTypeRamp"] = textAttributes.dynamicTypeRamp.has_value()
        ? toString(textAttributes.dynamicTypeRamp.value())
        : folly::dynamic(nullptr);
  }

  if (!floatEquality(
          textAttributes.letterSpacing,
          oldProps->textAttributes.letterSpacing)) {
    result["letterSpacing"] = textAttributes.letterSpacing;
  }

  if (textAttributes.textTransform != oldProps->textAttributes.textTransform) {
    result["textTransform"] = textAttributes.textTransform.has_value()
        ? toString(textAttributes.textTransform.value())
        : folly::dynamic(nullptr);
  }

  if (!floatEquality(
          textAttributes.lineHeight, oldProps->textAttributes.lineHeight)) {
    result["lineHeight"] = textAttributes.lineHeight;
  }

  if (textAttributes.alignment != oldProps->textAttributes.alignment) {
    result["textAlign"] = textAttributes.alignment.has_value()
        ? toString(textAttributes.alignment.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.baseWritingDirection !=
      oldProps->textAttributes.baseWritingDirection) {
    result["baseWritingDirection"] =
        textAttributes.baseWritingDirection.has_value()
        ? toString(textAttributes.baseWritingDirection.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.lineBreakStrategy !=
      oldProps->textAttributes.lineBreakStrategy) {
    result["lineBreakStrategyIOS"] =
        textAttributes.lineBreakStrategy.has_value()
        ? toString(textAttributes.lineBreakStrategy.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.lineBreakMode != oldProps->textAttributes.lineBreakMode) {
    result["lineBreakModeIOS"] = textAttributes.lineBreakMode.has_value()
        ? toString(textAttributes.lineBreakMode.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.textDecorationColor !=
      oldProps->textAttributes.textDecorationColor) {
    result["textDecorationColor"] = *textAttributes.textDecorationColor;
  }

  if (textAttributes.textDecorationLineType !=
      oldProps->textAttributes.textDecorationLineType) {
    result["textDecorationLine"] =
        textAttributes.textDecorationLineType.has_value()
        ? toString(textAttributes.textDecorationLineType.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.textDecorationStyle !=
      oldProps->textAttributes.textDecorationStyle) {
    result["textDecorationStyle"] =
        textAttributes.textDecorationStyle.has_value()
        ? toString(textAttributes.textDecorationStyle.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.textShadowOffset !=
      oldProps->textAttributes.textShadowOffset) {
    result["textShadowOffset"] = textAttributes.textShadowOffset.has_value()
        ? toDynamic(textAttributes.textShadowOffset.value())
        : folly::dynamic(nullptr);
  }

  if (!floatEquality(
          textAttributes.textShadowRadius,
          oldProps->textAttributes.textShadowRadius)) {
    result["textShadowRadius"] = textAttributes.textShadowRadius;
  }

  if (textAttributes.textShadowColor !=
      oldProps->textAttributes.textShadowColor) {
    result["textShadowColor"] = *textAttributes.textShadowColor;
  }

  if (textAttributes.isHighlighted != oldProps->textAttributes.isHighlighted) {
    result["isHighlighted"] = textAttributes.isHighlighted.has_value()
        ? textAttributes.isHighlighted.value()
        : folly::dynamic(nullptr);
  }

  if (textAttributes.isPressable != oldProps->textAttributes.isPressable) {
    result["isPressable"] = textAttributes.isPressable.has_value()
        ? textAttributes.isPressable.value()
        : folly::dynamic(nullptr);
  }

  if (textAttributes.accessibilityRole !=
      oldProps->textAttributes.accessibilityRole) {
    result["accessibilityRole"] = textAttributes.accessibilityRole.has_value()
        ? toString(textAttributes.accessibilityRole.value())
        : folly::dynamic(nullptr);
  }

  if (textAttributes.role != oldProps->textAttributes.role) {
    result["role"] = textAttributes.role.has_value()
        ? toString(textAttributes.role.value())
        : folly::dynamic(nullptr);
  }

  if (!floatEquality(
          textAttributes.opacity, oldProps->textAttributes.opacity)) {
    result["opacity"] = textAttributes.opacity;
  }

  if (textAttributes.backgroundColor !=
      oldProps->textAttributes.backgroundColor) {
    result["backgroundColor"] = *textAttributes.backgroundColor;
  }
}

#endif
} // namespace facebook::react
