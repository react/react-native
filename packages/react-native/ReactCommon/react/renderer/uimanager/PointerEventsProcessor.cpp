/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PointerEventsProcessor.h"

#include <glog/logging.h>
#include <react/renderer/bridging/bridging.h>

namespace facebook::react {

std::shared_ptr<const ShadowNode>
PointerEventsProcessor::getShadowNodeFromEventTarget(
    jsi::Runtime& runtime,
    EventTarget* target) {
  if (target != nullptr) {
    target->retain(runtime);
    auto instanceHandle = target->getInstanceHandle(runtime);
    target->release(runtime);
    if (instanceHandle.isObject()) {
      auto handleObj = instanceHandle.asObject(runtime);
      if (handleObj.hasProperty(runtime, "stateNode")) {
        auto stateNode = handleObj.getProperty(runtime, "stateNode");
        if (stateNode.isObject()) {
          auto stateNodeObj = stateNode.asObject(runtime);
          if (stateNodeObj.hasProperty(runtime, "node")) {
            auto node = stateNodeObj.getProperty(runtime, "node");
            if (node.isObject()) {
              return Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, node);
            }
          }
        }
      }
    }
  }
  return nullptr;
}

static bool isViewListeningToEvents(
    const ShadowNode& shadowNode,
    std::initializer_list<ViewEvents::Offset> eventTypes) {
  if (shadowNode.getTraits().check(ShadowNodeTraits::Trait::ViewKind)) {
    auto& viewProps = static_cast<const ViewProps&>(*shadowNode.getProps());
    for (const ViewEvents::Offset eventType : eventTypes) {
      if (viewProps.events[eventType]) {
        return true;
      }
    }
  }
  return false;
}

static bool isAnyViewInPathToRootListeningToEvents(
    const UIManager& uiManager,
    const ShadowNode& shadowNode,
    std::initializer_list<ViewEvents::Offset> eventTypes) {
  // Check the target view first
  if (isViewListeningToEvents(shadowNode, eventTypes)) {
    return true;
  }

  // Retrieve the node's root & a list of nodes between the target and the root
  auto owningRootShadowNode = std::shared_ptr<const ShadowNode>{};
  uiManager.getShadowTreeRegistry().visit(
      shadowNode.getSurfaceId(),
      [&owningRootShadowNode](const ShadowTree& shadowTree) {
        owningRootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  if (owningRootShadowNode == nullptr) {
    return false;
  }

  auto& nodeFamily = shadowNode.getFamily();
  auto ancestors = nodeFamily.getAncestors(*owningRootShadowNode);

  // Check for listeners from the target's parent to the root
  for (auto it = ancestors.rbegin(); it != ancestors.rend(); it++) {
    auto& currentNode = it->first.get();
    if (isViewListeningToEvents(currentNode, eventTypes)) {
      return true;
    }
  }

  return false;
}

static PointerEventTarget retargetPointerEvent(
    const PointerEvent& event,
    const ShadowNode& nodeToTarget,
    const UIManager& uiManager) {
  PointerEvent retargetedEvent(event);

  // TODO: is dereferencing latestNodeToTarget without null checking safe?
  auto latestNodeToTarget = uiManager.getNewestCloneOfShadowNode(nodeToTarget);

  // Adjust offsetX/Y to be relative to the retargeted node
  // HACK: This is a basic/incomplete implementation which simply subtracts
  // the retargeted node's origin from the original event's client coordinates.
  // More work will be needed to properly take non-trival transforms into
  // account.
  auto layoutMetrics = uiManager.getRelativeLayoutMetrics(
      *latestNodeToTarget,
      nullptr,
      {/* .includeTransform */ .includeTransform = true});
  retargetedEvent.offsetPoint = {
      .x = event.clientPoint.x - layoutMetrics.frame.origin.x,
      .y = event.clientPoint.y - layoutMetrics.frame.origin.y,
  };

  PointerEventTarget result = {};
  result.event = retargetedEvent;
  result.target = latestNodeToTarget;
  return result;
}

static std::shared_ptr<const ShadowNode> getCaptureTargetOverride(
    PointerIdentifier pointerId,
    CaptureTargetOverrideRegistry& registry) {
  auto pendingPointerItr = registry.find(pointerId);
  if (pendingPointerItr == registry.end()) {
    return nullptr;
  }

  std::weak_ptr<const ShadowNode> maybeTarget = pendingPointerItr->second;
  if (maybeTarget.expired()) {
    // target has expired so it should functionally behave the same as if it
    // was removed from the override list.
    registry.erase(pointerId);
    return nullptr;
  }

  return maybeTarget.lock();
}

/*
 * Centralized method which determines if an event should be sent to JS by
 * inspecing the listeners in the target's view path.
 */
static bool shouldEmitPointerEvent(
    const ShadowNode& targetNode,
    const std::string& type,
    const UIManager& uiManager) {
  if (type == "topPointerDown") {
    return isAnyViewInPathToRootListeningToEvents(
        uiManager,
        targetNode,
        {ViewEvents::Offset::PointerDown,
         ViewEvents::Offset::PointerDownCapture});
  } else if (type == "topPointerUp") {
    return isAnyViewInPathToRootListeningToEvents(
        uiManager,
        targetNode,
        {ViewEvents::Offset::PointerUp, ViewEvents::Offset::PointerUpCapture});
  } else if (type == "topPointerMove") {
    return isAnyViewInPathToRootListeningToEvents(
        uiManager,
        targetNode,
        {ViewEvents::Offset::PointerMove,
         ViewEvents::Offset::PointerMoveCapture});
  } else if (type == "topPointerEnter") {
    // This event goes through the capturing phase in full but only bubble
    // through the target and no futher up the tree
    return isViewListeningToEvents(
               targetNode, {ViewEvents::Offset::PointerEnter}) ||
        isAnyViewInPathToRootListeningToEvents(
               uiManager,
               targetNode,
               {ViewEvents::Offset::PointerEnterCapture});
  } else if (type == "topPointerLeave") {
    // This event goes through the capturing phase in full but only bubble
    // through the target and no futher up the tree
    return isViewListeningToEvents(
               targetNode, {ViewEvents::Offset::PointerLeave}) ||
        isAnyViewInPathToRootListeningToEvents(
               uiManager,
               targetNode,
               {ViewEvents::Offset::PointerLeaveCapture});
  } else if (type == "topPointerOver") {
    return isAnyViewInPathToRootListeningToEvents(
        uiManager,
        targetNode,
        {ViewEvents::Offset::PointerOver,
         ViewEvents::Offset::PointerOverCapture});
  } else if (type == "topPointerOut") {
    return isAnyViewInPathToRootListeningToEvents(
        uiManager,
        targetNode,
        {ViewEvents::Offset::PointerOut,
         ViewEvents::Offset::PointerOutCapture});
  } else if (type == "topClick") {
    return isAnyViewInPathToRootListeningToEvents(
        uiManager,
        targetNode,
        {ViewEvents::Offset::Click, ViewEvents::Offset::ClickCapture});
  }
  // This is more of an optimization method so if we encounter a type which
  // has not been specifically addressed above we should just let it through.
  return true;
}

void PointerEventsProcessor::interceptPointerEvent(
    const std::shared_ptr<const ShadowNode>& target,
    const std::string& type,
    ReactEventPriority priority,
    const PointerEvent& event,
    const DispatchEvent& eventDispatcher,
    const UIManager& uiManager) {
  // Process all pending pointer capture assignments
  processPendingPointerCapture(event, eventDispatcher, uiManager);

  PointerEvent pointerEvent(event);
  std::shared_ptr<const ShadowNode> targetNode = target;

  // Retarget the event if it has a pointer capture override target
  auto overrideTarget = getCaptureTargetOverride(
      pointerEvent.pointerId, pendingPointerCaptureTargetOverrides_);
  if (overrideTarget != nullptr &&
      overrideTarget->getTag() != targetNode->getTag()) {
    auto retargeted =
        retargetPointerEvent(pointerEvent, *overrideTarget, uiManager);

    pointerEvent = retargeted.event;
    targetNode = retargeted.target;
  }

  if (type == "topClick") {
    // Click events are synthetic so should just be passed on instead of going
    // through any sort of processing.
    eventDispatcher(*targetNode, type, priority, pointerEvent);
    return;
  }

  if (type == "topPointerDown") {
    registerActivePointer(pointerEvent);
  } else if (type == "topPointerMove") {
    // TODO: Remove the need for this check by properly handling
    // pointerenter/pointerleave events emitted from the native platform
    if (getActivePointer(pointerEvent.pointerId) != nullptr) {
      updateActivePointer(pointerEvent);
    }
  }

  // Getting a pointerleave event from the platform is a special case telling us
  // that the pointer has left the root so we don't forward the event raw but
  // instead just run through our hover tracking logic with a null target.
  //
  // Notably: we do not forward the platform's leave event but instead will emit
  // leave events through our unified hover tracking logic.
  if (type == "topPointerLeave") {
    handleIncomingPointerEventOnNode(
        pointerEvent, nullptr, eventDispatcher, uiManager);
  } else {
    handleIncomingPointerEventOnNode(
        pointerEvent, targetNode, eventDispatcher, uiManager);
    if (shouldEmitPointerEvent(*targetNode, type, uiManager)) {
      eventDispatcher(*targetNode, type, priority, pointerEvent);
    }

    // All pointercancel events and certain pointerup events (when using an
    // direct pointer w/o the concept of hover) should be treated as the
    // pointer leaving the device entirely so we go through our hover tracking
    // logic again but pass in a null target.
    auto activePointer = getActivePointer(pointerEvent.pointerId);
    if (type == "topPointerCancel" ||
        (type == "topPointerUp" && activePointer != nullptr &&
         activePointer->shouldLeaveWhenReleased)) {
      handleIncomingPointerEventOnNode(
          pointerEvent, nullptr, eventDispatcher, uiManager);
    }
  }

  // Implicit pointer capture release
  if (overrideTarget != nullptr &&
      (type == "topPointerUp" || type == "topPointerCancel")) {
    releasePointerCapture(pointerEvent.pointerId, overrideTarget.get());
    processPendingPointerCapture(pointerEvent, eventDispatcher, uiManager);
  }

  if (type == "topPointerUp" || type == "topPointerCancel") {
    unregisterActivePointer(pointerEvent);
  }
}

void PointerEventsProcessor::setPointerCapture(
    PointerIdentifier pointerId,
    const std::shared_ptr<const ShadowNode>& shadowNode) {
  if (auto activePointer = getActivePointer(pointerId)) {
    // As per the spec this method should silently fail if the pointer in
    // question does not have any active buttons
    if (activePointer->event.buttons == 0) {
      return;
    }

    pendingPointerCaptureTargetOverrides_[pointerId] = shadowNode;
  } else {
    // TODO: Throw DOMException with name "NotFoundError" when pointerId does
    // not match any of the active pointers
  }
}

void PointerEventsProcessor::releasePointerCapture(
    PointerIdentifier pointerId,
    const ShadowNode* shadowNode) {
  if (getActivePointer(pointerId) != nullptr) {
    // We only clear the pointer's capture target override if release was called
    // on the shadowNode which has the capture override, otherwise the result
    // should no-op
    auto pendingTarget = getCaptureTargetOverride(
        pointerId, pendingPointerCaptureTargetOverrides_);
    if (pendingTarget != nullptr &&
        pendingTarget->getTag() == shadowNode->getTag()) {
      pendingPointerCaptureTargetOverrides_.erase(pointerId);
    }
  } else {
    // TODO: Throw DOMException with name "NotFoundError" when pointerId does
    // not match any of the active pointers
  }
}

bool PointerEventsProcessor::hasPointerCapture(
    PointerIdentifier pointerId,
    const ShadowNode* shadowNode) {
  std::shared_ptr<const ShadowNode> pendingTarget = getCaptureTargetOverride(
      pointerId, pendingPointerCaptureTargetOverrides_);
  if (pendingTarget != nullptr) {
    return pendingTarget->getTag() == shadowNode->getTag();
  }
  return false;
}

ActivePointer* PointerEventsProcessor::getActivePointer(
    PointerIdentifier pointerId) {
  auto it = activePointers_.find(pointerId);
  return (it == activePointers_.end()) ? nullptr : &it->second;
}

void PointerEventsProcessor::registerActivePointer(const PointerEvent& event) {
  ActivePointer activePointer = {};
  activePointer.event = event;

  // If the pointer has not been tracked by the hover infrastructure then when
  // the pointer is released we're gonna have to treat it as if the pointer is
  // leaving the screen entirely.
  activePointer.shouldLeaveWhenReleased =
      previousHoverTrackersPerPointer_.find(event.pointerId) ==
      previousHoverTrackersPerPointer_.end();

  activePointers_[event.pointerId] = activePointer;
}

void PointerEventsProcessor::updateActivePointer(const PointerEvent& event) {
  if (auto activePointer = getActivePointer(event.pointerId)) {
    activePointer->event = event;
  } else {
    LOG(WARNING)
        << "Inconsistency between local and platform pointer registries: attempting to update an active pointer which has never been registered.";
  }
}

void PointerEventsProcessor::unregisterActivePointer(
    const PointerEvent& event) {
  if (getActivePointer(event.pointerId) != nullptr) {
    activePointers_.erase(event.pointerId);
  } else {
    LOG(WARNING)
        << "Inconsistency between local and platform pointer registries: attempting to unregister an active pointer which has never been registered.";
  }
}

void PointerEventsProcessor::processPendingPointerCapture(
    const PointerEvent& event,
    const DispatchEvent& eventDispatcher,
    const UIManager& uiManager) {
  auto pendingOverride = getCaptureTargetOverride(
      event.pointerId, pendingPointerCaptureTargetOverrides_);
  bool hasPendingOverride = pendingOverride != nullptr;

  auto activeOverride = getCaptureTargetOverride(
      event.pointerId, activePointerCaptureTargetOverrides_);
  bool hasActiveOverride = activeOverride != nullptr;

  if (!hasPendingOverride && !hasActiveOverride) {
    return;
  }

  auto pendingOverrideTag =
      (hasPendingOverride) ? pendingOverride->getTag() : -1;
  auto activeOverrideTag = (hasActiveOverride) ? activeOverride->getTag() : -1;

  if (hasActiveOverride && activeOverrideTag != pendingOverrideTag) {
    auto retargeted = retargetPointerEvent(event, *activeOverride, uiManager);

    if (shouldEmitPointerEvent(
            *retargeted.target, "topLostPointerCapture", uiManager)) {
      eventDispatcher(
          *retargeted.target,
          "topLostPointerCapture",
          ReactEventPriority::Discrete,
          retargeted.event);
    }
  }

  if (hasPendingOverride && activeOverrideTag != pendingOverrideTag) {
    auto retargeted = retargetPointerEvent(event, *pendingOverride, uiManager);
    if (shouldEmitPointerEvent(
            *retargeted.target, "topGotPointerCapture", uiManager)) {
      eventDispatcher(
          *retargeted.target,
          "topGotPointerCapture",
          ReactEventPriority::Discrete,
          retargeted.event);
    }
  }

  if (!hasPendingOverride) {
    activePointerCaptureTargetOverrides_.erase(event.pointerId);
  } else {
    activePointerCaptureTargetOverrides_[event.pointerId] = pendingOverride;
  }
}

void PointerEventsProcessor::handleIncomingPointerEventOnNode(
    const PointerEvent& event,
    const std::shared_ptr<const ShadowNode>& targetNode,
    const DispatchEvent& eventDispatcher,
    const UIManager& uiManager) {
  // Get the hover tracker from the previous event (default to null if the
  // pointer hasn't been tracked before)
  auto prevHoverTrackerIt =
      previousHoverTrackersPerPointer_.find(event.pointerId);
  PointerHoverTracker::Unique prevHoverTracker =
      prevHoverTrackerIt != previousHoverTrackersPerPointer_.end()
      ? std::move(prevHoverTrackerIt->second)
      : std::make_unique<PointerHoverTracker>(nullptr, uiManager);
  // The previous tracker was stored from a previous tick so we mark it as old
  prevHoverTracker->markAsOld();

  auto curHoverTracker =
      std::make_unique<PointerHoverTracker>(targetNode, uiManager);

  // Out
  if (!prevHoverTracker->hasSameTarget(*curHoverTracker) &&
      prevHoverTracker->areAnyTargetsListeningToEvents(
          {ViewEvents::Offset::PointerOut,
           ViewEvents::Offset::PointerOutCapture},
          uiManager)) {
    auto prevTarget = prevHoverTracker->getTarget(uiManager);
    if (prevTarget != nullptr) {
      eventDispatcher(
          *prevTarget, "topPointerOut", ReactEventPriority::Discrete, event);
    }
  }

  // REMINDER: The order of these lists are from the root to the target
  const auto [leavingNodes, enteringNodes] =
      prevHoverTracker->diffEventPath(*curHoverTracker, uiManager);

  // Leaving

  // pointerleave events need to be emitted from the deepest target to the root
  // but we also need to efficiently keep track of if a view has a parent which
  // is listening to the leave events, so we first iterate from the root to the
  // target, collecting the views which need events fired for, of which we
  // reverse iterate (now from target to root), actually emitting the events.
  bool hasParentLeaveCaptureListener = false;
  std::vector<std::reference_wrapper<const ShadowNode>> targetsToEmitLeaveTo;
  for (auto nodeRef : leavingNodes) {
    const auto& node = nodeRef.get();

    bool hasCapturingListener = isViewListeningToEvents(
        node, {ViewEvents::Offset::PointerLeaveCapture});
    bool shouldEmitEvent = hasParentLeaveCaptureListener ||
        hasCapturingListener ||
        isViewListeningToEvents(node, {ViewEvents::Offset::PointerLeave});

    if (shouldEmitEvent) {
      targetsToEmitLeaveTo.emplace_back(node);
    }

    if (hasCapturingListener && !hasParentLeaveCaptureListener) {
      hasParentLeaveCaptureListener = true;
    }
  }

  // Actually emit the leave events (in order from target to root)
  for (auto it = targetsToEmitLeaveTo.rbegin();
       it != targetsToEmitLeaveTo.rend();
       it++) {
    eventDispatcher(
        *it, "topPointerLeave", ReactEventPriority::Discrete, event);
  }

  // Over
  if (!prevHoverTracker->hasSameTarget(*curHoverTracker) &&
      curHoverTracker->areAnyTargetsListeningToEvents(
          {ViewEvents::Offset::PointerOver,
           ViewEvents::Offset::PointerOverCapture},
          uiManager)) {
    auto curTarget = curHoverTracker->getTarget(uiManager);
    if (curTarget != nullptr) {
      eventDispatcher(
          *curTarget, "topPointerOver", ReactEventPriority::Discrete, event);
    }
  }

  // Entering

  // We want to impose the same filtering based on what events are being
  // listened to as we did with leaving earlier in this function but we can emit
  // the events in this loop inline since it's expected to fire the evens in
  // order from root to target.
  bool hasParentEnterCaptureListener = false;
  for (auto nodeRef : enteringNodes) {
    const auto& node = nodeRef.get();

    bool hasCapturingListener = isViewListeningToEvents(
        node, {ViewEvents::Offset::PointerEnterCapture});
    bool shouldEmitEvent = hasParentEnterCaptureListener ||
        hasCapturingListener ||
        isViewListeningToEvents(node, {ViewEvents::Offset::PointerEnter});

    if (shouldEmitEvent) {
      eventDispatcher(
          node, "topPointerEnter", ReactEventPriority::Discrete, event);
    }

    if (hasCapturingListener && !hasParentEnterCaptureListener) {
      hasParentEnterCaptureListener = true;
    }
  }

  if (targetNode != nullptr) {
    previousHoverTrackersPerPointer_[event.pointerId] =
        std::move(curHoverTracker);
  } else {
    previousHoverTrackersPerPointer_.erase(event.pointerId);
  }
}

} // namespace facebook::react
