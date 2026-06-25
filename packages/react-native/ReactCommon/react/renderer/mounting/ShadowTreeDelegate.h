/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/mounting/MountingCoordinator.h>

namespace facebook::react {

class ShadowTree;
struct ShadowTreeCommitOptions;

/*
 * Abstract class for ShadowTree's delegate.
 */
class ShadowTreeDelegate {
 public:
  /*
   * Called right before a ShadowTree commits a new tree.
   * The receiver can alter a new (proposed) shadow tree with another tree
   * by returning the altered tree.
   * Returning a `nullptr` cancels the commit.
   */
  virtual RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &shadowTree,
      const RootShadowNode::Shared &oldRootShadowNode,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions &commitOptions) const = 0;

  /*
   * Called right after Shadow Tree commit a new state of the tree.
   */
  virtual void shadowTreeDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> mountingCoordinator,
      bool mountSynchronously) const = 0;

  /*
   * Called right after Shadow Tree commits a new React revision of the tree.
   */
  virtual void shadowTreeDidFinishReactCommit(const ShadowTree &shadowTree) const = 0;

  /*
   * Called right after Shadow Tree promotes a React revision of the tree to
   * be merged.
   */
  virtual void shadowTreeDidPromoteReactRevision(const ShadowTree &shadowTree) const = 0;

  virtual ~ShadowTreeDelegate() noexcept = default;
};

} // namespace facebook::react
