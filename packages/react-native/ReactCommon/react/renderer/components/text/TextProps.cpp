/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextProps.h"

#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

TextProps::TextProps(
    const PropsParserContext& context,
    const TextProps& sourceProps,
    const RawProps& rawProps)
    : Props(context, sourceProps, rawProps),
      BaseTextProps::BaseTextProps(context, sourceProps, rawProps),
      transform(convertRawProp(
          context,
          rawProps,
          "transform",
          sourceProps.transform,
          {})),
      transformOrigin(convertRawProp(
          context,
          rawProps,
          "transformOrigin",
          sourceProps.transformOrigin,
          {})) {};

void TextProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  BaseTextProps::setProp(context, hash, propName, value);
  Props::setProp(context, hash, propName, value);

  static auto defaults = TextProps{};
  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(transform);
    RAW_SET_PROP_SWITCH_CASE_BASIC(transformOrigin);
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList TextProps::getDebugProps() const {
  return BaseTextProps::getDebugProps();
}
#endif

#ifdef RN_SERIALIZABLE_STATE

ComponentName TextProps::getDiffPropsImplementationTarget() const {
  return "Text";
}

folly::dynamic TextProps::getDiffProps(const Props* prevProps) const {
  folly::dynamic result = folly::dynamic::object();

  static const auto defaultProps = TextProps();

  const TextProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const TextProps*>(prevProps);

  BaseTextProps::appendTextAttributesProps(result, oldProps);

  return result;
}

#endif
} // namespace facebook::react
