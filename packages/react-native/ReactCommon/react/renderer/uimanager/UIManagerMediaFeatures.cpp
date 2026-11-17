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

void UIManager::setMediaFeatures(MediaFeatures mediaFeatures) const {
  auto store = contextContainer_->find<std::shared_ptr<MediaFeaturesStore>>(
      kMediaFeaturesStoreKey);
  if (!store || (*store)->get() == mediaFeatures) {
    return;
  }
  (*store)->set(mediaFeatures);
  mediaFeaturesGeneration_++;

  shadowTreeRegistry_.enumerate([&](const ShadowTree& shadowTree,
                                    bool& /*stop*/) {
    PropsParserContext context{shadowTree.getSurfaceId(), *contextContainer_};
    shadowTree.commit(
        [&](const RootShadowNode& oldRootShadowNode)
            -> RootShadowNode::Unshared {
          return std::static_pointer_cast<RootShadowNode>(
              cloneViewsWithConditionalValues(oldRootShadowNode, context));
        },
        {});
  });
}

RootShadowNode::Unshared UIManager::resolveConditionalValuesInReactCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Unshared& rootShadowNode) const {
  auto generation = mediaFeaturesGeneration_.load();
  if (generation == 0) {
    return rootShadowNode;
  }
  auto surfaceId = shadowTree.getSurfaceId();
  {
    std::lock_guard lock(mediaFeaturesCommitStatesMutex_);
    if (mediaFeaturesCommitStates_[surfaceId].resolvedGeneration ==
        generation) {
      return rootShadowNode;
    }
  }

  PropsParserContext context{surfaceId, *contextContainer_};
  auto newRootShadowNode =
      cloneViewsWithConditionalValues(*rootShadowNode, context);
  auto resultRootShadowNode = newRootShadowNode
      ? std::static_pointer_cast<RootShadowNode>(newRootShadowNode)
      : rootShadowNode;

  // The commit can still fail and run again, so the generation is resolved only
  // when this root is committed.
  std::lock_guard lock(mediaFeaturesCommitStatesMutex_);
  auto& state = mediaFeaturesCommitStates_[surfaceId];
  state.pendingGeneration = generation;
  state.pendingRootShadowNode = resultRootShadowNode;
  return resultRootShadowNode;
}

void UIManager::reactCommitDidResolveConditionalValues(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& rootShadowNode) const {
  std::lock_guard lock(mediaFeaturesCommitStatesMutex_);
  auto it = mediaFeaturesCommitStates_.find(shadowTree.getSurfaceId());
  if (it == mediaFeaturesCommitStates_.end()) {
    return;
  }
  auto& state = it->second;
  if (state.pendingRootShadowNode.lock() == rootShadowNode) {
    state.resolvedGeneration = state.pendingGeneration;
    state.pendingRootShadowNode.reset();
  }
}

} // namespace facebook::react
