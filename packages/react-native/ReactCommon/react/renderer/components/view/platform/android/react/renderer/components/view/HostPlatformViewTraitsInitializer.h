/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ShadowNodeTraits.h>

namespace facebook::react::HostPlatformViewTraitsInitializer {

inline bool formsStackingContext(const ViewProps& viewProps) {
  return viewProps.elevation != 0;
}

inline bool formsView(const ViewProps& viewProps) {
  return viewProps.nativeBackground.has_value() ||
      viewProps.nativeForeground.has_value() || viewProps.focusable ||
      viewProps.hasTVPreferredFocus ||
      viewProps.needsOffscreenAlphaCompositing ||
      viewProps.renderToHardwareTextureAndroid ||
      viewProps.screenReaderFocusable;
}

inline bool isKeyboardFocusable(const ViewProps& viewProps) {
  return (viewProps.focusable || viewProps.hasTVPreferredFocus);
}

} // namespace facebook::react::HostPlatformViewTraitsInitializer
