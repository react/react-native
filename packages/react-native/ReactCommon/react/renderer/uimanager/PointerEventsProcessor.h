/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <jsi/jsi.h>
#include <react/renderer/uimanager/PointerHoverTracker.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

// Helper struct to package a PointerEvent and SharedEventTarget together
struct PointerEventTarget {
  PointerEvent event;
  std::shared_ptr<const ShadowNode> target;
};

// Helper struct to contain an active pointer's event data along with additional
// metadata
struct ActivePointer {
  PointerEvent event;

  /*
   * Informs the event system that when the touch is released it should be
   * treated as the pointer leaving the screen entirely.
   */
  bool shouldLeaveWhenReleased{};
};

using DispatchEvent = std::function<void(
    const ShadowNode &targetNode,
    const std::string &type,
    ReactEventPriority priority,
    const EventPayload &payload)>;

using PointerIdentifier = int32_t;
using CaptureTargetOverrideRegistry = std::unordered_map<PointerIdentifier, std::weak_ptr<const ShadowNode>>;

using ActivePointerRegistry = std::unordered_map<PointerIdentifier, ActivePointer>;
using PointerHoverTrackerRegistry = std::unordered_map<PointerIdentifier, PointerHoverTracker::Unique>;

class PointerEventsProcessor final {
 public:
  static std::shared_ptr<const ShadowNode> getShadowNodeFromEventTarget(jsi::Runtime &runtime, EventTarget *target);

  void interceptPointerEvent(
      const std::shared_ptr<const ShadowNode> &target,
      const std::string &type,
      ReactEventPriority priority,
      const PointerEvent &event,
      const DispatchEvent &eventDispatcher,
      const UIManager &uiManager);

  void setPointerCapture(PointerIdentifier pointerId, const std::shared_ptr<const ShadowNode> &shadowNode);
  void releasePointerCapture(PointerIdentifier pointerId, const ShadowNode *shadowNode);
  bool hasPointerCapture(PointerIdentifier pointerId, const ShadowNode *shadowNode);

 private:
  ActivePointer *getActivePointer(PointerIdentifier pointerId);

  void registerActivePointer(const PointerEvent &event);
  void updateActivePointer(const PointerEvent &event);
  void unregisterActivePointer(const PointerEvent &event);

  void processPendingPointerCapture(
      const PointerEvent &event,
      const DispatchEvent &eventDispatcher,
      const UIManager &uiManager);

  ActivePointerRegistry activePointers_;

  CaptureTargetOverrideRegistry pendingPointerCaptureTargetOverrides_;
  CaptureTargetOverrideRegistry activePointerCaptureTargetOverrides_;

  /*
   * Private method which is used for tracking the location of pointer events to
   * manage the entering/leaving events. The primary idea is that a pointer's
   * presence & movement is dicated by a variety of underlying events such as
   * down, move, and up — and they should all be treated the same when it comes
   * to tracking the entering & leaving of pointers to views. This method
   * accomplishes that by receiving the pointer event, and the target view (can
   * be null in cases when the event indicates that the pointer has left the
   * screen entirely)
   */
  void handleIncomingPointerEventOnNode(
      const PointerEvent &event,
      const std::shared_ptr<const ShadowNode> &targetNode,
      const DispatchEvent &eventDispatcher,
      const UIManager &uiManager);

  PointerHoverTrackerRegistry previousHoverTrackersPerPointer_;
};

} // namespace facebook::react
