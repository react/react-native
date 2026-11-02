/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostPlatformParagraphProps.h"

#include <react/renderer/components/text/conversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

HostPlatformParagraphProps::HostPlatformParagraphProps(
    const PropsParserContext& context,
    const HostPlatformParagraphProps& sourceProps,
    const RawProps& rawProps)
    : BaseParagraphProps(context, sourceProps, rawProps),
      dataDetectorType(convertRawProp(
          context,
          rawProps,
          "dataDetectorType",
          sourceProps.dataDetectorType,
          DataDetectorType::None)) {}

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

  switch (hash) { RAW_SET_PROP_SWITCH_CASE_BASIC(dataDetectorType); }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList HostPlatformParagraphProps::getDebugProps()
    const {
  return BaseParagraphProps::getDebugProps() +
      SharedDebugStringConvertibleList{debugStringConvertibleItem(
          "dataDetectorType", dataDetectorType, DataDetectorType::None)};
}
#endif

} // namespace facebook::react
