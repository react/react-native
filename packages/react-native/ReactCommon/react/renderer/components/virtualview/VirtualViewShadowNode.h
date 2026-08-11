/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#include <react/renderer/components/FBReactNativeSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

constexpr const char VirtualViewComponentName[] = "VirtualView";

/*
 * `ShadowNode` for <VirtualView> component.
 */
class VirtualViewShadowNode final : public ConcreteViewShadowNode<
                                        VirtualViewComponentName,
                                        VirtualViewProps,
                                        VirtualViewEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    // <VirtualView> has a side effect: it listens to scroll events.
    // It must not be culled, otherwise Fling will not work.
    traits.set(ShadowNodeTraits::Trait::Unstable_uncullableView);
    return traits;
  }
};

} // namespace facebook::react
