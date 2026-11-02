/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <deque>
#include <memory>
#include <optional>
#include <vector>

namespace facebook::react {

namespace {

struct ShadowNodeUpdateInfo {
  Tag tag;
  int depth;
  std::weak_ptr<const ShadowNode> node;
  // populate for node that needs props update
  std::optional<folly::dynamic> changedProps{};
  // populate for node that's also a ancestor node for updated nodes
  std::vector<int> updatedChildrenIndices{};
};

void addAncestorsToUpdateList(
    std::shared_ptr<const ShadowNode>& shadowNode,
    std::shared_ptr<const RootShadowNode>& rootShadowNode,
    std::vector<ShadowNodeUpdateInfo>& shadowNodesToUpdate) {
  // list of ancestors from root ShadowNode to current ShadowNode's parent
  auto ancestors = shadowNode->getFamily().getAncestors(*rootShadowNode);

  std::vector<std::shared_ptr<const ShadowNode>> ancestorShadowNodesShared{};
  ancestorShadowNodesShared.resize(ancestors.size());
  std::shared_ptr<const ShadowNode> currentShadowNode = rootShadowNode;
  auto ancestorIndex = 0;
  while (!currentShadowNode->getChildren().empty() &&
         currentShadowNode->getTag() != shadowNode->getTag()) {
    ancestorShadowNodesShared[ancestorIndex] = currentShadowNode;
    const auto& children = currentShadowNode->getChildren();
    auto childIndex = ancestors[ancestorIndex].second;
    currentShadowNode = children[childIndex];
    ancestorIndex++;
  }

  int ancestorDepth = static_cast<int>(ancestors.size() - 1);
  // iterate from current ShadowNode's parent to root ShadowNode
  for (auto iter = ancestors.rbegin(); iter != ancestors.rend(); ++iter) {
    auto& ancestorShadowNode = iter->first.get();
    auto ancestorTag = ancestorShadowNode.getTag();
    auto ancestorAddedToUpdateList = std::find_if(
        shadowNodesToUpdate.begin(),
        shadowNodesToUpdate.end(),
        [ancestorTag](const auto& elem) { return elem.tag == ancestorTag; });
    if (ancestorAddedToUpdateList == shadowNodesToUpdate.end()) {
      react_native_assert(
          ancestorShadowNodesShared[ancestorDepth]->getTag() ==
          ancestorShadowNode.getTag());
      shadowNodesToUpdate.push_back({
          .tag = ancestorShadowNode.getTag(),
          .depth = ancestorDepth,
          .node = ancestorShadowNodesShared[ancestorDepth],
          .updatedChildrenIndices = {iter->second},
      });
    } else {
      ancestorAddedToUpdateList->updatedChildrenIndices.push_back(iter->second);
    }
    ancestorDepth--;
  }
}

} // namespace

/* Commit a map of ShadowNode props to ShadowTree, with guarantee that each
 * ShadowNode is cloned only once in the commit.
 * The tree cloning algorithm is inspired by `cloneShadowTreeWithNewProps` in
 * https://github.com/software-mansion/react-native-reanimated/ (under MIT
 * license).
 */
void UIManager::updateShadowTree(
    std::unordered_map<Tag, folly::dynamic>&& tagToProps) {
  const auto& contextContainer = *contextContainer_;

  auto remainingTagToProps = std::move(tagToProps);

  if (delegate_ != nullptr) {
    delegate_->uiManagerDidUpdateShadowTree(remainingTagToProps);
  }

  getShadowTreeRegistry().enumerate([&](const ShadowTree& shadowTree,
                                        bool& stop) {
    if (remainingTagToProps.empty()) {
      stop = true;
      return;
    }

    auto rootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
    auto surfaceId = rootShadowNode->getSurfaceId();
    std::vector<ShadowNodeUpdateInfo> shadowNodesToUpdate;

    // Step 1: Create a list of shadow nodes to update
    // which includes all the ShadowNodes of tags in input map, plus all
    // their ancestors

    std::deque<std::shared_ptr<const ShadowNode>> deque{rootShadowNode};

    int depth = 0;
    while (!deque.empty()) {
      auto size = deque.size();
      for (auto i = 0; i < size; i++) {
        auto shadowNode = std::move(deque.front());
        deque.pop_front();

        if (auto nodesPropsIt = remainingTagToProps.find(shadowNode->getTag());
            nodesPropsIt != remainingTagToProps.end()) {
          auto shadowNodeTag = shadowNode->getTag();
          auto shadowNodeAddedToUpdateList = std::find_if(
              shadowNodesToUpdate.begin(),
              shadowNodesToUpdate.end(),
              [shadowNodeTag](const auto& elem) {
                return elem.tag == shadowNodeTag;
              });
          if (shadowNodeAddedToUpdateList == shadowNodesToUpdate.end()) {
            shadowNodesToUpdate.push_back(
                {.tag = shadowNodeTag,
                 .depth = depth,
                 .node = shadowNode,
                 .changedProps = nodesPropsIt->second});
          } else {
            shadowNodeAddedToUpdateList->changedProps = nodesPropsIt->second;
          }
          remainingTagToProps.erase(nodesPropsIt->first);

          // Add all its ancestors to shadowNodesToUpdate list
          addAncestorsToUpdateList(
              shadowNode, rootShadowNode, shadowNodesToUpdate);
        }
        for (const auto& child : shadowNode->getChildren()) {
          deque.push_back(child);
        }
      }
      depth++;
    }

    if (shadowNodesToUpdate.empty()) {
      return;
    }

    // Step 2: Clone nodes from children to ancestors

    std::sort(
        shadowNodesToUpdate.begin(),
        shadowNodesToUpdate.end(),
        [](const auto& a, const auto& b) { return a.depth > b.depth; });

    std::unordered_map<Tag, std::shared_ptr<ShadowNode>> clonedShadowNodes;

    for (auto& nodeUpdateInfo : shadowNodesToUpdate) {
      if (auto oldShadowNode = nodeUpdateInfo.node.lock()) {
        Props::Shared newProps;
        if (nodeUpdateInfo.changedProps) {
          PropsParserContext propsParserContext{surfaceId, contextContainer};
          auto componentDescriptor =
              componentDescriptorRegistry_
                  ->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
                      oldShadowNode->getComponentHandle());
          newProps = componentDescriptor->cloneProps(
              propsParserContext,
              oldShadowNode->getProps(),
              RawProps(nodeUpdateInfo.changedProps.value()));
        } else {
          newProps = oldShadowNode->getProps();
        }

        ShadowNodeFragment fragment;
        auto children = oldShadowNode->getChildren();

        // If children are previously updated (children should be cloned and
        // updated before parents), add it to the children list of ShadowNode
        for (auto& updatedChildIndex : nodeUpdateInfo.updatedChildrenIndices) {
          if (updatedChildIndex < children.size()) {
            auto childTag = children[updatedChildIndex]->getTag();
            auto clonedShadowNodesIt = clonedShadowNodes.find(childTag);
            if (clonedShadowNodesIt != clonedShadowNodes.end()) {
              children[updatedChildIndex] = clonedShadowNodesIt->second;
            } else {
              LOG(ERROR) << "Child ShadowNode has not been cloned";
            }
          } else {
            LOG(WARNING) << "Child no longer exits";
          }
        }

        auto cloned = oldShadowNode->clone(
            {.props = newProps,
             .children = std::make_shared<
                 std::vector<std::shared_ptr<const ShadowNode>>>(
                 std::move(children))});
        clonedShadowNodes.insert({oldShadowNode->getTag(), std::move(cloned)});
      } else {
        LOG(ERROR) << "oldShadowNode is null";
        continue;
      }
    }

    // Step 3: Commit ShadowTree

    if (auto it = clonedShadowNodes.find(rootShadowNode->getTag());
        it != clonedShadowNodes.end()) {
      shadowTree.commit(
          [rootNode =
               it->second](const RootShadowNode&) -> RootShadowNode::Unshared {
            return std::static_pointer_cast<RootShadowNode>(rootNode);
          },
          {});
    } else {
      LOG(ERROR) << "Root ShadowNode has not been cloned";
    }
  });
}

} // namespace facebook::react
