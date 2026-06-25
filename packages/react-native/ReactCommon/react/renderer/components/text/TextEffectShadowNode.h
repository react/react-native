/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/text/TextEffectProps.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/core/ConcreteShadowNode.h>

namespace facebook::react {

extern const char TextEffectComponentName[];

using TextEffectEventEmitter = TouchEventEmitter;

class TextEffectShadowNode
    : public ConcreteShadowNode<TextEffectComponentName, ShadowNode, TextEffectProps, TextEffectEventEmitter> {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
};

} // namespace facebook::react
