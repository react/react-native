/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/renderer/uimanager/UIManagerCommitHook.h>

namespace facebook::react {

/*
 * Emits layout events (`onLayout`) for the nodes whose layout changed in
 * each commit, using the `shadowTreeDidCommit` commit hook as the source of
 * layout changes (this logic used to be implemented directly in
 * `ShadowTree`).
 */
class LayoutEventEmitter final : public UIManagerCommitHook {
 public:
  void commitHookWasRegistered(const UIManager & /*uiManager*/) noexcept override {}
  void commitHookWasUnregistered(const UIManager & /*uiManager*/) noexcept override {}

  void shadowTreeDidCommit(
      const ShadowTree &shadowTree,
      const RootShadowNode::Shared &rootShadowNode,
      const std::vector<const LayoutableShadowNode *> &affectedLayoutableNodes) noexcept override;
};

} // namespace facebook::react
