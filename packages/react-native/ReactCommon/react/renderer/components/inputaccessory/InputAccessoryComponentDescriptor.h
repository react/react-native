/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/components/inputaccessory/InputAccessoryShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <InputAccessoryView> component.
 */
class InputAccessoryComponentDescriptor final
    : public ConcreteComponentDescriptor<InputAccessoryShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode& shadowNode) const override {
    auto& layoutableShadowNode =
        static_cast<YogaLayoutableShadowNode&>(shadowNode);

    auto& stateData =
        static_cast<const InputAccessoryShadowNode::ConcreteState&>(
            *shadowNode.getState())
            .getData();

    layoutableShadowNode.setSize(Size{
        .width = stateData.viewportSize.width,
        .height = stateData.viewportSize.height});
    layoutableShadowNode.setPositionType(YGPositionTypeAbsolute);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
