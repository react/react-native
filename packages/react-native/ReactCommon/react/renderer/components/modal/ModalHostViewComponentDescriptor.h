/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/renderer/components/modal/ModalHostViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <ModalHostView> component.
 */

class ModalHostViewComponentDescriptor final
    : public ConcreteComponentDescriptor<ModalHostViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode& shadowNode) const override {
    auto& layoutableShadowNode =
        static_cast<YogaLayoutableShadowNode&>(shadowNode);
    auto& stateData =
        static_cast<const ModalHostViewShadowNode::ConcreteState&>(
            *shadowNode.getState())
            .getData();

    layoutableShadowNode.setSize(Size{
        .width = stateData.screenSize.width,
        .height = stateData.screenSize.height});
    layoutableShadowNode.setPositionType(YGPositionTypeAbsolute);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }

#ifdef ANDROID
  State::Shared createInitialState(
      const Props::Shared& props,
      const ShadowNodeFamily::Shared& family) const override;
#endif // ANDROID

 private:
  constexpr static auto UIManagerJavaDescriptor =
      "com/facebook/react/fabric/FabricUIManager";
};

} // namespace facebook::react
