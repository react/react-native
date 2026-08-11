/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/components/root/RootProps.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/PropsParserContext.h>

namespace facebook::react {

class RootShadowNode;

extern const char RootComponentName[];

/*
 * `ShadowNode` for the root component.
 * Besides all functionality of the `View` component, `RootShadowNode` contains
 * props which represent external layout constraints and context of the
 * shadow tree.
 */
class RootShadowNode final
    : public ConcreteViewShadowNode<RootComponentName, RootProps> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  using Shared = std::shared_ptr<const RootShadowNode>;
  using Unshared = std::shared_ptr<RootShadowNode>;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }

  /*
   * Layouts the shadow tree if needed.
   * Returns `false` if the three is already laid out.
   */
  bool layoutIfNeeded(
      std::vector<const LayoutableShadowNode*>* affectedNodes = {});

  /*
   * Clones the node with given `layoutConstraints` and `layoutContext`.
   */
  RootShadowNode::Unshared clone(
      const PropsParserContext& propsParserContext,
      const LayoutConstraints& layoutConstraints,
      const LayoutContext& layoutContext) const;

  Transform getTransform() const override;

  void setInstanceHandle(InstanceHandle::Shared instanceHandle) const;
};

} // namespace facebook::react
