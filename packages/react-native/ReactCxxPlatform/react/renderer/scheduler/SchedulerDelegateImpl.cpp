/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SchedulerDelegateImpl.h"
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

SchedulerDelegateImpl::SchedulerDelegateImpl(
    std::shared_ptr<IMountingManager> mountingManager) noexcept
    : mountingManager_(std::move(mountingManager)) {}

void SchedulerDelegateImpl::setUIManager(
    std::shared_ptr<UIManager> uiManager) noexcept {
  uiManager_ = uiManager;
}

void SchedulerDelegateImpl::schedulerDidFinishTransaction(
    const std::shared_ptr<const MountingCoordinator>& /*mountingCoordinator*/) {
  // no-op, we will flush the transaction from schedulerShouldRenderTransactions
}

void SchedulerDelegateImpl::schedulerShouldRenderTransactions(
    const std::shared_ptr<const MountingCoordinator>& mountingCoordinator) {
  auto surfaceId = mountingCoordinator->getSurfaceId();
  if (auto transaction = mountingCoordinator->pullTransaction();
      transaction.has_value()) {
    if (auto& transactionValue = transaction.value();
        !transactionValue.getMutations().empty()) {
      mountingManager_->executeMount(surfaceId, std::move(transactionValue));
    }
  }
}

void SchedulerDelegateImpl::schedulerShouldMergeReactRevision(
    SurfaceId surfaceId) {
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId,
      [](const ShadowTree& shadowTree) { shadowTree.mergeReactRevision(); });
}

void SchedulerDelegateImpl::schedulerDidRequestPreliminaryViewAllocation(
    const ShadowNode& shadowNode) {}

void SchedulerDelegateImpl::schedulerDidDispatchCommand(
    const ShadowView& shadowView,
    const std::string& commandName,
    const folly::dynamic& args) {
  mountingManager_->dispatchCommand(shadowView, commandName, args);
}

void SchedulerDelegateImpl::schedulerDidSetIsJSResponder(
    const ShadowView& shadowView,
    bool isJSResponder,
    bool blockNativeResponder) {
  mountingManager_->setIsJSResponder(
      shadowView, isJSResponder, blockNativeResponder);
}

void SchedulerDelegateImpl::schedulerDidSendAccessibilityEvent(
    const ShadowView& shadowView,
    const std::string& eventType) {}

void SchedulerDelegateImpl::schedulerShouldSynchronouslyUpdateViewOnUIThread(
    Tag tag,
    const folly::dynamic& props) {
  mountingManager_->synchronouslyUpdateViewOnUIThread(tag, props);
}

void SchedulerDelegateImpl::schedulerDidUpdateShadowTree(
    const std::unordered_map<Tag, folly::dynamic>& tagToProps) {
  mountingManager_->onUpdateShadowTree(tagToProps);
}

void SchedulerDelegateImpl::schedulerDidCaptureViewSnapshot(
    Tag /*tag*/,
    SurfaceId /*surfaceId*/) {}

void SchedulerDelegateImpl::schedulerDidSetViewSnapshot(
    Tag /*sourceTag*/,
    Tag /*targetTag*/,
    SurfaceId /*surfaceId*/) {}

void SchedulerDelegateImpl::schedulerDidClearPendingSnapshots() {}

} // namespace facebook::react
