/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/components/scrollview/ScrollContentViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for the <ScrollContentView> component.
 */
class ScrollContentViewComponentDescriptor final : public ConcreteComponentDescriptor<ScrollContentViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode &shadowNode) const override
  {
    static_cast<ScrollContentViewShadowNode &>(shadowNode).applySafeAreaPadding();
    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
