/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PointerHoverTracker.h"

#include <utility>

namespace facebook::react {

using EventPath = PointerHoverTracker::EventPath;

PointerHoverTracker::PointerHoverTracker(
    std::shared_ptr<const ShadowNode> target,
    const UIManager& uiManager)
    : target_(std::move(target)) {
  if (target_ != nullptr) {
    // Retrieve the root shadow node at this current revision so that we can
    // leverage it to get the event path list at the moment the event occurred
    auto rootShadowNode = std::shared_ptr<const ShadowNode>{};
    auto& shadowTreeRegistry = uiManager.getShadowTreeRegistry();
    shadowTreeRegistry.visit(
        target_->getSurfaceId(),
        [&rootShadowNode](const ShadowTree& shadowTree) {
          rootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
        });
    this->root_ = rootShadowNode;
  }
}

bool PointerHoverTracker::hasSameTarget(
    const PointerHoverTracker& other) const {
  if (target_ != nullptr && other.target_ != nullptr) {
    return ShadowNode::sameFamily(*this->target_, *other.target_);
  }
  return false;
}

bool PointerHoverTracker::areAnyTargetsListeningToEvents(
    std::initializer_list<ViewEvents::Offset> eventTypes,
    const UIManager& uiManager) const {
  auto eventPath = getEventPathTargets();

  for (const auto& oldTarget : eventPath) {
    auto newestTarget = uiManager.getNewestCloneOfShadowNode(oldTarget);
    if (newestTarget &&
        newestTarget->getTraits().check(ShadowNodeTraits::Trait::ViewKind)) {
      auto eventFlags =
          static_cast<const ViewProps&>(*newestTarget->getProps()).events;
      for (const auto& eventType : eventTypes) {
        if (eventFlags[eventType]) {
          return true;
        }
      }
    }
  }

  return false;
}

std::tuple<EventPath, EventPath> PointerHoverTracker::diffEventPath(
    const PointerHoverTracker& other,
    const UIManager& uiManager) const {
  auto myEventPath = getEventPathTargets();
  auto otherEventPath = other.getEventPathTargets();

  // Starting from the root node, iterate through both event paths, comparing
  // the nodes' families until a difference is found, and then just break out of
  // the loop early. This will leave the iterators for each path at the point
  // where the event paths diverge and can be subsequently used as the beginning
  // iterator of a subrange, where the subrange on *this* tracker would
  // represent the removed views, and the subrange on *other* tracker would
  // represent the added views.
  //
  // NOTE: This works based on the assumption that nodes in react-native don't
  // get "re-parented" so if there are any bugs reported due to extra
  // leave->enter events, this solution may need to be revisited with a more
  // robust diffing solution.
  auto myIt = myEventPath.rbegin();
  auto otherIt = otherEventPath.rbegin();
  while (myIt != myEventPath.rend() && otherIt != otherEventPath.rend()) {
    if (!ShadowNode::sameFamily(myIt->get(), otherIt->get())) {
      break;
    }
    ++myIt;
    ++otherIt;
  }

  EventPath removed;
  for (auto nodeIt = myIt; nodeIt != myEventPath.rend(); nodeIt++) {
    const auto& latestNode = getLatestNode(*nodeIt, uiManager);
    if (latestNode != nullptr) {
      removed.emplace_back(*latestNode);
    }
  }

  EventPath added;
  for (auto nodeIt = otherIt; nodeIt != otherEventPath.rend(); nodeIt++) {
    const auto& latestNode = other.getLatestNode(*nodeIt, uiManager);
    if (latestNode != nullptr) {
      added.emplace_back(*latestNode);
    }
  }

  return std::make_tuple(removed, added);
}

const ShadowNode* PointerHoverTracker::getTarget(
    const UIManager& uiManager) const {
  if (target_ == nullptr) {
    return nullptr;
  }
  return getLatestNode(*target_, uiManager);
}

void PointerHoverTracker::markAsOld() {
  isOldTracker_ = true;
}

const ShadowNode* PointerHoverTracker::getLatestNode(
    const ShadowNode& node,
    const UIManager& uiManager) const {
  if (isOldTracker_) {
    auto newestTarget = uiManager.getNewestCloneOfShadowNode(node);
    return newestTarget.get();
  }
  return &node;
}

EventPath PointerHoverTracker::getEventPathTargets() const {
  EventPath result{};
  if (target_ == nullptr || root_ == nullptr) {
    return result;
  }

  auto ancestors = target_->getFamily().getAncestors(*root_);

  result.emplace_back(*target_);
  for (auto it = ancestors.rbegin(); it != ancestors.rend(); it++) {
    result.push_back(it->first);
  }

  return result;
}

} // namespace facebook::react
