/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <shared_mutex>

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include <react/utils/ContextContainer.h>
#include "MountingOverrideDelegate.h"

namespace facebook::react {

using ShadowTreeCommitTransaction = std::function<RootShadowNode::Unshared(const RootShadowNode &oldRootShadowNode)>;

/*
 * Represents a result of a `commit` operation.
 */
enum class ShadowTreeCommitStatus {
  Succeeded,
  Failed,
  Cancelled,
};

/*
 * Represents commits' side-effects propagation mode.
 */
enum class ShadowTreeCommitMode {
  // Commits' side-effects are observable via `MountingCoordinator`.
  // The rendering pipeline fully works end-to-end.
  Normal,

  // Commits' side-effects are *not* observable via `MountingCoordinator`.
  // The mounting phase is skipped in the rendering pipeline.
  Suspended,
};

enum class ShadowTreeCommitSource {
  Unknown,
  React,
  AnimationEndSync,
  ReactRevisionMerge,
};

struct ShadowTreeCommitOptions {
  // When set to true, Shadow Node state from current revision will be applied
  // to the new revision. For more details see
  // https://reactnative.dev/architecture/render-pipeline#react-native-renderer-state-updates
  bool enableStateReconciliation{false};

  // Indicates if mounting will be triggered synchronously and React will
  // not get a chance to interrupt painting.
  // This should be set to `false` when a commit is coming from React. It
  // will then let React run layout effects and apply updates before paint.
  // For all other commits, should be true.
  bool mountSynchronously{true};

  ShadowTreeCommitSource source{ShadowTreeCommitSource::Unknown};
};

/*
 * Represents the shadow tree and its lifecycle.
 */
class ShadowTree final {
 public:
  using Unique = std::unique_ptr<ShadowTree>;

  using CommitStatus = ShadowTreeCommitStatus;
  using CommitMode = ShadowTreeCommitMode;
  using CommitSource = ShadowTreeCommitSource;
  using CommitOptions = ShadowTreeCommitOptions;

  /*
   * Creates a new shadow tree instance.
   */
  ShadowTree(
      SurfaceId surfaceId,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext,
      const ShadowTreeDelegate &delegate,
      const ContextContainer &contextContainer);

  ~ShadowTree();

  /*
   * Returns the `SurfaceId` associated with the shadow tree.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Sets and gets the commit mode.
   * Changing commit mode from `Suspended` to `Normal` will flush all suspended
   * changes to `MountingCoordinator`.
   */
  void setCommitMode(CommitMode commitMode) const;
  CommitMode getCommitMode() const;

  /*
   * Performs commit calling `transaction` function with a `oldRootShadowNode`
   * and expecting a `newRootShadowNode` as a return value.
   * The `transaction` function can cancel commit returning `nullptr`.
   */
  CommitStatus tryCommit(const ShadowTreeCommitTransaction &transaction, const CommitOptions &commitOptions) const;

  /*
   * Calls `tryCommit` in a loop until it finishes successfully.
   */
  CommitStatus commit(const ShadowTreeCommitTransaction &transaction, const CommitOptions &commitOptions) const;

  /*
   * Returns a `ShadowTreeRevision` representing the momentary state of
   * the `ShadowTree`.
   */
  ShadowTreeRevision getCurrentRevision() const;

  /*
   * Returns a `ShadowTreeRevision` representing the momentary state of
   * the `ShadowTree` in the JS thread.
   */
  std::optional<ShadowTreeRevision> getCurrentReactRevision() const;

  /*
   * Commit an empty tree (a new `RootShadowNode` with no children).
   */
  void commitEmptyTree() const;

  /**
   * Forces the ShadowTree to ping its delegate that an update is available.
   * Useful for animations on Android.
   */
  void notifyDelegatesOfUpdates() const;

  std::shared_ptr<const MountingCoordinator> getMountingCoordinator() const;

  /**
   * Promotes the current React revision to be merged into the main branch of the
   * ShadowTree.
   */
  void promoteReactRevision() const;

  /**
   * Commits the currently promoted React revision to the "main" branch of the
   * ShadowTree. No-op if the promoted React revision doesn't exist.
   */
  void mergeReactRevision() const;

 private:
  constexpr static ShadowTreeRevision::Number INITIAL_REVISION{0};

  void mount(ShadowTreeRevision revision, bool mountSynchronously) const;

  void emitLayoutEvents(std::vector<const LayoutableShadowNode *> &affectedLayoutableNodes) const;

  void scheduleReactRevisionPromotion() const;

  const SurfaceId surfaceId_;
  const ShadowTreeDelegate &delegate_;
  mutable std::shared_mutex revisionMutex_;
  mutable std::recursive_mutex revisionMutexRecursive_;
  mutable CommitMode commitMode_{CommitMode::Normal}; // Protected by `revisionMutex_`.
  mutable ShadowTreeRevision currentRevision_; // Protected by `revisionMutex_`.
  mutable std::optional<ShadowTreeRevision> currentReactRevision_; // Protected by `revisionMutex_`.
  mutable std::optional<ShadowTreeRevision> reactRevisionToBePromoted_; // Protected by `revisionMutex_`.
  mutable std::vector<ShadowTreeRevision> queuedReactRevisions_; // Protected by `revisionMutex_`.
  mutable std::vector<ShadowTreeRevision> promotedReactRevisions_; // Protected by `revisionMutex_`.
  std::shared_ptr<const MountingCoordinator> mountingCoordinator_;

  using UniqueLock = std::variant<std::unique_lock<std::shared_mutex>, std::unique_lock<std::recursive_mutex>>;
  using SharedLock = std::variant<std::shared_lock<std::shared_mutex>, std::unique_lock<std::recursive_mutex>>;

  inline UniqueLock uniqueRevisionLock(bool defer = false) const;
  inline SharedLock sharedRevisionLock() const;
};

} // namespace facebook::react
