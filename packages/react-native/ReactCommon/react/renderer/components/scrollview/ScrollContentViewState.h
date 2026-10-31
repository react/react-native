/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/graphics/RectangleEdges.h>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

/*
 * State for the <ScrollContentView> component, the content container of a
 * <ScrollView>.
 */
class ScrollContentViewState final {
 public:
  /*
   * The safe area the content is laid out clear of, as padding on top of the
   * padding the style sets. The enclosing scroll view sets the pair of edges
   * across its scrollable axis.
   */
  EdgeInsets safeAreaPadding{};

  /*
   * The layout direction, and whether left and right swap in RTL, decide the
   * padding edges the safe area adds to.
   */
  LayoutDirection layoutDirection{LayoutDirection::LeftToRight};
  bool swapLeftAndRightInRTL{false};

#ifdef RN_SERIALIZABLE_STATE
  ScrollContentViewState() = default;

  ScrollContentViewState(const ScrollContentViewState & /*previousState*/, folly::dynamic data)
      : safeAreaPadding(
            {(Float)data["left"].getDouble(),
             (Float)data["top"].getDouble(),
             (Float)data["right"].getDouble(),
             (Float)data["bottom"].getDouble()}),
        layoutDirection(static_cast<LayoutDirection>(data["layoutDirection"].getInt())),
        swapLeftAndRightInRTL(data["swapLeftAndRightInRTL"].getBool())
  {
  }

  folly::dynamic getDynamic() const
  {
    return folly::dynamic::object("left", safeAreaPadding.left)("top", safeAreaPadding.top)(
        "right", safeAreaPadding.right)("bottom", safeAreaPadding.bottom)(
        "layoutDirection", static_cast<int>(layoutDirection))("swapLeftAndRightInRTL", swapLeftAndRightInRTL);
  }
#endif
};

} // namespace facebook::react
