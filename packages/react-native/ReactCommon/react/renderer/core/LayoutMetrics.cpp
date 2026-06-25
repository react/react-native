/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/debug/flags.h>

#include "LayoutMetrics.h"

namespace facebook::react {

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const LayoutMetrics& /*object*/) {
  return "LayoutMetrics";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const LayoutMetrics& object,
    DebugStringConvertibleOptions options) {
  return {
      {.name = "frame",
       .value = "{x:" + getDebugDescription(object.frame.origin.x, {}) +
           ",y:" + getDebugDescription(object.frame.origin.y, {}) +
           ",width:" + getDebugDescription(object.frame.size.width, {}) +
           ",height:" + getDebugDescription(object.frame.size.height, {}) +
           "}"},
      {.name = "contentInsets",
       .value = "{top:" + getDebugDescription(object.contentInsets.top, {}) +
           ",right:" + getDebugDescription(object.contentInsets.right, {}) +
           ",bottom:" + getDebugDescription(object.contentInsets.bottom, {}) +
           ",left:" + getDebugDescription(object.contentInsets.left, {}) + "}"},
      {.name = "borderWidth",
       .value = "{top:" + getDebugDescription(object.borderWidth.top, {}) +
           ",right:" + getDebugDescription(object.borderWidth.right, {}) +
           ",bottom:" + getDebugDescription(object.borderWidth.bottom, {}) +
           ",left:" + getDebugDescription(object.borderWidth.left, {}) + "}"},
      {.name = "overflowInset",
       .value = "{top:" + getDebugDescription(object.overflowInset.top, {}) +
           ",right:" + getDebugDescription(object.overflowInset.right, {}) +
           ",bottom:" + getDebugDescription(object.overflowInset.bottom, {}) +
           ",left:" + getDebugDescription(object.overflowInset.left, {}) + "}"},
      {.name = "displayType",
       .value = object.displayType == DisplayType::None  ? "None"
           : object.displayType == DisplayType::Flex     ? "Flex"
           : object.displayType == DisplayType::Grid     ? "Grid"
           : object.displayType == DisplayType::Contents ? "Contents"
                                                         : "Unknown"},
      {.name = "layoutDirection",
       .value = object.layoutDirection == LayoutDirection::Undefined
           ? "Undefined"
           : (object.layoutDirection == LayoutDirection::LeftToRight
                  ? "LeftToRight"
                  : "RightToLeft")},
      {.name = "pointScaleFactor",
       .value = getDebugDescription(object.pointScaleFactor, options)},
  };
}

#endif

} // namespace facebook::react
