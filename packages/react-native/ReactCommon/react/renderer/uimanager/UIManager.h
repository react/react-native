/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/ComponentRegistry.h>
#include <React/RendererCore.h>
#include <React/RuntimeExecutor.h>
#include <React/Utils.h>

#include <folly/dynamic.h>
#include <jsi/jsi.h>

#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>
#include <react/renderer/mounting/ShadowTreeRegistry.h>
#include <react/renderer/uimanager/SynchronousTransformOverlay.h>
#include <react/renderer/uimanager/UIManagerAnimationBackend.h>
#include <react/renderer/uimanager/UIManagerAnimationDelegate.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>
#include <react/renderer/uimanager/UIManagerNativeAnimatedDelegate.h>
#include <react/renderer/uimanager/UIManagerViewTransitionDelegate.h>
#include <react/renderer/uimanager/primitives.h>
#include <functional>
#include <memory>
#include <shared_mutex>
#include <string>
#include <unordered_map>
#include <vector>

namespace facebook::react {

class LazyShadowTreeRevisionConsistencyManager;
class LeakChecker;
class ShadowTreeRevisionConsistencyManager;
class ShadowTreeRevisionProvider;
class UIManagerBinding;
class UIManagerCommitHook;
class UIManagerMountHook;

class UIManager final : public ShadowTreeDelegate {
 public:
  UIManager(const RuntimeExecutor &runtimeExecutor, std::shared_ptr<const ContextContainer> contextContainer);

  ~UIManager() override;

  void setComponentDescriptorRegistry(const SharedComponentDescriptorRegistry &componentDescriptorRegistry);

  /*
   * Sets and gets the UIManager's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(UIManagerDelegate *delegate);
  UIManagerDelegate *getDelegate();

  /**
   * Sets and gets the UIManager's Animation APIs delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setAnimationDelegate(UIManagerAnimationDelegate *delegate);

  /**
   * Sets and gets UIManager's AnimationBackend reference.
   */
  void unstable_setAnimationBackend(std::shared_ptr<UIManagerAnimationBackend> animationBackend);
  std::weak_ptr<UIManagerAnimationBackend> unstable_getAnimationBackend();

  /**
   * Execute stopSurface on any UIManagerAnimationDelegate.
   */
  void stopSurfaceForAnimationDelegate(SurfaceId surfaceId) const;

  void setNativeAnimatedDelegate(std::weak_ptr<UIManagerNativeAnimatedDelegate> delegate);

  /**
   * Sets and gets UIManager's ViewTransition API delegate.
   */
  void setViewTransitionDelegate(UIManagerViewTransitionDelegate *delegate);
  UIManagerViewTransitionDelegate *getViewTransitionDelegate() const;

  void animationTick() const;

  void synchronouslyUpdateViewOnUIThread(Tag tag, const folly::dynamic &props);

  void synchronouslyUpdateAnimatedProps(const std::unordered_map<Tag, AnimatedProps> &updates);

  /*
   * Records `transform` / `transformOrigin` values that were applied to the
   * mounted view with the given `tag` synchronously (without a commit), so
   * that layout queries reflect them. Called by the platform mounting layer
   * for every synchronous update, and available to libraries that write
   * props synchronously through their own channels. No-op unless the
   * `enableSynchronousTransformOverlay` feature flag is enabled.
   */
  void recordSynchronousTransform(Tag tag, const folly::dynamic &props) const;

  /*
   * Drops the recorded synchronous transform for `tag`. To be called by the
   * system that wrote it when it stops managing the view (the committed
   * props are authoritative again).
   */
  void removeSynchronousTransform(Tag tag) const;

  /*
   * Returns the provider that layout queries should use to take synchronous
   * transforms into account, or `nullptr` when there is nothing to override
   * (feature flag disabled or no synchronous transforms recorded).
   * `getRelativeLayoutMetrics` uses it automatically.
   */
  const LayoutableShadowNode::TransformOverrideProvider *getTransformOverrideProvider() const;

  /*
   * Provides access to a UIManagerBinding.
   * The `callback` methods will not be called if the internal pointer to
   * `UIManagerBinding` is `nullptr`.
   * The callback is called synchronously on the same thread.
   */
  void visitBinding(
      const std::function<void(const UIManagerBinding &uiManagerBinding)> &callback,
      jsi::Runtime &runtime) const;

  /*
   * Registers and unregisters a commit hook.
   */
  void registerCommitHook(UIManagerCommitHook &commitHook);
  void unregisterCommitHook(UIManagerCommitHook &commitHook);

  /*
   * Registers and unregisters a mount hook.
   */
  void registerMountHook(UIManagerMountHook &mountHook);
  void unregisterMountHook(UIManagerMountHook &mountHook);

  std::shared_ptr<const ShadowNode> getNewestCloneOfShadowNode(const ShadowNode &shadowNode) const;

  ShadowTreeRevisionConsistencyManager *getShadowTreeRevisionConsistencyManager();
  ShadowTreeRevisionProvider *getShadowTreeRevisionProvider();

#pragma mark - Surface Start & Stop

  void startSurface(
      ShadowTree::Unique &&shadowTree,
      std::string moduleName,
      folly::dynamic props,
      DisplayMode displayMode) const noexcept;

  void startEmptySurface(ShadowTree::Unique &&shadowTree) const noexcept;

  void setSurfaceProps(SurfaceId surfaceId, std::string moduleName, folly::dynamic props, DisplayMode displayMode)
      const noexcept;

  ShadowTree::Unique stopSurface(SurfaceId surfaceId) const;

#pragma mark - ShadowTreeDelegate

  void shadowTreeDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> mountingCoordinator,
      bool mountSynchronously) const override;

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &shadowTree,
      const RootShadowNode::Shared &oldRootShadowNode,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTree::CommitOptions &commitOptions) const override;

  void shadowTreeDidFinishReactCommit(const ShadowTree &shadowTree) const override;

  void shadowTreeDidCommit(
      const ShadowTree &shadowTree,
      const RootShadowNode::Shared &rootShadowNode,
      const std::vector<const LayoutableShadowNode *> &affectedLayoutableNodes) const noexcept override;

  std::shared_ptr<ShadowNode> createNode(
      Tag tag,
      const std::string &componentName,
      SurfaceId surfaceId,
      RawProps props,
      InstanceHandle::Shared instanceHandle) const;

  std::shared_ptr<ShadowNode> cloneNode(
      const ShadowNode &shadowNode,
      const std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>> &children,
      RawProps rawProps) const;

  void appendChild(
      const std::shared_ptr<const ShadowNode> &parentShadowNode,
      const std::shared_ptr<const ShadowNode> &childShadowNode) const;

  void completeSurface(
      SurfaceId surfaceId,
      const std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> &rootChildren,
      ShadowTree::CommitOptions commitOptions);

  void setIsJSResponder(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      bool isJSResponder,
      bool blockNativeResponder) const;

  std::shared_ptr<const ShadowNode> findNodeAtPoint(const std::shared_ptr<const ShadowNode> &shadowNode, Point point)
      const;

  /*
   * Returns layout metrics of given `shadowNode` relative to
   * `ancestorShadowNode` (relative to the root node in case if provided
   * `ancestorShadowNode` is nullptr).
   */
  LayoutMetrics getRelativeLayoutMetrics(
      const ShadowNode &shadowNode,
      const ShadowNode *ancestorShadowNode,
      LayoutableShadowNode::LayoutInspectingPolicy policy) const;

  /*
   * Creates a new shadow node with given state data, clones what's necessary
   * and performs a commit.
   */
  void updateState(const StateUpdate &stateUpdate) const;

  void dispatchCommand(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      const std::string &commandName,
      const folly::dynamic &args) const;

  void setNativeProps_DEPRECATED(const std::shared_ptr<const ShadowNode> &shadowNode, RawProps rawProps) const;

  void sendAccessibilityEvent(const std::shared_ptr<const ShadowNode> &shadowNode, const std::string &eventType);

  /*
   * Iterates over all shadow nodes which are parts of all registered surfaces
   * and find the one that has given `tag`. Returns `nullptr` if the node
   * wasn't found. This is a temporary workaround that should not be used in
   * any core functionality.
   */
  std::shared_ptr<const ShadowNode> findShadowNodeByTag_DEPRECATED(Tag tag) const;

  const ShadowTreeRegistry &getShadowTreeRegistry() const;

  void reportMount(SurfaceId surfaceId) const;

  void updateShadowTree(std::unordered_map<Tag, folly::dynamic> &&tagToProps);

#pragma mark - ContextContainer
  std::shared_ptr<const ContextContainer> getContextContainer() const;

#pragma mark - Add & Remove event listener

  void addEventListener(std::shared_ptr<const EventListener> listener);

  void removeEventListener(const std::shared_ptr<const EventListener> &listener);

#pragma mark - Add on surface start callback
  void addOnSurfaceStartCallback(UIManagerDelegate::OnSurfaceStartCallback &&callback);

 private:
  friend class UIManagerBinding;
  friend class Scheduler;
  friend class SurfaceHandler;

  /**
   * Configure a LayoutAnimation to happen on the next commit.
   * This API configures a global LayoutAnimation starting from the root node.
   */
  void configureNextLayoutAnimation(
      jsi::Runtime &runtime,
      const RawValue &config,
      const jsi::Value &successCallback,
      const jsi::Value &failureCallback) const;

  std::shared_ptr<const ShadowNode> getShadowNodeInSubtree(
      const ShadowNode &shadowNode,
      const std::shared_ptr<const ShadowNode> &ancestorShadowNode) const;

  /*
   * Drops the synchronous transforms recorded for views that are no longer
   * part of any shadow tree. `committedRootShadowNode` stands in for the
   * current revision of the surface with `committedSurfaceId`, which is
   * being committed when this is called from `shadowTreeDidCommit`.
   */
  void pruneSynchronousTransformOverlay(
      SurfaceId committedSurfaceId,
      const RootShadowNode::Shared &committedRootShadowNode,
      bool force) const;

  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_{};
  UIManagerAnimationDelegate *animationDelegate_{nullptr};
  std::weak_ptr<UIManagerNativeAnimatedDelegate> nativeAnimatedDelegate_;
  UIManagerViewTransitionDelegate *viewTransitionDelegate_{nullptr};

  const RuntimeExecutor runtimeExecutor_{};
  ShadowTreeRegistry shadowTreeRegistry_{};
  std::shared_ptr<const ContextContainer> contextContainer_;

  mutable std::shared_mutex commitHookMutex_;
  mutable std::vector<UIManagerCommitHook *> commitHooks_;

  mutable std::shared_mutex mountHookMutex_;
  mutable std::vector<UIManagerMountHook *> mountHooks_;

  std::unique_ptr<LeakChecker> leakChecker_;

  std::unique_ptr<LazyShadowTreeRevisionConsistencyManager> lazyShadowTreeRevisionConsistencyManager_;

  std::shared_ptr<UIManagerAnimationBackend> animationBackend_;

  mutable SynchronousTransformOverlay synchronousTransformOverlay_;
};

} // namespace facebook::react
