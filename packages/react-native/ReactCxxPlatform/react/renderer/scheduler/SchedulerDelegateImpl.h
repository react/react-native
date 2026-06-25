/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/uimanager/IMountingManager.h>

namespace facebook::react {

class IMountingManager;

class SchedulerDelegateImpl : public SchedulerDelegate {
 public:
  SchedulerDelegateImpl(std::shared_ptr<IMountingManager> mountingManager) noexcept;

  ~SchedulerDelegateImpl() noexcept override = default;

  SchedulerDelegateImpl(SchedulerDelegateImpl &&) noexcept = default;
  SchedulerDelegateImpl &operator=(SchedulerDelegateImpl &&) noexcept = default;
  SchedulerDelegateImpl(const SchedulerDelegateImpl &) = delete;
  SchedulerDelegateImpl &operator=(const SchedulerDelegateImpl &) = delete;

  void setUIManager(std::shared_ptr<UIManager> uiManager) noexcept;

 private:
  void schedulerDidFinishTransaction(const std::shared_ptr<const MountingCoordinator> &mountingCoordinator) override;

  void schedulerShouldRenderTransactions(
      const std::shared_ptr<const MountingCoordinator> &mountingCoordinator) override;

  void schedulerShouldMergeReactRevision(SurfaceId surfaceId) override;

  void schedulerDidRequestPreliminaryViewAllocation(const ShadowNode &shadowNode) override;

  void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      const std::string &commandName,
      const folly::dynamic &args) override;

  void schedulerDidSetIsJSResponder(const ShadowView &shadowView, bool isJSResponder, bool blockNativeResponder)
      override;

  void schedulerDidSendAccessibilityEvent(const ShadowView &shadowView, const std::string &eventType) override;

  void schedulerShouldSynchronouslyUpdateViewOnUIThread(Tag tag, const folly::dynamic &props) override;

  void schedulerDidUpdateShadowTree(const std::unordered_map<Tag, folly::dynamic> &tagToProps) override;

  void schedulerDidCaptureViewSnapshot(Tag tag, SurfaceId surfaceId) override;

  void schedulerDidSetViewSnapshot(Tag sourceTag, Tag targetTag, SurfaceId surfaceId) override;

  void schedulerDidClearPendingSnapshots() override;

  std::shared_ptr<IMountingManager> mountingManager_;
  std::shared_ptr<UIManager> uiManager_;
};

}; // namespace facebook::react
