/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTree.h>

namespace facebook::react {

/*
 * Abstract class for UIManager's delegate.
 */
class UIManagerDelegate {
 public:
  /*
   * Called right after a new/updated Shadow Node tree is constructed.
   * For this moment the tree is already laid out and sealed.
   */
  virtual void uiManagerDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> mountingCoordinator,
      bool mountSynchronously) = 0;

  /*
   * Called each time when UIManager constructs a new Shadow Node. Receiver
   * might use this to optimistically allocate a new native view
   * instances.
   */
  virtual void uiManagerDidCreateShadowNode(const ShadowNode &shadowNode) = 0;

  /*
   * Called when UIManager wants to dispatch a command to the mounting layer.
   */
  virtual void uiManagerDidDispatchCommand(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      const std::string &commandName,
      const folly::dynamic &args) = 0;

  /*
   * Called when UIManager wants to dispatch some accessibility event
   * to the mounting layer. eventType is platform-specific and not all
   * platforms will necessarily implement the same set of events.
   */
  virtual void uiManagerDidSendAccessibilityEvent(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      const std::string &eventType) = 0;

  /*
   * Set JS responder for a view.
   */
  virtual void uiManagerDidSetIsJSResponder(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      bool isJSResponder,
      bool blockNativeResponder) = 0;

  /*
   * Synchronous view update.
   */
  virtual void uiManagerShouldSynchronouslyUpdateViewOnUIThread(Tag tag, const folly::dynamic &props) = 0;

  /*
   * Called after updateShadowTree is invoked.
   */
  virtual void uiManagerDidUpdateShadowTree(const std::unordered_map<Tag, folly::dynamic> &tagToProps) = 0;

  /*
   * Add event listener.
   */
  virtual void uiManagerShouldAddEventListener(std::shared_ptr<const EventListener> listener) = 0;

  /*
   * Remove event listener.
   */
  virtual void uiManagerShouldRemoveEventListener(const std::shared_ptr<const EventListener> &listener) = 0;

  /*
   * Start surface.
   */
  virtual void uiManagerDidStartSurface(const ShadowTree &shadowTree) = 0;

  /*
   * Called after a new React revision of the shadow tree is committed.
   */
  virtual void uiManagerDidFinishReactCommit(const ShadowTree &shadowTree) = 0;

  /*
   * Called after a React revision of the shadow tree is promoted to be merged.
   */
  virtual void uiManagerDidPromoteReactRevision(const ShadowTree &shadowTree) = 0;

  using OnSurfaceStartCallback = std::function<void(const ShadowTree &shadowTree)>;
  virtual void uiManagerShouldSetOnSurfaceStartCallback(OnSurfaceStartCallback &&callback) = 0;

  // View transition bitmap snapshot capture and application.
  virtual void uiManagerDidCaptureViewSnapshot(Tag tag, SurfaceId surfaceId) = 0;
  virtual void uiManagerDidSetViewSnapshot(Tag sourceTag, Tag targetTag, SurfaceId surfaceId) = 0;
  virtual void uiManagerDidClearPendingSnapshots() = 0;

  virtual ~UIManagerDelegate() noexcept = default;
};

} // namespace facebook::react
