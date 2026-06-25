/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_set>

namespace facebook::react {

inline const std::unordered_set<std::string> &getDirectManipulationAllowlist()
{
  /**
   * Direct manipulation eligible styles allowed by the NativeAnimated JS
   * implementation. Keep in sync with
   * packages/react-native/Libraries/Animated/NativeAnimatedAllowlist.js
   */
  static const std::unordered_set<std::string> DIRECT_MANIPULATION_STYLES{
      /* SUPPORTED_COLOR_STYLES */
      "backgroundColor",
      "borderBottomColor",
      "borderColor",
      "borderEndColor",
      "borderLeftColor",
      "borderRightColor",
      "borderStartColor",
      "borderTopColor",
      "color",
      "tintColor",

      /* SUPPORTED STYLES */
      "borderBottomEndRadius",
      "borderBottomLeftRadius",
      "borderBottomRightRadius",
      "borderBottomStartRadius",
      "borderEndEndRadius",
      "borderEndStartRadius",
      "borderRadius",
      "borderTopEndRadius",
      "borderTopLeftRadius",
      "borderTopRightRadius",
      "borderTopStartRadius",
      "borderStartEndRadius",
      "borderStartStartRadius",
      "elevation",
      "opacity",
      "transform",
      "zIndex",
      /* ios styles */
      "shadowOpacity",
      "shadowRadius",
      /* legacy android transform properties */
      "scaleX",
      "scaleY",
      "translateX",
      "translateY",
  };
  return DIRECT_MANIPULATION_STYLES;
}
} // namespace facebook::react
