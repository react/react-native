/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/safeareaview/SafeAreaViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <SafeAreaView> component.
 */
class SafeAreaViewComponentDescriptor final
    : public ConcreteComponentDescriptor<SafeAreaViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  void adopt(ShadowNode& shadowNode) const override {
    auto& layoutableShadowNode =
        static_cast<YogaLayoutableShadowNode&>(shadowNode);
    auto& stateData = static_cast<const SafeAreaViewShadowNode::ConcreteState&>(
                          *shadowNode.getState())
                          .getData();
    layoutableShadowNode.setPadding(stateData.padding);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
