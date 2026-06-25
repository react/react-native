/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/Size.h>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

/*
 * State for <ScrollView> component.
 */
class ScrollViewState final {
 public:
  ScrollViewState(Point contentOffset, Rect contentBoundingRect, int scrollAwayPaddingTop);
  ScrollViewState() = default;

  Point contentOffset;
  Rect contentBoundingRect;
  int scrollAwayPaddingTop{0};

  /*
   * View Culling has to be disabled when accessibility features are used.
   * View Culling removes views from view hierarchy and for example VoiceOver
   * wouldn't recognise there is a view outside of the viewport that it can
   * scroll to.
   */
  bool disableViewCulling{false};

  /*
   * Returns size of scrollable area.
   */
  Size getContentSize() const;

#ifdef RN_SERIALIZABLE_STATE
  ScrollViewState(const ScrollViewState &previousState, folly::dynamic data)
      : contentOffset({(Float)data["contentOffsetLeft"].getDouble(), (Float)data["contentOffsetTop"].getDouble()}),
        contentBoundingRect({}),
        scrollAwayPaddingTop((Float)data["scrollAwayPaddingTop"].getDouble()) {};

  folly::dynamic getDynamic() const
  {
    return folly::dynamic::object("contentOffsetLeft", contentOffset.x)("contentOffsetTop", contentOffset.y)(
        "scrollAwayPaddingTop", scrollAwayPaddingTop);
  };
#endif
};

} // namespace facebook::react
