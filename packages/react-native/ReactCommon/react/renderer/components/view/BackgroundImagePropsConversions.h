/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/graphics/BackgroundImage.h>

namespace facebook::react {

void parseProcessedBackgroundImage(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result);

void parseUnprocessedBackgroundImageList(
    const PropsParserContext& context,
    const std::vector<RawValue>& value,
    std::vector<BackgroundImage>& result);

void parseUnprocessedBackgroundImageString(
    const std::string& value,
    std::vector<BackgroundImage>& result);

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result) {
  if (ReactNativeFeatureFlags::enableNativeCSSParsing()) {
    if (value.hasType<std::string>()) {
      parseUnprocessedBackgroundImageString((std::string)value, result);
    } else if (value.hasType<std::vector<RawValue>>()) {
      parseUnprocessedBackgroundImageList(
          context, (std::vector<RawValue>)value, result);
    } else {
      result = {};
    }
  } else {
    parseProcessedBackgroundImage(context, value, result);
  }
}

} // namespace facebook::react
