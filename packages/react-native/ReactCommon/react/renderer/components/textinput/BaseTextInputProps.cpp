/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextInputProps.h"
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/components/textinput/baseConversions.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsMacros.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/imagemanager/primitives.h>
#include <limits>

namespace facebook::react {

BaseTextInputProps::BaseTextInputProps(
    const PropsParserContext& context,
    const BaseTextInputProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      BaseTextProps(context, sourceProps, rawProps),
      paragraphAttributes(convertRawProp(
          context,
          rawProps,
          sourceProps.paragraphAttributes,
          {})),
      defaultValue(convertRawProp(
          context,
          rawProps,
          "defaultValue",
          sourceProps.defaultValue,
          {})),
      placeholder(convertRawProp(
          context,
          rawProps,
          "placeholder",
          sourceProps.placeholder,
          {})),
      placeholderTextColor(convertRawProp(
          context,
          rawProps,
          "placeholderTextColor",
          sourceProps.placeholderTextColor,
          {})),
      cursorColor(convertRawProp(
          context,
          rawProps,
          "cursorColor",
          sourceProps.cursorColor,
          {})),
      selectionColor(convertRawProp(
          context,
          rawProps,
          "selectionColor",
          sourceProps.selectionColor,
          {})),
      selectionHandleColor(convertRawProp(
          context,
          rawProps,
          "selectionHandleColor",
          sourceProps.selectionHandleColor,
          {})),
      underlineColorAndroid(convertRawProp(
          context,
          rawProps,
          "underlineColorAndroid",
          sourceProps.underlineColorAndroid,
          {})),
      maxLength(convertRawProp(
          context,
          rawProps,
          "maxLength",
          sourceProps.maxLength,
          {std::numeric_limits<int>::max()})),
      text(convertRawProp(context, rawProps, "text", sourceProps.text, {})),
      mostRecentEventCount(convertRawProp(
          context,
          rawProps,
          "mostRecentEventCount",
          sourceProps.mostRecentEventCount,
          {})),
      autoFocus(convertRawProp(
          context,
          rawProps,
          "autoFocus",
          sourceProps.autoFocus,
          {})),
      autoCapitalize(convertRawProp(
          context,
          rawProps,
          "autoCapitalize",
          sourceProps.autoCapitalize,
          {})),
      editable(convertRawProp(
          context,
          rawProps,
          "editable",
          sourceProps.editable,
          {})),
      readOnly(convertRawProp(
          context,
          rawProps,
          "readOnly",
          sourceProps.readOnly,
          {})),
      submitBehavior(convertRawProp(
          context,
          rawProps,
          "submitBehavior",
          sourceProps.submitBehavior,
          {})),
      multiline(convertRawProp(
          context,
          rawProps,
          "multiline",
          sourceProps.multiline,
          {false})),
      disableKeyboardShortcuts(convertRawProp(
          context,
          rawProps,
          "disableKeyboardShortcuts",
          sourceProps.disableKeyboardShortcuts,
          {false})),
      acceptDragAndDropTypes(convertRawProp(
          context,
          rawProps,
          "acceptDragAndDropTypes",
          sourceProps.acceptDragAndDropTypes,
          {})) {}

void BaseTextInputProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  ViewProps::setProp(context, hash, propName, value);
  BaseTextProps::setProp(context, hash, propName, value);

  static auto defaults = BaseTextInputProps{};

  // ParagraphAttributes has its own switch statement - to keep all
  // of these fields together, and because there are some collisions between
  // propnames parsed here and outside of ParagraphAttributes. For example,
  // textBreakStrategy is duplicated.
  // This code is also duplicated in ParagraphProps.
  static auto paDefaults = ParagraphAttributes{};
  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        maximumNumberOfLines,
        "numberOfLines");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults, value, paragraphAttributes, ellipsizeMode, "ellipsizeMode");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        textBreakStrategy,
        "textBreakStrategy");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        adjustsFontSizeToFit,
        "adjustsFontSizeToFit");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        minimumFontSize,
        "minimumFontSize");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        maximumFontSize,
        "maximumFontSize");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        includeFontPadding,
        "includeFontPadding");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        android_hyphenationFrequency,
        "android_hyphenationFrequency");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        textAlignVertical,
        "textAlignVertical");
  }

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(underlineColorAndroid);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maxLength);
    RAW_SET_PROP_SWITCH_CASE_BASIC(placeholder);
    RAW_SET_PROP_SWITCH_CASE_BASIC(placeholderTextColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectionColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectionHandleColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(defaultValue);
    RAW_SET_PROP_SWITCH_CASE_BASIC(cursorColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(text);
    RAW_SET_PROP_SWITCH_CASE_BASIC(mostRecentEventCount);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoCapitalize);
    RAW_SET_PROP_SWITCH_CASE_BASIC(editable);
    RAW_SET_PROP_SWITCH_CASE_BASIC(readOnly);
    RAW_SET_PROP_SWITCH_CASE_BASIC(submitBehavior);
    RAW_SET_PROP_SWITCH_CASE_BASIC(multiline);
    RAW_SET_PROP_SWITCH_CASE_BASIC(disableKeyboardShortcuts);
    RAW_SET_PROP_SWITCH_CASE_BASIC(acceptDragAndDropTypes);
  }
}

TextAttributes BaseTextInputProps::getEffectiveTextAttributes(
    Float fontSizeMultiplier) const {
  auto result = TextAttributes::defaultTextAttributes();
  result.fontSizeMultiplier = fontSizeMultiplier;
  result.apply(textAttributes);

  /*
   * These props are applied to `View`, therefore they must not be a part of
   * base text attributes.
   */
  result.backgroundColor = clearColor();
  result.opacity = 1;

  return result;
}

SubmitBehavior BaseTextInputProps::getNonDefaultSubmitBehavior() const {
  if (submitBehavior == SubmitBehavior::Default) {
    return multiline ? SubmitBehavior::Newline : SubmitBehavior::BlurAndSubmit;
  }

  return submitBehavior;
}

} // namespace facebook::react
