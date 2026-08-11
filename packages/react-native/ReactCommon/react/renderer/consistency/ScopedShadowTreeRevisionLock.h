/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/consistency/ShadowTreeRevisionConsistencyManager.h>

namespace facebook::react {

/**
 * This is a RAII class that locks the shadow tree revisions during its
 * lifetime.
 *
 * @example
 *   {
 *     ScopedShadowTreeRevisionLock lock(consistencyManager);
 *     runJavaScriptTask(); // During this execution, the lock will be active.
 *   }
 */
class ScopedShadowTreeRevisionLock {
 public:
  explicit ScopedShadowTreeRevisionLock(
      ShadowTreeRevisionConsistencyManager* consistencyManager) noexcept
      : consistencyManager_(consistencyManager) {
    if (consistencyManager_ != nullptr) {
      consistencyManager_->lockRevisions();
    }
  }

  // Non-movable
  ScopedShadowTreeRevisionLock(const ScopedShadowTreeRevisionLock&) = delete;
  ScopedShadowTreeRevisionLock(ScopedShadowTreeRevisionLock&&) = delete;

  // Non-copyable
  ScopedShadowTreeRevisionLock& operator=(const ScopedShadowTreeRevisionLock&) =
      delete;
  ScopedShadowTreeRevisionLock& operator=(ScopedShadowTreeRevisionLock&&) =
      delete;

  ~ScopedShadowTreeRevisionLock() noexcept {
    if (consistencyManager_ != nullptr) {
      consistencyManager_->unlockRevisions();
    }
  }

 private:
  ShadowTreeRevisionConsistencyManager* consistencyManager_;
};

} // namespace facebook::react
