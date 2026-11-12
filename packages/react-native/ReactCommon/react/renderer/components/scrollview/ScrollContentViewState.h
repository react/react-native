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
   * The safe area the content is laid out clear of, as a floor on the padding
   * the style sets. The enclosing scroll view sets the pair of edges across
   * its scrollable axis for `automatic` and `always`.
   */
  EdgeInsets safeAreaPadding{};

  /*
   * The content inset UIKit adds for the safe area along the scrollable axis,
   * which the padding the style sets on those edges counts toward. The
   * enclosing scroll view sets the pair of edges along its scrollable axis.
   */
  EdgeInsets contentInsetAdjustment{};

  /*
   * Whether left and right swap in RTL, which decides the padding edges the
   * safe area adds to.
   */
  bool swapLeftAndRightInRTL{false};

  bool operator==(const ScrollContentViewState &) const = default;

#ifdef RN_SERIALIZABLE_STATE
  ScrollContentViewState() = default;

  ScrollContentViewState(const ScrollContentViewState & /*previousState*/, folly::dynamic data)
      : safeAreaPadding(
            {(Float)data["left"].getDouble(),
             (Float)data["top"].getDouble(),
             (Float)data["right"].getDouble(),
             (Float)data["bottom"].getDouble()}),
        contentInsetAdjustment(
            {(Float)data["contentInsetLeft"].getDouble(),
             (Float)data["contentInsetTop"].getDouble(),
             (Float)data["contentInsetRight"].getDouble(),
             (Float)data["contentInsetBottom"].getDouble()}),
        swapLeftAndRightInRTL(data["swapLeftAndRightInRTL"].getBool())
  {
  }

  folly::dynamic getDynamic() const
  {
    return folly::dynamic::object("left", safeAreaPadding.left)("top", safeAreaPadding.top)(
        "right", safeAreaPadding.right)("bottom", safeAreaPadding.bottom)(
        "contentInsetLeft", contentInsetAdjustment.left)("contentInsetTop", contentInsetAdjustment.top)(
        "contentInsetRight", contentInsetAdjustment.right)("contentInsetBottom", contentInsetAdjustment.bottom)(
        "swapLeftAndRightInRTL", swapLeftAndRightInRTL);
  }
#endif
};

} // namespace facebook::react
