/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/components/keyboardavoidingview/KeyboardAvoidingViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <KeyboardAvoidingView> component.
 */
class KeyboardAvoidingViewComponentDescriptor final
    : public ConcreteComponentDescriptor<KeyboardAvoidingViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  void adopt(ShadowNode &shadowNode) const override
  {
    static_cast<KeyboardAvoidingViewShadowNode &>(shadowNode).applyKeyboardInset();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
