/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include "AnimatedPropsRegistry.h"

namespace facebook::react {

class AnimationBackendCommitHook : public UIManagerCommitHook {
  std::shared_ptr<AnimatedPropsRegistry> animatedPropsRegistry_;

 public:
  AnimationBackendCommitHook(UIManager &uiManager, std::shared_ptr<AnimatedPropsRegistry> animatedPropsRegistry);
  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &shadowTree,
      const RootShadowNode::Shared &oldRootShadowNode,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions &commitOptions) noexcept override;
  void commitHookWasRegistered(const UIManager &uiManager) noexcept override {}
  void commitHookWasUnregistered(const UIManager &uiManager) noexcept override {}
};

} // namespace facebook::react
