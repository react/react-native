/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StyleConditionResolver.h"

#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/StyleConditionData.h>

#include <utility>
#include <vector>

namespace facebook::react {

std::shared_ptr<const ShadowNode> resolveStyleConditionsInSubtree(
    const std::shared_ptr<const ShadowNode>& node,
    ColorScheme colorScheme,
    Orientation orientation,
    const PropsParserContext& propsParserContext) {
  // Return early: a node without this trait has no conditional styles anywhere in its
  // subtree, so nothing here can re-resolve. This makes the walk cost
  // proportional to the paths reaching conditional nodes rather than the whole
  // tree. The trait is maintained in the `ShadowNode` constructors.
  if (!node->getTraits().check(
          ShadowNodeTraits::Trait::HasStyleConditionsInSubtree)) {
    return node;
  }

  auto newChildren = std::vector<std::shared_ptr<const ShadowNode>>{};
  auto areChildrenChanged = false;
  const auto& children = node->getChildren();
  for (size_t i = 0; i < children.size(); i++) {
    auto newChild = resolveStyleConditionsInSubtree(
        children[i], colorScheme, orientation, propsParserContext);
    if (newChild != children[i]) {
      if (!areChildrenChanged) {
        newChildren = children;
        areChildrenChanged = true;
      }
      newChildren[i] = std::move(newChild);
    }
  }

  Props::Shared newProps = nullptr;
  const auto& data = node->getProps()->styleConditionData;
  if (data && data->styleConditionProps && !data->styleConditionProps->empty()) {
    auto resolution = evaluateStyleConditions(
        *data->styleConditionProps, colorScheme, orientation);
    if (resolution != data->resolution) {
      auto resolvedProps =
          node->getComponentDescriptor().applyStyleConditionResolution(
              propsParserContext, node->getProps(), resolution);
      if (resolvedProps != node->getProps()) {
        newProps = std::move(resolvedProps);
      }
    }
  }

  if (!areChildrenChanged && newProps == nullptr) {
    return node;
  }

  return node->clone(ShadowNodeFragment{
      .props = newProps != nullptr ? newProps
                                   : ShadowNodeFragment::propsPlaceholder(),
      .children = areChildrenChanged
          ? std::make_shared<
                const std::vector<std::shared_ptr<const ShadowNode>>>(
                std::move(newChildren))
          : ShadowNodeFragment::childrenPlaceholder(),
      // Preserve the original state of the node.
      .state = node->getState(),
  });
}

} // namespace facebook::react
