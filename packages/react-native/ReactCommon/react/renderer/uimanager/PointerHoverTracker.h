/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <initializer_list>
#include <memory>

#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

class PointerHoverTracker {
 public:
  using Unique = std::unique_ptr<PointerHoverTracker>;
  using EventPath = std::vector<std::reference_wrapper<const ShadowNode>>;

  PointerHoverTracker(
      std::shared_ptr<const ShadowNode> target,
      const UIManager& uiManager);

  const ShadowNode* getTarget(const UIManager& uiManager) const;
  bool hasSameTarget(const PointerHoverTracker& other) const;
  bool areAnyTargetsListeningToEvents(
      std::initializer_list<ViewEvents::Offset> eventTypes,
      const UIManager& uiManager) const;

  /**
   * Performs a diff between the current and given trackers and returns a tuple
   * containing [1]: the nodes that have been removed and [2]: the nodes that
   * have been added. Note that the order of these lists are from parents ->
   * children.
   */
  std::tuple<EventPath, EventPath> diffEventPath(
      const PointerHoverTracker& other,
      const UIManager& uiManager) const;

  void markAsOld();

 private:
  /**
   * Flag that lets the tracker know if it needs to fetch the latest version of
   * the shadow node or not.
   */
  bool isOldTracker_ = false;

  std::shared_ptr<const ShadowNode> root_;
  std::shared_ptr<const ShadowNode> target_;

  /**
   * A thin wrapper around `UIManager::getNewestCloneOfShadowNode` that only
   * actually gets the newest clone only if the tracker is marked as "old".
   */
  const ShadowNode* getLatestNode(
      const ShadowNode& node,
      const UIManager& uiManager) const;

  /**
   * Retrieves the list of shadow node references in the event's path starting
   * from the target node to the root node.
   */
  EventPath getEventPathTargets() const;
};

} // namespace facebook::react
