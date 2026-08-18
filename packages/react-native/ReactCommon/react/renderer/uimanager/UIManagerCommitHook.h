/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>

namespace facebook::react {

class LayoutableShadowNode;
class ShadowTree;
struct ShadowTreeCommitOptions;
class UIManager;

/*
 * Implementing a commit hook allows to observe and alter Shadow Tree commits.
 */
class UIManagerCommitHook {
 public:
  /*
   * Called right after the commit hook is registered or unregistered.
   */
  virtual void commitHookWasRegistered(const UIManager &uiManager) noexcept = 0;
  virtual void commitHookWasUnregistered(const UIManager &uiManager) noexcept = 0;

  /*
   * Called right before a `ShadowTree` commits a new tree.
   * The semantic of the method corresponds to a method of the same name
   * from `ShadowTreeDelegate`.
   */
  virtual RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &shadowTree,
      const RootShadowNode::Shared &oldRootShadowNode,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions & /*commitOptions*/) noexcept
  {
    return shadowTreeWillCommit(shadowTree, oldRootShadowNode, newRootShadowNode);
  }

  /*
   * This is a version of `shadowTreeWillCommit` without `commitOptions` for
   * backward compatibility.
   */
  virtual RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree & /*shadowTree*/,
      const RootShadowNode::Shared & /*oldRootShadowNode*/,
      const RootShadowNode::Unshared &newRootShadowNode) noexcept
  {
    // No longer a pure method as subclasses are expected to implement the other
    // flavor instead.
    return newRootShadowNode;
  }

  /*
   * Called right after a `ShadowTree` commits a new tree.
   * The semantic of the method corresponds to a method of the same name
   * from `ShadowTreeDelegate`.
   */
  virtual void shadowTreeDidCommit(
      const ShadowTree & /*shadowTree*/,
      const RootShadowNode::Shared & /*rootShadowNode*/,
      const std::vector<const LayoutableShadowNode *> & /*affectedLayoutableNodes*/) noexcept
  {
  }

  virtual ~UIManagerCommitHook() noexcept = default;
};

} // namespace facebook::react
