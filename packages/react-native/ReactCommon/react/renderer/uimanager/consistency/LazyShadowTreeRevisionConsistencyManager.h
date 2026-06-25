/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/consistency/ShadowTreeRevisionConsistencyManager.h>
#include <react/renderer/mounting/ShadowTreeRegistry.h>
#include <react/renderer/uimanager/consistency/ShadowTreeRevisionProvider.h>
#include <cstdint>
#include <memory>

namespace facebook::react {

/**
 * This class implements UI consistency for the JavaScript thread.
 * This implementation forces JavaScript to see a stable revision of the shadow
 * tree for a given surface ID, only updating it when React commits a new tree
 * or between JS tasks.
 */
class LazyShadowTreeRevisionConsistencyManager : public ShadowTreeRevisionConsistencyManager,
                                                 public ShadowTreeRevisionProvider {
 public:
  explicit LazyShadowTreeRevisionConsistencyManager(ShadowTreeRegistry &shadowTreeRegistry);

  std::shared_ptr<const RootShadowNode> updateCurrentRevision(SurfaceId surfaceId);

#pragma mark - ShadowTreeRevisionProvider

  std::shared_ptr<const RootShadowNode> getCurrentRevision(SurfaceId surfaceId) override;

#pragma mark - ShadowTreeRevisionConsistencyManager

  void lockRevisions() override;
  void unlockRevisions() override;

 private:
  std::mutex capturedRootShadowNodesForConsistencyMutex_;
  std::unordered_map<SurfaceId, RootShadowNode::Shared> capturedRootShadowNodesForConsistency_;
  ShadowTreeRegistry &shadowTreeRegistry_;
  uint_fast32_t lockCount{0};
};

} // namespace facebook::react
