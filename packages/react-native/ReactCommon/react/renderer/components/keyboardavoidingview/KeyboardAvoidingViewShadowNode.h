/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#include <react/renderer/components/FBReactNativeSpec/Props.h>
#include <react/renderer/components/keyboardavoidingview/KeyboardAvoidingViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

// NOLINTNEXTLINE(modernize-avoid-c-arrays)
extern const char KeyboardAvoidingViewComponentName[];

/*
 * `ShadowNode` for <KeyboardAvoidingView> component.
 */
class KeyboardAvoidingViewShadowNode final : public ConcreteViewShadowNode<
                                                 KeyboardAvoidingViewComponentName,
                                                 KeyboardAvoidingViewProps,
                                                 ViewEventEmitter,
                                                 KeyboardAvoidingViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static KeyboardAvoidingViewState initialStateData(
      const Props::Shared &props,
      const ShadowNodeFamily::Shared &family,
      const ComponentDescriptor &componentDescriptor);

  /*
   * Applies the `keyboardInset` prop to the Yoga style, on top of the style
   * set by React. Called on each new node and on each clone.
   */
  void applyKeyboardInset() const;
};

} // namespace facebook::react
