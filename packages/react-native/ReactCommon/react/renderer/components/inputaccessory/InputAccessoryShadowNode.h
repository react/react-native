/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#include <react/renderer/components/FBReactNativeSpec/Props.h>
#include <react/renderer/components/inputaccessory/InputAccessoryState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char InputAccessoryComponentName[];

/*
 * `ShadowNode` for <InputAccessory> component.
 */
class InputAccessoryShadowNode final : public ConcreteViewShadowNode<
                                           InputAccessoryComponentName,
                                           InputAccessoryProps,
                                           InputAccessoryEventEmitter,
                                           InputAccessoryState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }
};

} // namespace facebook::react
