/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#include <react/renderer/components/FBReactNativeSpec/Props.h>
#include <react/renderer/components/modal/ModalHostViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char ModalHostViewComponentName[];

/*
 * `ShadowNode` for <ModalHostView> component.
 */
class ModalHostViewShadowNode final : public ConcreteViewShadowNode<
                                          ModalHostViewComponentName,
                                          ModalHostViewProps,
                                          ModalHostViewEventEmitter,
                                          ModalHostViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    // <Modal> has a side effect of showing the modal overlay and
    // must not be culled. Otherwise, the modal overlay will not be shown.
    traits.set(ShadowNodeTraits::Trait::Unstable_uncullableView);
    return traits;
  }
};

} // namespace facebook::react
