/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputProps.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/components/textinput/baseConversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/utils/FloatComparison.h>

namespace facebook::react {

static bool
hasValue(const RawProps& rawProps, bool defaultValue, const char* name) {
  auto rawValue = rawProps.at(name);

  // No change to prop - use default
  if (rawValue == nullptr) {
    return defaultValue;
  }

  // Value passed from JS
  if (rawValue->hasValue()) {
    return true;
  }

  // Null/undefined passed in, indicating that we should use the default
  // platform value - thereby resetting this
  return false;
}

AndroidTextInputProps::AndroidTextInputProps(
    const PropsParserContext &context,
    const AndroidTextInputProps &sourceProps,
    const RawProps &rawProps)
    : BaseTextInputProps(context, sourceProps, rawProps),
      autoComplete(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.autoComplete : convertRawProp(
          context,
          rawProps,
          "autoComplete",
          sourceProps.autoComplete,
          {})),
      returnKeyLabel(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.autoComplete : convertRawProp(context, rawProps,
          "returnKeyLabel",
          sourceProps.returnKeyLabel,
          {})),
      numberOfLines(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.numberOfLines : convertRawProp(context, rawProps,
          "numberOfLines",
          sourceProps.numberOfLines,
          {0})),
      disableFullscreenUI(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.disableFullscreenUI : convertRawProp(context, rawProps,
          "disableFullscreenUI",
          sourceProps.disableFullscreenUI,
          {false})),
      textBreakStrategy(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.textBreakStrategy : convertRawProp(context, rawProps,
          "textBreakStrategy",
          sourceProps.textBreakStrategy,
          {})),
      inlineImageLeft(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.inlineImageLeft : convertRawProp(context, rawProps,
          "inlineImageLeft",
          sourceProps.inlineImageLeft,
          {})),
      inlineImagePadding(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.inlineImagePadding : convertRawProp(context, rawProps,
          "inlineImagePadding",
          sourceProps.inlineImagePadding,
          {0})),
      importantForAutofill(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.importantForAutofill : convertRawProp(context, rawProps,
          "importantForAutofill",
          sourceProps.importantForAutofill,
          {})),
      showSoftInputOnFocus(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.showSoftInputOnFocus : convertRawProp(context, rawProps,
          "showSoftInputOnFocus",
          sourceProps.showSoftInputOnFocus,
          {false})),
      autoCorrect(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.autoCorrect : convertRawProp(context, rawProps,
          "autoCorrect",
          sourceProps.autoCorrect,
          {false})),
      allowFontScaling(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.allowFontScaling : convertRawProp(context, rawProps,
          "allowFontScaling",
          sourceProps.allowFontScaling,
          {false})),
      maxFontSizeMultiplier(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.maxFontSizeMultiplier : convertRawProp(context, rawProps,
          "maxFontSizeMultiplier",
          sourceProps.maxFontSizeMultiplier,
          {0.0})),
      keyboardType(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.keyboardType : convertRawProp(context, rawProps,
          "keyboardType",
          sourceProps.keyboardType,
          {})),
      returnKeyType(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.returnKeyType : convertRawProp(context, rawProps,
          "returnKeyType",
          sourceProps.returnKeyType,
          {})),
      secureTextEntry(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.secureTextEntry : convertRawProp(context, rawProps,
          "secureTextEntry",
          sourceProps.secureTextEntry,
          {false})),
      value(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.value : convertRawProp(context, rawProps, "value", sourceProps.value, {})),
      selectTextOnFocus(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.selectTextOnFocus : convertRawProp(context, rawProps,
          "selectTextOnFocus",
          sourceProps.selectTextOnFocus,
          {false})),
      caretHidden(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.caretHidden : convertRawProp(context, rawProps,
          "caretHidden",
          sourceProps.caretHidden,
          {false})),
      contextMenuHidden(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.contextMenuHidden : convertRawProp(context, rawProps,
          "contextMenuHidden",
          sourceProps.contextMenuHidden,
          {false})),
      textShadowColor(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.textShadowColor : convertRawProp(context, rawProps,
          "textShadowColor",
          sourceProps.textShadowColor,
          {})),
      textShadowRadius(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.textShadowRadius : convertRawProp(context, rawProps,
          "textShadowRadius",
          sourceProps.textShadowRadius,
          {0.0})),
      textDecorationLine(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.textDecorationLine : convertRawProp(context, rawProps,
          "textDecorationLine",
          sourceProps.textDecorationLine,
          {})),
      fontStyle(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.fontStyle :
          convertRawProp(context, rawProps, "fontStyle", sourceProps.fontStyle, {})),
      textShadowOffset(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.textShadowOffset : convertRawProp(context, rawProps,
          "textShadowOffset",
          sourceProps.textShadowOffset,
          {})),
      lineHeight(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.lineHeight : convertRawProp(context, rawProps,
          "lineHeight",
          sourceProps.lineHeight,
          {0.0})),
      textTransform(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.textTransform : convertRawProp(context, rawProps,
          "textTransform",
          sourceProps.textTransform,
          {})),
      color(0 /*convertRawProp(context, rawProps, "color", sourceProps.color, {0})*/),
      letterSpacing(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.letterSpacing : convertRawProp(context, rawProps,
          "letterSpacing",
          sourceProps.letterSpacing,
          {0.0})),
      fontSize(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.fontSize :
          convertRawProp(context, rawProps, "fontSize", sourceProps.fontSize, {0.0})),
      textAlign(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.textAlign :
          convertRawProp(context, rawProps, "textAlign", sourceProps.textAlign, {})),
      includeFontPadding(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.includeFontPadding : convertRawProp(context, rawProps,
          "includeFontPadding",
          sourceProps.includeFontPadding,
          {false})),
      fontWeight(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.fontWeight :
          convertRawProp(context, rawProps, "fontWeight", sourceProps.fontWeight, {})),
      fontFamily(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.fontFamily :
          convertRawProp(context, rawProps, "fontFamily", sourceProps.fontFamily, {})),
      // See AndroidTextInputComponentDescriptor for usage
      // TODO T63008435: can these, and this feature, be removed entirely?
      hasPadding(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPadding : hasValue(rawProps, sourceProps.hasPadding, "padding")),
      hasPaddingHorizontal(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPaddingHorizontal : hasValue(
          rawProps,
          sourceProps.hasPaddingHorizontal,
          "paddingHorizontal")),
      hasPaddingVertical(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPaddingVertical : hasValue(
          rawProps,
          sourceProps.hasPaddingVertical,
          "paddingVertical")),
      hasPaddingLeft(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPaddingLeft : hasValue(
          rawProps,
          sourceProps.hasPaddingLeft,
          "paddingLeft")),
      hasPaddingTop(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPaddingTop :
          hasValue(rawProps, sourceProps.hasPaddingTop, "paddingTop")),
      hasPaddingRight(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPaddingRight : hasValue(
          rawProps,
          sourceProps.hasPaddingRight,
          "paddingRight")),
      hasPaddingBottom(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPaddingBottom : hasValue(
          rawProps,
          sourceProps.hasPaddingBottom,
          "paddingBottom")),
      hasPaddingStart(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPaddingStart : hasValue(
          rawProps,
          sourceProps.hasPaddingStart,
          "paddingStart")),
      hasPaddingEnd(ReactNativeFeatureFlags::enableCppPropsIteratorSetter()? sourceProps.hasPaddingEnd :
          hasValue(rawProps, sourceProps.hasPaddingEnd, "paddingEnd")) {
}

void AndroidTextInputProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  BaseTextInputProps::setProp(context, hash, propName, value);

  static auto defaults = AndroidTextInputProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoComplete);
    RAW_SET_PROP_SWITCH_CASE_BASIC(returnKeyLabel);
    RAW_SET_PROP_SWITCH_CASE_BASIC(numberOfLines);
    RAW_SET_PROP_SWITCH_CASE_BASIC(disableFullscreenUI);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textBreakStrategy);
    RAW_SET_PROP_SWITCH_CASE_BASIC(inlineImageLeft);
    RAW_SET_PROP_SWITCH_CASE_BASIC(inlineImagePadding);
    RAW_SET_PROP_SWITCH_CASE_BASIC(importantForAutofill);
    RAW_SET_PROP_SWITCH_CASE_BASIC(showSoftInputOnFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoCorrect);
    RAW_SET_PROP_SWITCH_CASE_BASIC(allowFontScaling);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maxFontSizeMultiplier);
    RAW_SET_PROP_SWITCH_CASE_BASIC(keyboardType);
    RAW_SET_PROP_SWITCH_CASE_BASIC(returnKeyType);
    RAW_SET_PROP_SWITCH_CASE_BASIC(secureTextEntry);
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectTextOnFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(caretHidden);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contextMenuHidden);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowRadius);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textDecorationLine);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontStyle);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowOffset);
    RAW_SET_PROP_SWITCH_CASE_BASIC(lineHeight);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textTransform);
    // RAW_SET_PROP_SWITCH_CASE_BASIC(color);
    RAW_SET_PROP_SWITCH_CASE_BASIC(letterSpacing);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontSize);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textAlign);
    RAW_SET_PROP_SWITCH_CASE_BASIC(includeFontPadding);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontWeight);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontFamily);

    case CONSTEXPR_RAW_PROPS_KEY_HASH("value"): {
      fromRawValue(context, value, this->value, {});
      return;
    }

    // Paddings are not parsed at this level of the component (they're parsed in
    // ViewProps) but we do need to know if they're present or not. See
    // AndroidTextInputComponentDescriptor for usage
    // TODO T63008435: can these, and this feature, be removed entirely?
    case CONSTEXPR_RAW_PROPS_KEY_HASH("padding"): {
      hasPadding = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingHorizontal"): {
      hasPaddingHorizontal = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingVertical"): {
      hasPaddingVertical = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingLeft"): {
      hasPaddingLeft = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingRight"): {
      hasPaddingRight = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingTop"): {
      hasPaddingTop = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingBottom"): {
      hasPaddingBottom = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingStart"): {
      hasPaddingStart = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingEnd"): {
      hasPaddingEnd = value.hasValue();
      return;
    }
  }
}

// TODO T53300085: support this in codegen; this was hand-written
folly::dynamic AndroidTextInputProps::getDynamic() const {
  folly::dynamic props = folly::dynamic::object();
  props["autoComplete"] = autoComplete;
  props["returnKeyLabel"] = returnKeyLabel;
  props["numberOfLines"] = numberOfLines;
  props["disableFullscreenUI"] = disableFullscreenUI;
  props["textBreakStrategy"] = textBreakStrategy;
  props["underlineColorAndroid"] = toAndroidRepr(underlineColorAndroid);
  props["inlineImageLeft"] = inlineImageLeft;
  props["inlineImagePadding"] = inlineImagePadding;
  props["importantForAutofill"] = importantForAutofill;
  props["showSoftInputOnFocus"] = showSoftInputOnFocus;
  props["autoCapitalize"] = autoCapitalize;
  props["autoCorrect"] = autoCorrect;
  props["autoFocus"] = autoFocus;
  props["allowFontScaling"] = allowFontScaling;
  props["maxFontSizeMultiplier"] = maxFontSizeMultiplier;
  props["keyboardType"] = keyboardType;
  props["returnKeyType"] = returnKeyType;
  props["maxLength"] = maxLength;
  props["multiline"] = multiline;
  props["placeholder"] = placeholder;
  props["placeholderTextColor"] = toAndroidRepr(placeholderTextColor);
  props["secureTextEntry"] = secureTextEntry;
  props["selectionColor"] = toAndroidRepr(selectionColor);
  props["selectionHandleColor"] = toAndroidRepr(selectionHandleColor);
  props["value"] = value;
  props["defaultValue"] = defaultValue;
  props["selectTextOnFocus"] = selectTextOnFocus;
  props["submitBehavior"] = toDynamic(submitBehavior);
  props["caretHidden"] = caretHidden;
  props["contextMenuHidden"] = contextMenuHidden;
  props["textShadowColor"] = toAndroidRepr(textShadowColor);
  props["textShadowRadius"] = textShadowRadius;
  props["textDecorationLine"] = textDecorationLine;
  props["fontStyle"] = fontStyle;
  props["textShadowOffset"] = toDynamic(textShadowOffset);
  props["lineHeight"] = lineHeight;
  props["textTransform"] = textTransform;
  props["color"] = toAndroidRepr(color);
  props["letterSpacing"] = letterSpacing;
  props["fontSize"] = fontSize;
  props["textAlign"] = textAlign;
  props["includeFontPadding"] = includeFontPadding;
  props["fontWeight"] = fontWeight;
  props["fontFamily"] = fontFamily;
  props["cursorColor"] = toAndroidRepr(cursorColor);
  props["mostRecentEventCount"] = mostRecentEventCount;
  props["text"] = text;

  props["hasPadding"] = hasPadding;
  props["hasPaddingHorizontal"] = hasPaddingHorizontal;
  props["hasPaddingVertical"] = hasPaddingVertical;
  props["hasPaddingStart"] = hasPaddingStart;
  props["hasPaddingEnd"] = hasPaddingEnd;
  props["hasPaddingLeft"] = hasPaddingLeft;
  props["hasPaddingRight"] = hasPaddingRight;
  props["hasPaddingTop"] = hasPaddingTop;
  props["hasPaddingBottom"] = hasPaddingBottom;

  return props;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
// TODO: codegen these
SharedDebugStringConvertibleList AndroidTextInputProps::getDebugProps() const {
  return {};
}
#endif

ComponentName AndroidTextInputProps::getDiffPropsImplementationTarget() const {
  return "TextInput";
}

folly::dynamic AndroidTextInputProps::getDiffProps(
    const Props* prevProps) const {
  static const auto defaultProps = AndroidTextInputProps();

  const AndroidTextInputProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const AndroidTextInputProps*>(prevProps);

  folly::dynamic result = ViewProps::getDiffProps(oldProps);

  // Base text input paragraph props
  if (paragraphAttributes.maximumNumberOfLines !=
      oldProps->paragraphAttributes.maximumNumberOfLines) {
    result["numberOfLines"] = paragraphAttributes.maximumNumberOfLines;
  }

  if (paragraphAttributes.ellipsizeMode !=
      oldProps->paragraphAttributes.ellipsizeMode) {
    result["ellipsizeMode"] = toString(paragraphAttributes.ellipsizeMode);
  }

  if (paragraphAttributes.textBreakStrategy !=
      oldProps->paragraphAttributes.textBreakStrategy) {
    result["textBreakStrategy"] =
        toString(paragraphAttributes.textBreakStrategy);
  }

  if (paragraphAttributes.adjustsFontSizeToFit !=
      oldProps->paragraphAttributes.adjustsFontSizeToFit) {
    result["adjustsFontSizeToFit"] = paragraphAttributes.adjustsFontSizeToFit;
  }

  if (!floatEquality(
          paragraphAttributes.minimumFontSize,
          oldProps->paragraphAttributes.minimumFontSize)) {
    result["minimumFontSize"] = paragraphAttributes.minimumFontSize;
  }

  if (!floatEquality(
          paragraphAttributes.maximumFontSize,
          oldProps->paragraphAttributes.maximumFontSize)) {
    result["maximumFontSize"] = paragraphAttributes.maximumFontSize;
  }

  if (paragraphAttributes.includeFontPadding !=
      oldProps->paragraphAttributes.includeFontPadding) {
    result["includeFontPadding"] = paragraphAttributes.includeFontPadding;
  }

  if (paragraphAttributes.android_hyphenationFrequency !=
      oldProps->paragraphAttributes.android_hyphenationFrequency) {
    result["android_hyphenationFrequency"] =
        toString(paragraphAttributes.android_hyphenationFrequency);
  }

  if (paragraphAttributes.textAlignVertical !=
      oldProps->paragraphAttributes.textAlignVertical) {
    if (!paragraphAttributes.textAlignVertical.has_value()) {
      result["textAlignVertical"] = nullptr;
    } else {
      result["textAlignVertical"] =
          toString(*paragraphAttributes.textAlignVertical);
    }
  }

  // Base text input props
  if (defaultValue != oldProps->defaultValue) {
    result["defaultValue"] = defaultValue;
  }

  if (placeholder != oldProps->placeholder) {
    result["placeholder"] = placeholder;
  }

  if (placeholderTextColor != oldProps->placeholderTextColor) {
    result["placeholderTextColor"] = *placeholderTextColor;
  }

  if (cursorColor != oldProps->cursorColor) {
    result["cursorColor"] = *cursorColor;
  }

  if (selectionColor != oldProps->selectionColor) {
    result["selectionColor"] = *selectionColor;
  }

  if (selectionHandleColor != oldProps->selectionHandleColor) {
    result["selectionHandleColor"] = *selectionHandleColor;
  }

  if (underlineColorAndroid != oldProps->underlineColorAndroid) {
    result["underlineColorAndroid"] = *underlineColorAndroid;
  }

  if (maxLength != oldProps->maxLength) {
    result["maxLength"] = maxLength;
  }

  if (text != oldProps->text) {
    result["text"] = text;
  }

  if (mostRecentEventCount != oldProps->mostRecentEventCount) {
    result["mostRecentEventCount"] = mostRecentEventCount;
  }

  if (autoFocus != oldProps->autoFocus) {
    result["autoFocus"] = autoFocus;
  }

  if (autoCapitalize != oldProps->autoCapitalize) {
    result["autoCapitalize"] = autoCapitalize;
  }

  if (editable != oldProps->editable) {
    result["editable"] = editable;
  }

  if (readOnly != oldProps->readOnly) {
    result["readOnly"] = readOnly;
  }

  if (submitBehavior != oldProps->submitBehavior) {
    result["submitBehavior"] = toDynamic(submitBehavior);
  }

  if (multiline != oldProps->multiline) {
    result["multiline"] = multiline;
  }

  if (disableKeyboardShortcuts != oldProps->disableKeyboardShortcuts) {
    result["disableKeyboardShortcuts"] = disableKeyboardShortcuts;
  }

  if (acceptDragAndDropTypes != oldProps->acceptDragAndDropTypes) {
    result["acceptDragAndDropTypes"] = acceptDragAndDropTypes.has_value()
        ? toDynamic(acceptDragAndDropTypes.value())
        : nullptr;
  }

  // Android text input props
  if (autoComplete != oldProps->autoComplete) {
    result["autoComplete"] = autoComplete;
  }

  if (returnKeyLabel != oldProps->returnKeyLabel) {
    result["returnKeyLabel"] = returnKeyLabel;
  }

  if (numberOfLines != oldProps->numberOfLines) {
    result["numberOfLines"] = numberOfLines;
  }

  if (disableFullscreenUI != oldProps->disableFullscreenUI) {
    result["disableFullscreenUI"] = disableFullscreenUI;
  }

  if (textBreakStrategy != oldProps->textBreakStrategy) {
    result["textBreakStrategy"] = textBreakStrategy;
  }

  if (inlineImageLeft != oldProps->inlineImageLeft) {
    result["inlineImageLeft"] = inlineImageLeft;
  }

  if (inlineImagePadding != oldProps->inlineImagePadding) {
    result["inlineImagePadding"] = inlineImagePadding;
  }

  if (importantForAutofill != oldProps->importantForAutofill) {
    result["importantForAutofill"] = importantForAutofill;
  }

  if (showSoftInputOnFocus != oldProps->showSoftInputOnFocus) {
    result["showSoftInputOnFocus"] = showSoftInputOnFocus;
  }

  if (autoCorrect != oldProps->autoCorrect) {
    result["autoCorrect"] = autoCorrect;
  }

  if (allowFontScaling != oldProps->allowFontScaling) {
    result["allowFontScaling"] = allowFontScaling;
  }

  if (maxFontSizeMultiplier != oldProps->maxFontSizeMultiplier) {
    result["maxFontSizeMultiplier"] = maxFontSizeMultiplier;
  }

  if (keyboardType != oldProps->keyboardType) {
    result["keyboardType"] = keyboardType;
  }

  if (returnKeyType != oldProps->returnKeyType) {
    result["returnKeyType"] = returnKeyType;
  }

  if (secureTextEntry != oldProps->secureTextEntry) {
    result["secureTextEntry"] = secureTextEntry;
  }

  if (value != oldProps->value) {
    result["value"] = value;
  }

  if (selectTextOnFocus != oldProps->selectTextOnFocus) {
    result["selectTextOnFocus"] = selectTextOnFocus;
  }

  if (caretHidden != oldProps->caretHidden) {
    result["caretHidden"] = caretHidden;
  }

  if (contextMenuHidden != oldProps->contextMenuHidden) {
    result["contextMenuHidden"] = contextMenuHidden;
  }

  if (textShadowColor != oldProps->textShadowColor) {
    result["textShadowColor"] = *textShadowColor;
  }

  if (textShadowRadius != oldProps->textShadowRadius) {
    result["textShadowRadius"] = textShadowRadius;
  }

  if (textDecorationLine != oldProps->textDecorationLine) {
    result["textDecorationLine"] = textDecorationLine;
  }

  if (fontStyle != oldProps->fontStyle) {
    result["fontStyle"] = fontStyle;
  }

  if (textShadowOffset != oldProps->textShadowOffset) {
    result["textShadowOffset"] = toDynamic(textShadowOffset);
  }

  if (lineHeight != oldProps->lineHeight) {
    result["lineHeight"] = lineHeight;
  }

  if (textTransform != oldProps->textTransform) {
    result["textTransform"] = textTransform;
  }

  if (letterSpacing != oldProps->letterSpacing) {
    result["letterSpacing"] = letterSpacing;
  }

  if (fontSize != oldProps->fontSize) {
    result["fontSize"] = fontSize;
  }

  if (textAlign != oldProps->textAlign) {
    result["textAlign"] = textAlign;
  }

  if (includeFontPadding != oldProps->includeFontPadding) {
    result["includeFontPadding"] = includeFontPadding;
  }

  if (fontWeight != oldProps->fontWeight) {
    result["fontWeight"] = fontWeight;
  }

  if (fontFamily != oldProps->fontFamily) {
    result["fontFamily"] = fontFamily;
  }

  return result;
}

} // namespace facebook::react
