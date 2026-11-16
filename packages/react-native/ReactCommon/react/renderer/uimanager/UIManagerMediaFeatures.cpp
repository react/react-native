/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <react/renderer/components/root/RootShadowNode.h>

namespace facebook::react {

namespace {

/*
 * Returns a clone of `shadowNode` in which the views with conditional values
 * resolved for other media features are resolved for `mediaFeatures`. Returns
 * null if no view in the subtree changes.
 */
std::shared_ptr<ShadowNode> cloneStaleViews(
    const ShadowNode& shadowNode,
    const PropsParserContext& context,
    const MediaFeatures& mediaFeatures) {
  const auto& children = shadowNode.getChildren();
  std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> newChildren;
  for (size_t index = 0; index < children.size(); index++) {
    if (auto newChild =
            cloneStaleViews(*children[index], context, mediaFeatures)) {
      if (!newChildren) {
        newChildren =
            std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
                children);
      }
      (*newChildren)[index] = std::move(newChild);
    }
  }

  Props::Shared newProps;
  const auto& props = shadowNode.getProps();
  if (props->conditionalValues != nullptr &&
      props->conditionalValuesFeatures != mediaFeatures) {
    // Without new props, `cloneProps` resolves the stale values again.
    newProps =
        shadowNode.getComponentDescriptor().cloneProps(context, props, {});
  }

  if (!newChildren && !newProps) {
    return nullptr;
  }
  return shadowNode.clone({
      .props = newProps ? newProps : ShadowNodeFragment::propsPlaceholder(),
      .children =
          newChildren ? newChildren : ShadowNodeFragment::childrenPlaceholder(),
  });
}

} // namespace

void UIManager::setMediaFeatures(MediaFeatures mediaFeatures) const {
  auto store = contextContainer_->find<std::shared_ptr<MediaFeaturesStore>>(
      kMediaFeaturesStoreKey);
  if (!store || (*store)->get() == mediaFeatures) {
    return;
  }
  (*store)->set(mediaFeatures);

  shadowTreeRegistry_.enumerate([&](const ShadowTree& shadowTree,
                                    bool& /*stop*/) {
    PropsParserContext context{shadowTree.getSurfaceId(), *contextContainer_};
    shadowTree.commit(
        [&](const RootShadowNode& oldRootShadowNode)
            -> RootShadowNode::Unshared {
          return std::static_pointer_cast<RootShadowNode>(
              cloneStaleViews(oldRootShadowNode, context, mediaFeatures));
        },
        {});
  });
}

} // namespace facebook::react
