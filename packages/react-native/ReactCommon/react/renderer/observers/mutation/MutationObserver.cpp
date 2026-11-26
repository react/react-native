/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MutationObserver.h"
#include <react/renderer/core/ShadowNodeTraits.h>
#include <react/renderer/uimanager/primitives.h>
#include <unordered_map>

namespace facebook::react {

MutationObserver::MutationObserver(MutationObserverId mutationObserverId)
    : mutationObserverId_(mutationObserverId) {}

void MutationObserver::observe(
    std::shared_ptr<const ShadowNodeFamily> targetShadowNodeFamily,
    bool observeSubtree) {
  auto& list = observeSubtree ? deeplyObservedShadowNodeFamilies_
                              : shallowlyObservedShadowNodeFamilies_;
  auto& otherList = observeSubtree ? shallowlyObservedShadowNodeFamilies_
                                   : deeplyObservedShadowNodeFamilies_;

  if (std::find(list.begin(), list.end(), targetShadowNodeFamily) !=
      list.end()) {
    // It is already being observed correctly.
    return;
  }

  auto it =
      std::find(otherList.begin(), otherList.end(), targetShadowNodeFamily);
  if (it != otherList.end()) {
    // It is being observed incorrectly.
    otherList.erase(it);
  }

  list.push_back(targetShadowNodeFamily);
}

static std::shared_ptr<const ShadowNode> getShadowNodeInTree(
    const ShadowNodeFamily& shadowNodeFamily,
    const ShadowNode& newTree) {
  auto ancestors = shadowNodeFamily.getAncestors(newTree);
  if (ancestors.empty()) {
    return nullptr;
  }

  auto pair = ancestors.rbegin();
  return pair->first.get().getChildren().at(pair->second);
}

static std::shared_ptr<const ShadowNode> findNodeOfSameFamily(
    const std::vector<std::shared_ptr<const ShadowNode>>& list,
    const ShadowNode& node) {
  for (auto& current : list) {
    if (ShadowNode::sameFamily(node, *current)) {
      return current;
    }
  }
  return nullptr;
}

void MutationObserver::recordMutations(
    const RootShadowNode& oldRootShadowNode,
    const RootShadowNode& newRootShadowNode,
    std::vector<MutationRecord>& recordedMutations) const {
  // This tracks the nodes that have already been processed by this observer,
  // so we avoid unnecessary work and duplicated entries.
  SetOfShadowNodePointers processedNodes;

  // We go over the deeply observed nodes first to avoid skipping nodes that
  // have only been checked shallowly.
  for (const auto& targetShadowNodeFamily : deeplyObservedShadowNodeFamilies_) {
    recordMutationsInTarget(
        *targetShadowNodeFamily,
        oldRootShadowNode,
        newRootShadowNode,
        true,
        recordedMutations,
        processedNodes);
  }

  for (const auto& targetShadowNodeFamily :
       shallowlyObservedShadowNodeFamilies_) {
    recordMutationsInTarget(
        *targetShadowNodeFamily,
        oldRootShadowNode,
        newRootShadowNode,
        false,
        recordedMutations,
        processedNodes);
  }
}

void MutationObserver::recordMutationsInTarget(
    const ShadowNodeFamily& targetShadowNodeFamily,
    const RootShadowNode& oldRootShadowNode,
    const RootShadowNode& newRootShadowNode,
    bool observeSubtree,
    std::vector<MutationRecord>& recordedMutations,
    SetOfShadowNodePointers& processedNodes) const {
  // If the node isnt't present in the old tree, it's either:
  // - A new node. In that case, the mutation happened in its parent, not in the
  //   node itself.
  // - A non-existent node. In that case, there are no new mutations.
  auto oldTargetShadowNode =
      getShadowNodeInTree(targetShadowNodeFamily, oldRootShadowNode);
  if (!oldTargetShadowNode) {
    return;
  }

  // If the node isn't present in the new tree (and we didn't return in the
  // previous check), it means the whole node was removed. In that case we don't
  // record any mutations in the node itself (maybe in its parent if there are
  // other observers set up).
  auto newTargetShadowNode =
      getShadowNodeInTree(targetShadowNodeFamily, newRootShadowNode);
  if (!newTargetShadowNode) {
    return;
  }

  recordMutationsInSubtrees(
      oldTargetShadowNode,
      newTargetShadowNode,
      observeSubtree,
      recordedMutations,
      processedNodes);
}

void MutationObserver::recordMutationsInSubtrees(
    const std::shared_ptr<const ShadowNode>& oldNode,
    const std::shared_ptr<const ShadowNode>& newNode,
    bool observeSubtree,
    std::vector<MutationRecord>& recordedMutations,
    SetOfShadowNodePointers& processedNodes) const {
  bool isSameNode = oldNode.get() == newNode.get();
  // If the nodes are referentially equal, their children are also the same.
  if (isSameNode ||
      processedNodes.find(oldNode.get()) != processedNodes.end()) {
    return;
  }

  processedNodes.insert(oldNode.get());

  const auto& oldChildren = oldNode->getChildren();
  const auto& newChildren = newNode->getChildren();

  if (&oldChildren == &newChildren) {
    return;
  }

  struct ChildMatch {
    size_t index;
    bool seenInOld{false};
  };
  const bool useIndex = oldChildren.size() >= 16 && newChildren.size() >= 16;
  std::unordered_map<const ShadowNodeFamily*, ChildMatch> newChildMatches;
  if (useIndex) {
    newChildMatches.reserve(newChildren.size());
    for (size_t i = 0; i < newChildren.size(); ++i) {
      newChildMatches.try_emplace(
          &newChildren[i]->getFamily(), ChildMatch{.index = i});
    }
  }

  const auto findNewChild = [&](const ShadowNode& oldChild) {
    if (!useIndex) {
      return findNodeOfSameFamily(newChildren, oldChild);
    }
    const auto it = newChildMatches.find(&oldChild.getFamily());
    if (it == newChildMatches.end()) {
      return std::shared_ptr<const ShadowNode>{};
    }
    it->second.seenInOld = true;
    return newChildren[it->second.index];
  };

  std::vector<std::shared_ptr<const ShadowNode>> addedNodes;
  std::vector<std::shared_ptr<const ShadowNode>> removedNodes;

  // Check for removed nodes (and equal nodes for further inspection)
  for (const auto& oldChild : oldChildren) {
    const auto newChild = findNewChild(*oldChild);
    if (!newChild) {
      removedNodes.push_back(oldChild);
    } else if (observeSubtree) {
      // Nodes are present in both tress. If `subtree` is set to true,
      // we continue checking their children.
      recordMutationsInSubtrees(
          oldChild,
          newChild,
          observeSubtree,
          recordedMutations,
          processedNodes);
    }
  }

  // Check for added nodes
  for (const auto& newChild : newChildren) {
    const bool isAdded = useIndex
        ? !newChildMatches.at(&newChild->getFamily()).seenInOld
        : !findNodeOfSameFamily(oldChildren, *newChild);
    if (isAdded) {
      addedNodes.push_back(newChild);
    }
  }

  if (!addedNodes.empty() || !removedNodes.empty()) {
    recordedMutations.emplace_back(
        MutationRecord{
            .mutationObserverId = mutationObserverId_,
            .targetShadowNode = oldNode,
            .addedShadowNodes = std::move(addedNodes),
            .removedShadowNodes = std::move(removedNodes)});
  }
}

} // namespace facebook::react
