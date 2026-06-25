/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LazyShadowTreeRevisionConsistencyManager.h"
#include <glog/logging.h>

namespace facebook::react {

LazyShadowTreeRevisionConsistencyManager::
    LazyShadowTreeRevisionConsistencyManager(
        ShadowTreeRegistry& shadowTreeRegistry)
    : shadowTreeRegistry_(shadowTreeRegistry) {}

std::shared_ptr<const RootShadowNode>
LazyShadowTreeRevisionConsistencyManager::updateCurrentRevision(
    SurfaceId surfaceId) {
  // This method is only going to be called from JS, so we don't need to protect
  // the access to the shadow tree registry as well.
  // If this was multi-threaded, we would need to protect it to avoid capturing
  // root shadow nodes concurrently.
  RootShadowNode::Shared rootShadowNode;
  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    auto reactRevision = shadowTree.getCurrentReactRevision();
    rootShadowNode =
        reactRevision.value_or(shadowTree.getCurrentRevision()).rootShadowNode;
  });

  std::unique_lock lock(capturedRootShadowNodesForConsistencyMutex_);

  // We don't need to store the revision if we haven't locked.
  // We can resolve lazily when requested.
  if (lockCount > 0) {
    capturedRootShadowNodesForConsistency_[surfaceId] = rootShadowNode;
  }

  return rootShadowNode;
}

#pragma mark - ShadowTreeRevisionProvider

std::shared_ptr<const RootShadowNode>
LazyShadowTreeRevisionConsistencyManager::getCurrentRevision(
    SurfaceId surfaceId) {
  {
    std::unique_lock lock(capturedRootShadowNodesForConsistencyMutex_);
    if (lockCount > 0) {
      auto it = capturedRootShadowNodesForConsistency_.find(surfaceId);
      if (it != capturedRootShadowNodesForConsistency_.end()) {
        return it->second;
      }
    }
  }

  return updateCurrentRevision(surfaceId);
}

#pragma mark - ConsistentShadowTreeRevisionProvider

void LazyShadowTreeRevisionConsistencyManager::lockRevisions() {
  std::unique_lock lock(capturedRootShadowNodesForConsistencyMutex_);

  // We actually capture the state lazily the first time we access it, so we
  // don't need to do anything here.
  lockCount++;
}

void LazyShadowTreeRevisionConsistencyManager::unlockRevisions() {
  std::unique_lock lock(capturedRootShadowNodesForConsistencyMutex_);

  if (lockCount == 0) {
    LOG(WARNING)
        << "LazyShadowTreeRevisionConsistencyManager::unlockRevisions() called without a previous lock";
  } else {
    lockCount--;
  }

  if (lockCount == 0) {
    capturedRootShadowNodesForConsistency_.clear();
  }
}

} // namespace facebook::react
