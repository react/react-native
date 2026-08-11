/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFamily.h>

namespace facebook::react {

using MutationObserverId = int32_t;

struct MutationRecord {
  MutationObserverId mutationObserverId;
  std::shared_ptr<const ShadowNode> targetShadowNode;
  std::vector<std::shared_ptr<const ShadowNode>> addedShadowNodes;
  std::vector<std::shared_ptr<const ShadowNode>> removedShadowNodes;
};

class MutationObserver {
 public:
  explicit MutationObserver(MutationObserverId mutationObserverId);

  // delete copy constructor
  MutationObserver(const MutationObserver&) = delete;

  // delete copy assignment
  MutationObserver& operator=(const MutationObserver&) = delete;

  // allow move constructor
  MutationObserver(MutationObserver&&) = default;

  // allow move assignment
  MutationObserver& operator=(MutationObserver&&) = default;

  void observe(
      std::shared_ptr<const ShadowNodeFamily> targetShadowNodeFamily,
      bool observeSubtree);

  void recordMutations(
      const RootShadowNode& oldRootShadowNode,
      const RootShadowNode& newRootShadowNode,
      std::vector<MutationRecord>& recordedMutations) const;

 private:
  MutationObserverId mutationObserverId_;
  std::vector<std::shared_ptr<const ShadowNodeFamily>>
      deeplyObservedShadowNodeFamilies_;
  std::vector<std::shared_ptr<const ShadowNodeFamily>>
      shallowlyObservedShadowNodeFamilies_;

  using SetOfShadowNodePointers = std::unordered_set<const ShadowNode*>;

  void recordMutationsInTarget(
      const ShadowNodeFamily& targetShadowNodeFamily,
      const RootShadowNode& oldRootShadowNode,
      const RootShadowNode& newRootShadowNode,
      bool observeSubtree,
      std::vector<MutationRecord>& recordedMutations,
      SetOfShadowNodePointers& processedNodes) const;

  void recordMutationsInSubtrees(
      const std::shared_ptr<const ShadowNode>& oldNode,
      const std::shared_ptr<const ShadowNode>& newNode,
      bool observeSubtree,
      std::vector<MutationRecord>& recordedMutations,
      SetOfShadowNodePointers& processedNodes) const;
};

} // namespace facebook::react
