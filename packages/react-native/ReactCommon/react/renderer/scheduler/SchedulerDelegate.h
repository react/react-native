/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowView.h>

namespace facebook::react {

/*
 * Abstract class for Scheduler's delegate.
 */
class SchedulerDelegate {
 public:
  /*
   * Called right after Scheduler computed (and laid out) a new updated version
   * of the tree and calculated a set of mutations which are sufficient
   * to construct a new one.
   */
  virtual void schedulerDidFinishTransaction(const std::shared_ptr<const MountingCoordinator> &mountingCoordinator) = 0;

  /*
   * Called when the runtime scheduler decides that one-or-more previously
   * finished transactions should now be flushed to the screen (atomically).
   *
   * This is a separate callback from didFinishTransaction as the Android UI
   * mounting layer needs to be able toobserve each created ShadowTree to
   * correctly apply changes, due to changes in Props representation.
   */
  virtual void schedulerShouldRenderTransactions(
      const std::shared_ptr<const MountingCoordinator> &mountingCoordinator) = 0;

  /*
   * Called at the end of the event loop if there were commits to the JS
   * during the pass and JS branch should be "merged" to the main revision.
   */
  virtual void schedulerShouldMergeReactRevision(SurfaceId surfaceId) = 0;

  /*
   * Called right after a new ShadowNode was created.
   */
  virtual void schedulerDidRequestPreliminaryViewAllocation(const ShadowNode &shadowNode) = 0;

  virtual void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      const std::string &commandName,
      const folly::dynamic &args) = 0;

  virtual void schedulerDidSendAccessibilityEvent(const ShadowView &shadowView, const std::string &eventType) = 0;

  /*
   * Set JS responder for a view
   */
  virtual void
  schedulerDidSetIsJSResponder(const ShadowView &shadowView, bool isJSResponder, bool blockNativeResponder) = 0;

  virtual void schedulerShouldSynchronouslyUpdateViewOnUIThread(Tag tag, const folly::dynamic &props) = 0;

  virtual void schedulerDidUpdateShadowTree(const std::unordered_map<Tag, folly::dynamic> &tagToProps) = 0;

  // View transition bitmap snapshot capture and application.
  virtual void schedulerDidCaptureViewSnapshot(Tag tag, SurfaceId surfaceId) = 0;
  virtual void schedulerDidSetViewSnapshot(Tag sourceTag, Tag targetTag, SurfaceId surfaceId) = 0;
  virtual void schedulerDidClearPendingSnapshots() = 0;

  virtual ~SchedulerDelegate() noexcept = default;
};

} // namespace facebook::react
