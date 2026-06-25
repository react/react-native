/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <queue>
#include <unordered_set>

#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/UIManagerViewTransitionDelegate.h>

namespace facebook::react {

class ShadowTree;
class UIManager;

class ViewTransitionModule : public UIManagerViewTransitionDelegate,
                             public UIManagerCommitHook,
                             public MountingOverrideDelegate {
 public:
  ~ViewTransitionModule() override;

  void initialize(UIManager *uiManager, std::weak_ptr<ViewTransitionModule> weakThis);

#pragma mark - UIManagerViewTransitionDelegate

  // will be called when a view will transition. if a view already has a view-transition-name, it may not be called
  // again until it's removed
  void applyViewTransitionName(const ShadowNode &shadowNode, const std::string &name, const std::string &className)
      override;

  // creates a pseudo-element shadow node for a given transition name using the
  // captured old layout metrics
  void createViewTransitionInstance(const std::string &name, Tag pseudoElementTag) override;

  // if a viewTransitionName is cancelled, the element doesn't have view-transition-name and browser won't be taking
  // snapshot
  void cancelViewTransitionName(const ShadowNode &shadowNode, const std::string &name) override;

  // restore cancellation
  void restoreViewTransitionName(const ShadowNode &shadowNode) override;

  void startViewTransition(
      std::function<void()> mutationCallback,
      std::function<void()> onReadyCallback,
      std::function<void()> onCompleteCallback) override;

  void startViewTransitionReadyFinished() override;

  void startViewTransitionEnd() override;

  std::optional<ViewTransitionInstance> getViewTransitionInstance(const std::string &name, const std::string &pseudo)
      override;

#pragma mark - UIManagerCommitHook

  void commitHookWasRegistered(const UIManager & /*uiManager*/) noexcept override {}
  void commitHookWasUnregistered(const UIManager & /*uiManager*/) noexcept override {}
  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &shadowTree,
      const RootShadowNode::Shared &oldRootShadowNode,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions &commitOptions) noexcept override;

#pragma mark - MountingOverrideDelegate

  bool shouldOverridePullTransaction() const override;
  std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      const TransactionTelemetry &telemetry,
      ShadowViewMutationList mutations) const override;

  std::shared_ptr<const ShadowNode> findPseudoElementShadowNodeByTag(Tag tag) const override;

  void suspendOnActiveViewTransition() override;

  void waitForTransitionAnimation(int animationId) override;

  void transitionAnimationFinished(int animationId) override;

  // Animation state structure for storing minimal view data
  struct AnimationKeyFrameViewLayoutMetrics {
    Point originFromRoot;
    Size size;
    Float pointScaleFactor{};
  };

  struct AnimationKeyFrameView {
    AnimationKeyFrameViewLayoutMetrics layoutMetrics;
    Tag tag{0};
    SurfaceId surfaceId{0};
    uint32_t transitionId{0};
  };

 private:
  uint32_t transitionIdCounter_{0};
  uint32_t activeTransitionId_{0};

  // registry of layout of old/new views
  std::unordered_map<std::string, AnimationKeyFrameView> oldLayout_{};
  std::unordered_map<std::string, AnimationKeyFrameView> newLayout_{};
  // tag -> (names, transitionId) registry, populated during applyViewTransitionName
  // Note that tag and name are not 1:1 mapping
  // - In some nested composition 2 names are mappped to the same tag
  // - tags of old and new views are mapped to the same name(s)
  struct NameRegistryEntry {
    std::unordered_set<std::string> names;
    uint32_t transitionId{0};
  };
  std::unordered_map<Tag, NameRegistryEntry> nameRegistry_{};

  // used for cancel/restore viewTransitionName
  std::unordered_map<Tag, std::unordered_set<std::string>> cancelledNameRegistry_{};

  // pseudo-element nodes keyed by transition name, appended to root children via UIManagerCommitHook
  // TODO: T262559264 pseudo elements should be cleaned up as soon as transition animation ends
  std::unordered_map<std::string, std::shared_ptr<const ShadowNode>> oldPseudoElementNodes_{};

  struct InactivePseudoElement {
    std::shared_ptr<const ShadowNode> node;
    // tag of the original view this was created from
    Tag sourceTag{0};
    // Layout metrics last applied to the pseudo-element node's props.
    AnimationKeyFrameViewLayoutMetrics lastAppliedLayoutMetrics{};
  };
  // pseudo-element nodes created for entering nodes, to be copied into
  // oldPseudoElementNodes_ during the next applyViewTransitionName call.
  // Mutable because pullTransaction (const) needs to erase unmounted entries.
  mutable std::unordered_map<std::string, std::unordered_map<Tag /* sourceTag */, InactivePseudoElement>>
      oldPseudoElementNodesRepository_{};

  LayoutMetrics captureLayoutMetricsFromRoot(const ShadowNode &shadowNode);

  void applySnapshotsOnPseudoElementShadowNodes();

  UIManager *uiManager_{nullptr};

  bool transitionStarted_{false};

  bool insideMutationCallback_{false};

  bool transitionReadyFinished_{false};

  // When suspendNextTransition_ is true and a transition is active, the next
  // startViewTransition calls are queued instead of running immediately.
  bool suspendNextTransition_{false};

  struct PendingTransition {
    std::function<void()> mutationCallback;
    std::function<void()> onReadyCallback;
    std::function<void()> onCompleteCallback;
  };
  std::queue<PendingTransition> pendingTransitions_{};

  // Tracks animation IDs that must complete before onCompleteCallback_ fires.
  // Animations are registered via waitForTransitionAnimation (called from JS
  // after connectAnimatedNodeToView) and removed via transitionAnimationFinished.
  std::unordered_set<int> pendingAnimationIds_{};
  std::function<void()> onCompleteCallback_{nullptr};
};

} // namespace facebook::react
