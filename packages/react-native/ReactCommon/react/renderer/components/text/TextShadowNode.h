/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <react/renderer/components/text/BaseTextShadowNode.h>
#include <react/renderer/components/text/TextProps.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/core/ConcreteShadowNode.h>

namespace facebook::react {

extern const char TextComponentName[];

using TextEventEmitter = TouchEventEmitter;

class TextShadowNode : public ConcreteShadowNode<
                           TextComponentName,
                           ShadowNode,
                           TextProps,
                           TextEventEmitter>,
                       public BaseTextShadowNode {
 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteShadowNode::BaseTraits();
#ifdef ANDROID
    traits.set(ShadowNodeTraits::Trait::FormsView);
#endif
    return traits;
  }

  using ConcreteShadowNode::ConcreteShadowNode;

#ifdef ANDROID
  using BaseShadowNode = ConcreteShadowNode<
      TextComponentName,
      ShadowNode,
      TextProps,
      TextEventEmitter>;

  TextShadowNode(
      const ShadowNodeFragment& fragment,
      const ShadowNodeFamily::Shared& family,
      ShadowNodeTraits traits)
      : BaseShadowNode(fragment, family, traits), BaseTextShadowNode() {
    orderIndex_ = std::numeric_limits<decltype(orderIndex_)>::max();
  }
#endif
};

} // namespace facebook::react
