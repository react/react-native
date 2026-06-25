/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostPlatformParagraphProps.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/attributedstring/primitives.h>
#include <react/renderer/components/text/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

#include <glog/logging.h>

namespace facebook::react {

HostPlatformParagraphProps::HostPlatformParagraphProps(
    const PropsParserContext& context,
    const HostPlatformParagraphProps& sourceProps,
    const RawProps& rawProps)
    : BaseParagraphProps(context, sourceProps, rawProps),
      disabled(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.disabled
              : convertRawProp(
                    context,
                    rawProps,
                    "disabled",
                    sourceProps.disabled,
                    false)),
      selectionColor(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.selectionColor
              : convertRawProp(
                    context,
                    rawProps,
                    "selectionColor",
                    sourceProps.selectionColor,
                    {})),
      dataDetectorType(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.dataDetectorType
              : convertRawProp(
                    context,
                    rawProps,
                    "dataDetectorType",
                    sourceProps.dataDetectorType,
                    {}))

{};

void HostPlatformParagraphProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  BaseParagraphProps::setProp(context, hash, propName, value);

  static auto defaults = HostPlatformParagraphProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(disabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectionColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(dataDetectorType);
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList HostPlatformParagraphProps::getDebugProps()
    const {
  return BaseParagraphProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem("disabled", disabled),
          debugStringConvertibleItem("selectionColor", selectionColor),
          debugStringConvertibleItem("dataDetectorType", dataDetectorType)};
}
#endif

#ifdef RN_SERIALIZABLE_STATE

ComponentName HostPlatformParagraphProps::getDiffPropsImplementationTarget()
    const {
  return "Paragraph";
}

folly::dynamic HostPlatformParagraphProps::getDiffProps(
    const Props* prevProps) const {
  static const auto defaultProps = HostPlatformParagraphProps();

  const HostPlatformParagraphProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const HostPlatformParagraphProps*>(prevProps);

  folly::dynamic result = ViewProps::getDiffProps(oldProps);

  BaseTextProps::appendTextAttributesProps(result, oldProps);

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
          paragraphAttributes.minimumFontScale,
          oldProps->paragraphAttributes.minimumFontScale)) {
    result["minimumFontScale"] = paragraphAttributes.minimumFontScale;
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
    result["textAlignVertical"] =
        paragraphAttributes.textAlignVertical.has_value()
        ? toString(paragraphAttributes.textAlignVertical.value())
        : folly::dynamic(nullptr);
  }

  if (isSelectable != oldProps->isSelectable) {
    result["selectable"] = isSelectable;
  }

  if (onTextLayout != oldProps->onTextLayout) {
    result["onTextLayout"] = onTextLayout;
  }

  if (disabled != oldProps->disabled) {
    result["disabled"] = disabled;
  }

  if (selectionColor != oldProps->selectionColor) {
    if (selectionColor.has_value()) {
      result["selectionColor"] = *selectionColor.value();
    } else {
      result["selectionColor"] = folly::dynamic(nullptr);
    }
  }

  if (dataDetectorType != oldProps->dataDetectorType) {
    if (dataDetectorType.has_value()) {
      result["dataDetectorType"] = toString(dataDetectorType.value());
    } else {
      result["dataDetectorType"] = folly::dynamic(nullptr);
    }
  }

  return result;
}

#endif
} // namespace facebook::react
