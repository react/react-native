/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ConditionalValues.h>

namespace facebook::react {

namespace {

/*
 * The stored conditional values of a view, as JavaScript sends them, so that
 * `cloneProps` resolves them for the current media features.
 */
RawProps conditionalValuesAsRawProps(const folly::dynamic& values) {
  folly::dynamic rawProps =
      folly::dynamic::object(kHasConditionalValuesPropName, true);
  for (const auto& item : values.items()) {
    rawProps[item.first] =
        folly::dynamic::object(kConditionalValueKey, item.second);
  }
  return RawProps(std::move(rawProps));
}

/*
 * Returns a clone of `shadowNode` in which every view with conditional values
 * that are outdated for `mediaFeatures` resolves them again. Returns null if
 * the subtree has none.
 */
std::shared_ptr<ShadowNode> cloneOutdatedViews(
    const ShadowNode& shadowNode,
    const PropsParserContext& context,
    const MediaFeatures& mediaFeatures) {
  if (!shadowNode.subtreeHasConditionalValues()) {
    return nullptr;
  }

  const auto& children = shadowNode.getChildren();
  std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> newChildren;
  for (size_t index = 0; index < children.size(); index++) {
    if (auto newChild =
            cloneOutdatedViews(*children[index], context, mediaFeatures)) {
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
      props->conditionalValues->isOutdatedFor(mediaFeatures)) {
    newProps = shadowNode.getComponentDescriptor().cloneProps(
        context,
        props,
        conditionalValuesAsRawProps(props->conditionalValues->values));
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

RootShadowNode::Unshared UIManager::resolveOutdatedConditionalValues(
    const RootShadowNode& rootShadowNode) const {
  if (!rootShadowNode.subtreeHasConditionalValues()) {
    return nullptr;
  }
  PropsParserContext context{rootShadowNode.getSurfaceId(), *contextContainer_};
  return std::static_pointer_cast<RootShadowNode>(cloneOutdatedViews(
      rootShadowNode, context, getMediaFeatures(contextContainer_.get())));
}

void UIManager::setMediaFeatures(MediaFeatures mediaFeatures) const {
  auto store = contextContainer_->find<std::shared_ptr<MediaFeaturesStore>>(
      kMediaFeaturesStoreKey);
  if (!store || (*store)->get() == mediaFeatures) {
    return;
  }
  (*store)->set(mediaFeatures);

  // `shadowTreeWillCommit` resolves the outdated values, so an empty commit is
  // enough. Commit every tree: a React commit in progress can add new ones.
  shadowTreeRegistry_.enumerate(
      [&](const ShadowTree& shadowTree, bool& /*stop*/) {
        shadowTree.commit(
            [](const RootShadowNode& oldRootShadowNode) {
              return std::make_shared<RootShadowNode>(
                  oldRootShadowNode, ShadowNodeFragment{});
            },
            {});
      });
}

} // namespace facebook::react
