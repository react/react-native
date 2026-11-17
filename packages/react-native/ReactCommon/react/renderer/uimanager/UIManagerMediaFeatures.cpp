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
 * The stored conditional values of a view, as JavaScript sends them, so that
 * `cloneProps` resolves them for the current media features.
 */
RawProps conditionalValuesAsRawProps(const folly::dynamic& conditionalValues) {
  folly::dynamic values =
      folly::dynamic::object(kHasConditionalValuesPropName, true);
  for (const auto& item : conditionalValues.items()) {
    values[item.first] =
        folly::dynamic::object(kConditionalValueKey, item.second);
  }
  return RawProps(std::move(values));
}

/*
 * Returns a clone of `shadowNode` in which every view with conditional values
 * resolves them again. Returns null if no view in the subtree has them.
 */
std::shared_ptr<ShadowNode> cloneViewsWithConditionalValues(
    const ShadowNode& shadowNode,
    const PropsParserContext& context) {
  const auto& children = shadowNode.getChildren();
  std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> newChildren;
  for (size_t index = 0; index < children.size(); index++) {
    if (auto newChild =
            cloneViewsWithConditionalValues(*children[index], context)) {
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
  if (props->conditionalValues != nullptr) {
    newProps = shadowNode.getComponentDescriptor().cloneProps(
        context, props, conditionalValuesAsRawProps(*props->conditionalValues));
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

RootShadowNode::Unshared UIManager::cloneWithResolvedConditionalValues(
    const RootShadowNode& rootShadowNode) const {
  PropsParserContext context{rootShadowNode.getSurfaceId(), *contextContainer_};
  return std::static_pointer_cast<RootShadowNode>(
      cloneViewsWithConditionalValues(rootShadowNode, context));
}

void UIManager::setMediaFeatures(MediaFeatures mediaFeatures) const {
  auto store = contextContainer_->find<std::shared_ptr<MediaFeaturesStore>>(
      kMediaFeaturesStoreKey);
  if (!store || (*store)->get() == mediaFeatures) {
    return;
  }
  (*store)->set(mediaFeatures);
  mediaFeaturesGeneration_++;

  shadowTreeRegistry_.enumerate(
      [&](const ShadowTree& shadowTree, bool& /*stop*/) {
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) {
              return cloneWithResolvedConditionalValues(oldRootShadowNode);
            },
            {});
      });
}

uint64_t UIManager::getReactMediaFeaturesGeneration(SurfaceId surfaceId) const {
  std::lock_guard lock(reactMediaFeaturesGenerationsMutex_);
  auto it = reactMediaFeaturesGenerations_.find(surfaceId);
  return it != reactMediaFeaturesGenerations_.end() ? it->second : 0;
}

void UIManager::setReactMediaFeaturesGeneration(
    SurfaceId surfaceId,
    uint64_t generation) const {
  std::lock_guard lock(reactMediaFeaturesGenerationsMutex_);
  reactMediaFeaturesGenerations_[surfaceId] = generation;
}

} // namespace facebook::react
