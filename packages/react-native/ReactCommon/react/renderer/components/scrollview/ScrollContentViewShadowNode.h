/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/components/scrollview/ScrollContentViewProps.h>
#include <react/renderer/components/scrollview/ScrollContentViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <yoga/style/Style.h>

namespace facebook::react {

// NOLINTNEXTLINE(modernize-avoid-c-arrays)
extern const char ScrollContentViewComponentName[];

/*
 * `ShadowNode` for the <ScrollContentView> component, the content container of
 * a <ScrollView>. It lays its content out clear of the safe area in its state
 * by at least the padding its style sets: across the scrollable axis as
 * padding, and along it as what the padding exceeds UIKit's content inset by.
 */
class ScrollContentViewShadowNode final : public ConcreteViewShadowNode<
                                              ScrollContentViewComponentName,
                                              ScrollContentViewProps,
                                              ViewEventEmitter,
                                              ScrollContentViewState> {
 public:
  ScrollContentViewShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeFamily::Shared &family,
      ShadowNodeTraits traits);

  ScrollContentViewShadowNode(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment);

  /*
   * Rebuilds the Yoga style from the props and pads it by the safe area in the
   * state, for the layout direction the node resolved to at its last layout.
   * The native view sets the safe area after the first layout, so the
   * direction is known whenever there is padding to add.
   */
  void applySafeAreaPadding();

  /*
   * Raises the padding `style` resolves to on each edge to at least
   * `state.safeAreaPadding`, less `state.contentInsetAdjustment` where UIKit
   * already applies the safe area as a content inset, following the precedence
   * Yoga gives the padding edges for `layoutDirection`. An edge with a
   * percentage padding keeps it and gets no inset.
   */
  static void padForSafeArea(yoga::Style &style, const ScrollContentViewState &state, LayoutDirection layoutDirection);

 private:
  void initialize() noexcept;
};

} // namespace facebook::react
