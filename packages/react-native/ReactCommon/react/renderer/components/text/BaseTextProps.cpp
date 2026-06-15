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

// Behavior-preserving helpers extracted from appendTextAttributesProps below to
// keep its cyclomatic complexity low. Each mirrors one of the recurring
// compare-and-assign shapes used per text attribute, so the serialized output
// (keys, values, and insertion order) is identical to the open-coded version.
template <typename T>
static void appendIfChanged(
    folly::dynamic& result,
    const char* propName,
    const T& newValue,
    const T& oldValue) {
  if (newValue != oldValue) {
    result[propName] = newValue;
  }
}

template <typename T>
static void appendDerefIfChanged(
    folly::dynamic& result,
    const char* propName,
    const T& newValue,
    const T& oldValue) {
  if (newValue != oldValue) {
    result[propName] = *newValue;
  }
}

static void appendFloatIfChanged(
    folly::dynamic& result,
    const char* propName,
    Float newValue,
    Float oldValue) {
  if (!floatEquality(newValue, oldValue)) {
    result[propName] = newValue;
  }
}

template <typename T, typename Convert>
static void appendOptionalIfChanged(
    folly::dynamic& result,
    const char* propName,
    const std::optional<T>& newValue,
    const std::optional<T>& oldValue,
    Convert&& convert) {
  if (newValue != oldValue) {
    result[propName] = newValue.has_value()
        ? folly::dynamic(convert(newValue.value()))
        : folly::dynamic(nullptr);
  }
}

void BaseTextProps::appendTextAttributesProps(
    folly::dynamic& result,
    const BaseTextProps* oldProps) const {
  auto asString = [](const auto& value) { return toString(value); };
  auto asIs = [](const auto& value) { return value; };
  auto asDynamic = [](const auto& value) { return toDynamic(value); };

  appendDerefIfChanged(
      result,
      "color",
      textAttributes.foregroundColor,
      oldProps->textAttributes.foregroundColor);
  appendIfChanged(
      result,
      "fontFamily",
      textAttributes.fontFamily,
      oldProps->textAttributes.fontFamily);
  appendFloatIfChanged(
      result,
      "fontSize",
      textAttributes.fontSize,
      oldProps->textAttributes.fontSize);
  appendFloatIfChanged(
      result,
      "fontSizeMultiplier",
      textAttributes.fontSizeMultiplier,
      oldProps->textAttributes.fontSizeMultiplier);
  appendOptionalIfChanged(
      result,
      "fontWeight",
      textAttributes.fontWeight,
      oldProps->textAttributes.fontWeight,
      asString);
  appendOptionalIfChanged(
      result,
      "fontStyle",
      textAttributes.fontStyle,
      oldProps->textAttributes.fontStyle,
      asString);
  appendOptionalIfChanged(
      result,
      "fontVariant",
      textAttributes.fontVariant,
      oldProps->textAttributes.fontVariant,
      asString);
  appendOptionalIfChanged(
      result,
      "allowFontScaling",
      textAttributes.allowFontScaling,
      oldProps->textAttributes.allowFontScaling,
      asIs);
  appendFloatIfChanged(
      result,
      "maxFontSizeMultiplier",
      textAttributes.maxFontSizeMultiplier,
      oldProps->textAttributes.maxFontSizeMultiplier);
  appendOptionalIfChanged(
      result,
      "dynamicTypeRamp",
      textAttributes.dynamicTypeRamp,
      oldProps->textAttributes.dynamicTypeRamp,
      asString);
  appendFloatIfChanged(
      result,
      "letterSpacing",
      textAttributes.letterSpacing,
      oldProps->textAttributes.letterSpacing);
  appendOptionalIfChanged(
      result,
      "textTransform",
      textAttributes.textTransform,
      oldProps->textAttributes.textTransform,
      asString);
  appendFloatIfChanged(
      result,
      "lineHeight",
      textAttributes.lineHeight,
      oldProps->textAttributes.lineHeight);
  appendOptionalIfChanged(
      result,
      "textAlign",
      textAttributes.alignment,
      oldProps->textAttributes.alignment,
      asString);
  appendOptionalIfChanged(
      result,
      "baseWritingDirection",
      textAttributes.baseWritingDirection,
      oldProps->textAttributes.baseWritingDirection,
      asString);
  appendOptionalIfChanged(
      result,
      "lineBreakStrategyIOS",
      textAttributes.lineBreakStrategy,
      oldProps->textAttributes.lineBreakStrategy,
      asString);
  appendOptionalIfChanged(
      result,
      "lineBreakModeIOS",
      textAttributes.lineBreakMode,
      oldProps->textAttributes.lineBreakMode,
      asString);
  appendDerefIfChanged(
      result,
      "textDecorationColor",
      textAttributes.textDecorationColor,
      oldProps->textAttributes.textDecorationColor);
  appendOptionalIfChanged(
      result,
      "textDecorationLine",
      textAttributes.textDecorationLineType,
      oldProps->textAttributes.textDecorationLineType,
      asString);
  appendOptionalIfChanged(
      result,
      "textDecorationStyle",
      textAttributes.textDecorationStyle,
      oldProps->textAttributes.textDecorationStyle,
      asString);
  appendOptionalIfChanged(
      result,
      "textShadowOffset",
      textAttributes.textShadowOffset,
      oldProps->textAttributes.textShadowOffset,
      asDynamic);
  appendFloatIfChanged(
      result,
      "textShadowRadius",
      textAttributes.textShadowRadius,
      oldProps->textAttributes.textShadowRadius);
  appendDerefIfChanged(
      result,
      "textShadowColor",
      textAttributes.textShadowColor,
      oldProps->textAttributes.textShadowColor);
  appendOptionalIfChanged(
      result,
      "isHighlighted",
      textAttributes.isHighlighted,
      oldProps->textAttributes.isHighlighted,
      asIs);
  appendOptionalIfChanged(
      result,
      "isPressable",
      textAttributes.isPressable,
      oldProps->textAttributes.isPressable,
      asIs);
  appendOptionalIfChanged(
      result,
      "accessibilityRole",
      textAttributes.accessibilityRole,
      oldProps->textAttributes.accessibilityRole,
      asString);
  appendOptionalIfChanged(
      result,
      "role",
      textAttributes.role,
      oldProps->textAttributes.role,
      asString);
  appendFloatIfChanged(
      result,
      "opacity",
      textAttributes.opacity,
      oldProps->textAttributes.opacity);
  appendDerefIfChanged(
      result,
      "backgroundColor",
      textAttributes.backgroundColor,
      oldProps->textAttributes.backgroundColor);
}

#endif
} // namespace facebook::react
