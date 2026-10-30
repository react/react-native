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
 * a <ScrollView>. It pads its content by the safe area in its state, on top of
 * the padding its style sets.
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
   * state.
   */
  void applySafeAreaPadding();

  /*
   * Pads `style` by `state.safeAreaPadding`, on top of the padding `style`
   * resolves to on each edge, following the precedence Yoga gives the padding
   * edges for the layout direction. A percentage resolves to 0 on an edge with
   * an inset.
   */
  static void padForSafeArea(yoga::Style &style, const ScrollContentViewState &state);

 private:
  void initialize() noexcept;
};

} // namespace facebook::react
