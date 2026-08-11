/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>

namespace facebook::react {

struct FantomForcedCloneCommitHook : public UIManagerCommitHook {
  void commitHookWasRegistered(
      const UIManager& /*uiManager*/) noexcept override;

  void commitHookWasUnregistered(
      const UIManager& /*uiManager*/) noexcept override;

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& shadowTree,
      const std::shared_ptr<const RootShadowNode>& oldRootShadowNode,
      const RootShadowNode::Unshared& newRootShadowNode) noexcept override;
};

} // namespace facebook::react
