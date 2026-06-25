/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropViewProps.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <react/renderer/core/DynamicPropsUtilities.h>

namespace facebook::react {

LegacyViewManagerInteropViewProps::LegacyViewManagerInteropViewProps(
    const PropsParserContext& context,
    const LegacyViewManagerInteropViewProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      otherProps(mergeDynamicProps(
          sourceProps.otherProps,
          (folly::dynamic)rawProps,
          NullValueStrategy::Override)) {}

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
