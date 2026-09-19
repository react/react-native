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
#include <react/renderer/graphics/ClipPath.h>
#include <optional>
#include <string>

namespace facebook::react {

void parseProcessedClipPath(const PropsParserContext &context, const RawValue &value, std::optional<ClipPath> &result);

void parseUnprocessedClipPath(std::string &&value, std::optional<ClipPath> &result);

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, std::optional<ClipPath> &result)
{
  if (ReactNativeFeatureFlags::enableNativeCSSParsing()) {
    parseUnprocessedClipPath((std::string)value, result);
  } else {
    parseProcessedClipPath(context, value, result);
  }
}

} // namespace facebook::react
