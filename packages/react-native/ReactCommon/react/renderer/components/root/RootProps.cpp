/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RootProps.h"

#include <react/renderer/components/view/YogaLayoutableShadowNode.h>
#include <react/renderer/components/view/conversions.h>

namespace facebook::react {

// Note that a default/empty context may be passed here from RootShadowNode.
// If that's a problem and the context is necessary here, refactor
// RootShadowNode first.
RootProps::RootProps(
    const PropsParserContext& context,
    const RootProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      colorScheme(sourceProps.colorScheme) {}

// Note that a default/empty context may be passed here from RootShadowNode.
// If that's a problem and the context is necessary here, refactor
// RootShadowNode first.
RootProps::RootProps(
    const PropsParserContext& /*context*/,
    const RootProps& /*sourceProps*/,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext,
    ColorScheme colorScheme)
    : ViewProps(),
      layoutConstraints(layoutConstraints),
      layoutContext(layoutContext),
      colorScheme(colorScheme) {};

} // namespace facebook::react
