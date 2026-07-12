/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <cxxreact/JSExecutor.h>
#include <cxxreact/TraceSection.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/DynamicPropsUtilities.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/uimanager/AppRegistryBinding.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>

#include <glog/logging.h>

#include <utility>

namespace {
std::unique_ptr<facebook::react::LeakChecker> constructLeakCheckerIfNeeded(
    const facebook::react::RuntimeExecutor& runtimeExecutor) {
#ifdef REACT_NATIVE_DEBUG
  return std::make_unique<facebook::react::LeakChecker>(runtimeExecutor);
#else
  return {};
#endif
}
} // namespace

namespace facebook::react {

// Explicitly define destructors here, as they have to exist in order to act as
// a "key function" for the ShadowNodeWrapper class -- this allows for RTTI to
// work properly across dynamic library boundaries (i.e. dynamic_cast that is
// used by getNativeState method)
ShadowNodeListWrapper::~ShadowNodeListWrapper() = default;

UIManager::UIManager(
    const RuntimeExecutor& runtimeExecutor,
    std::shared_ptr<const ContextContainer> contextContainer)
    : runtimeExecutor_(runtimeExecutor),
      shadowTreeRegistry_(),
      contextContainer_(std::move(contextContainer)),
      leakChecker_(constructLeakCheckerIfNeeded(runtimeExecutor)),
      lazyShadowTreeRevisionConsistencyManager_(
          std::make_unique<LazyShadowTreeRevisionConsistencyManager>(
              shadowTreeRegistry_)) {}

UIManager::~UIManager() {
  LOG(WARNING) << "UIManager::~UIManager() was called (address: " << this
               << ").";
}

std::shared_ptr<ShadowNode> UIManager::createNode(
    Tag tag,
    const std::string& name,
    SurfaceId surfaceId,
    RawProps rawProps,
    InstanceHandle::Shared instanceHandle) const {
  TraceSection s("UIManager::createNode", "componentName", name);

  auto& componentDescriptor = componentDescriptorRegistry_->at(name);
  auto fallbackDescriptor =
      componentDescriptorRegistry_->getFallbackComponentDescriptor();

  PropsParserContext propsParserContext{surfaceId, *contextContainer_};

  auto family = componentDescriptor.createFamily(
      {.tag = tag,
       .surfaceId = surfaceId,
       .instanceHandle = std::move(instanceHandle)});
  auto props = componentDescriptor.cloneProps(
      propsParserContext, nullptr, std::move(rawProps));
  auto state = componentDescriptor.createInitialState(props, family);

  // Add a "name" prop if this is the fallback component
  if (fallbackDescriptor != nullptr &&
      fallbackDescriptor->getComponentHandle() ==
          componentDescriptor.getComponentHandle()) {
    props = componentDescriptor.cloneProps(
        propsParserContext,
        props,
        RawProps(folly::dynamic::object("name", name)));
  }

  auto shadowNode = componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          .props = props,
          .children = ShadowNodeFragment::childrenPlaceholder(),
          .state = state,
      },
      family);

  if (delegate_ != nullptr) {
    delegate_->uiManagerDidCreateShadowNode(*shadowNode);
  }
  if (leakChecker_) {
    leakChecker_->uiManagerDidCreateShadowNodeFamily(family);
  }

  return shadowNode;
}

std::shared_ptr<ShadowNode> UIManager::cloneNode(
    const ShadowNode& shadowNode,
    const std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>>&
        children,
    RawProps rawProps) const {
  TraceSection s(
      "UIManager::cloneNode", "componentName", shadowNode.getComponentName());

  PropsParserContext propsParserContext{
      shadowNode.getFamily().getSurfaceId(), *contextContainer_};

  auto& componentDescriptor = shadowNode.getComponentDescriptor();
  auto& family = shadowNode.getFamily();

  auto props = ShadowNodeFragment::propsPlaceholder();
  if (!rawProps.isEmpty()) {
    std::optional<folly::dynamic> finalProps;
    {
      std::lock_guard<std::mutex> lock(family.nativePropsMutex);
      if (family.nativeProps_DEPRECATED != nullptr) {
        // 1. update the nativeProps_DEPRECATED props.
        //
        // In this step, we want the most recent value for the props
        // managed by setNativeProps.
        // Values in `rawProps` patch (take precedence over)
        // `nativeProps_DEPRECATED`. For example, if both
        // `nativeProps_DEPRECATED` and `rawProps` contain key 'A'.
        // Value from `rawProps` overrides what was previously in
        // `nativeProps_DEPRECATED`. Notice that the `nativeProps_DEPRECATED`
        // patch will not get more props from `rawProps`: if the key is not
        // present in `nativeProps_DEPRECATED`, it will not be added.
        //
        // The result of this operation is the new `nativeProps_DEPRECATED`.
        family.nativeProps_DEPRECATED =
            std::make_unique<folly::dynamic>(mergeDynamicProps(
                *family.nativeProps_DEPRECATED, // source
                (folly::dynamic)rawProps, // patch
                NullValueStrategy::Ignore));

        // 2. Compute the final set of props.
        //
        // This step takes the new props handled by `setNativeProps` and
        // merges them in the `rawProps` managed by React.
        // The new props handled by `nativeProps` now takes precedence
        // on the props handled by React, as we want to make sure that
        // all the props are applied to the component.
        // We use these finalProps as source of truth for the component.
        finalProps = mergeDynamicProps(
            (folly::dynamic)rawProps, // source
            *family.nativeProps_DEPRECATED, // patch
            NullValueStrategy::Override);
      }
    }

    props = componentDescriptor.cloneProps(
        propsParserContext,
        shadowNode.getProps(),
        finalProps ? RawProps(std::move(*finalProps)) : std::move(rawProps));
  }

  auto clonedShadowNode = componentDescriptor.cloneShadowNode(
      shadowNode,
      {
          .props = props,
          .children = children,
          .runtimeShadowNodeReference = false,
      });

  return clonedShadowNode;
}

void UIManager::appendChild(
    const std::shared_ptr<const ShadowNode>& parentShadowNode,
    const std::shared_ptr<const ShadowNode>& childShadowNode) const {
  TraceSection s("UIManager::appendChild");

  auto& componentDescriptor = parentShadowNode->getComponentDescriptor();
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

void UIManager::completeSurface(
    SurfaceId surfaceId,
    const std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>>&
        rootChildren,
    ShadowTree::CommitOptions commitOptions) {
  TraceSection s("UIManager::completeSurface", "surfaceId", surfaceId);

  ShadowTree::CommitStatus result;

  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    result = shadowTree.commit(
        [&](const RootShadowNode& oldRootShadowNode) {
          return std::make_shared<RootShadowNode>(
              oldRootShadowNode,
              ShadowNodeFragment{
                  .props = ShadowNodeFragment::propsPlaceholder(),
                  .children = rootChildren,
              });
        },
        commitOptions);
  });

  if (result == ShadowTree::CommitStatus::Succeeded) {
    // It's safe to update the visible revision of the shadow tree immediately
    // after we commit a specific one.
    lazyShadowTreeRevisionConsistencyManager_->updateCurrentRevision(surfaceId);

    if (ReactNativeFeatureFlags::useSharedAnimatedBackend() &&
        animationBackend_) {
      animationBackend_->clearRegistry(surfaceId);
    }
  }
}

void UIManager::setIsJSResponder(
    const std::shared_ptr<const ShadowNode>& shadowNode,
    bool isJSResponder,
    bool blockNativeResponder) const {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidSetIsJSResponder(
        shadowNode, isJSResponder, blockNativeResponder);
  }
}

void UIManager::startSurface(
    ShadowTree::Unique&& shadowTree,
    const std::string& moduleName,
    const folly::dynamic& props,
    DisplayMode displayMode) const noexcept {
  TraceSection s("UIManager::startSurface");

  auto surfaceId = shadowTree->getSurfaceId();
  shadowTreeRegistry_.add(std::move(shadowTree));

  shadowTreeRegistry_.visit(
      surfaceId, [delegate = delegate_](const ShadowTree& shadowTree) {
        if (delegate != nullptr) {
          delegate->uiManagerDidStartSurface(shadowTree);
        }
      });

  runtimeExecutor_([=](jsi::Runtime& runtime) {
    TraceSection s("UIManager::startSurface::onRuntime");
    AppRegistryBinding::startSurface(
        runtime, surfaceId, moduleName, props, displayMode);
  });
}

void UIManager::startEmptySurface(
    ShadowTree::Unique&& shadowTree) const noexcept {
  TraceSection s("UIManager::startEmptySurface");
  shadowTreeRegistry_.add(std::move(shadowTree));
}

void UIManager::setSurfaceProps(
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& props,
    DisplayMode displayMode) const noexcept {
  TraceSection s("UIManager::setSurfaceProps");

  runtimeExecutor_([=](jsi::Runtime& runtime) {
    AppRegistryBinding::setSurfaceProps(
        runtime, surfaceId, moduleName, props, displayMode);
  });
}

ShadowTree::Unique UIManager::stopSurface(SurfaceId surfaceId) const {
  TraceSection s("UIManager::stopSurface");

  // Stop any ongoing layout animations.
  stopSurfaceForAnimationDelegate(surfaceId);

  // Waiting for all concurrent commits to be finished and unregistering the
  // `ShadowTree`.
  auto shadowTree = getShadowTreeRegistry().remove(surfaceId);
  if (shadowTree) {
    // We execute JavaScript/React part of the process at the very end to
    // minimize any visible side-effects of stopping the Surface. Any possible
    // commits from the JavaScript side will not be able to reference a
    // `ShadowTree` and will fail silently.
    runtimeExecutor_([=](jsi::Runtime& runtime) {
      AppRegistryBinding::stopSurface(runtime, surfaceId);
    });

    if (leakChecker_) {
      leakChecker_->stopSurface(surfaceId);
    }
  }

  if (ReactNativeFeatureFlags::useSharedAnimatedBackend()) {
    runtimeExecutor_(
        [surfaceId,
         animationBackendWeak = std::weak_ptr<UIManagerAnimationBackend>(
             animationBackend_)](jsi::Runtime& /*runtime*/) {
          if (auto animationBackend = animationBackendWeak.lock()) {
            animationBackend->clearRegistryOnSurfaceStop(surfaceId);
          }
        });
  }

  return shadowTree;
}

std::shared_ptr<const ShadowNode> UIManager::getNewestCloneOfShadowNode(
    const ShadowNode& shadowNode) const {
  auto ancestorShadowNode = std::shared_ptr<const ShadowNode>{};
  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](const ShadowTree& shadowTree) {
        ancestorShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });
  return getShadowNodeInSubtree(shadowNode, ancestorShadowNode);
}

std::shared_ptr<const ShadowNode> UIManager::getShadowNodeInSubtree(
    const ShadowNode& shadowNode,
    const std::shared_ptr<const ShadowNode>& ancestorShadowNode) const {
  if (!ancestorShadowNode) {
    return nullptr;
  }

  // If the given shadow node is of the same family as the root shadow node,
  // return the latest root shadow node
  if (ShadowNode::sameFamily(*ancestorShadowNode, shadowNode)) {
    return ancestorShadowNode;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*ancestorShadowNode);

  if (ancestors.empty()) {
    return nullptr;
  }

  auto pair = ancestors.rbegin();
  return pair->first.get().getChildren().at(pair->second);
}

ShadowTreeRevisionConsistencyManager*
UIManager::getShadowTreeRevisionConsistencyManager() {
  return lazyShadowTreeRevisionConsistencyManager_.get();
}

ShadowTreeRevisionProvider* UIManager::getShadowTreeRevisionProvider() {
  return lazyShadowTreeRevisionConsistencyManager_.get();
}

std::shared_ptr<const ShadowNode> UIManager::findNodeAtPoint(
    const std::shared_ptr<const ShadowNode>& node,
    Point point) const {
  return LayoutableShadowNode::findNodeAtPoint(
      getNewestCloneOfShadowNode(*node), point);
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    const ShadowNode& shadowNode,
    const ShadowNode* ancestorShadowNode,
    LayoutableShadowNode::LayoutInspectingPolicy policy) const {
  TraceSection s("UIManager::getRelativeLayoutMetrics");

  // We might store here an owning pointer to `ancestorShadowNode` to ensure
  // that the node is not deallocated during method execution lifetime.
  auto owningAncestorShadowNode = std::shared_ptr<const ShadowNode>{};

  if (ancestorShadowNode == nullptr) {
    shadowTreeRegistry_.visit(
        shadowNode.getSurfaceId(), [&](const ShadowTree& shadowTree) {
          owningAncestorShadowNode =
              shadowTree.getCurrentRevision().rootShadowNode;
          ancestorShadowNode = owningAncestorShadowNode.get();
        });
  } else {
    // It is possible for JavaScript (or other callers) to have a reference
    // to a previous version of ShadowNodes, but we enforce that
    // metrics are only calculated on most recently committed versions.
    owningAncestorShadowNode = getNewestCloneOfShadowNode(*ancestorShadowNode);
    ancestorShadowNode = owningAncestorShadowNode.get();
  }

  auto layoutableAncestorShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(ancestorShadowNode);

  if (layoutableAncestorShadowNode == nullptr) {
    return EmptyLayoutMetrics;
  }

  return LayoutableShadowNode::computeRelativeLayoutMetrics(
      shadowNode.getFamily(), *layoutableAncestorShadowNode, policy);
}

void UIManager::updateState(const StateUpdate& stateUpdate) const {
  TraceSection s(
      "UIManager::updateState",
      "componentName",
      stateUpdate.family->getComponentName());
  auto& callback = stateUpdate.callback;
  auto& family = stateUpdate.family;
  auto& componentDescriptor = family->getComponentDescriptor();

  shadowTreeRegistry_.visit(
      family->getSurfaceId(), [&](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) {
              auto isValid = true;

              auto rootNode = oldRootShadowNode.cloneTree(
                  *family, [&](const ShadowNode& oldShadowNode) {
                    auto newData =
                        callback(oldShadowNode.getState()->getDataPointer());

                    if (!newData) {
                      isValid = false;
                      // Just return something, we will discard it anyway.
                      return oldShadowNode.clone({});
                    }

                    auto newState =
                        componentDescriptor.createState(*family, newData);

                    return oldShadowNode.clone(
                        {.props = ShadowNodeFragment::propsPlaceholder(),
                         .children = ShadowNodeFragment::childrenPlaceholder(),
                         .state = newState});
                  });

              return isValid
                  ? std::static_pointer_cast<RootShadowNode>(rootNode)
                  : nullptr;
            },
            {/* default commit options */});
      });
}

void UIManager::dispatchCommand(
    const std::shared_ptr<const ShadowNode>& shadowNode,
    const std::string& commandName,
    const folly::dynamic& args) const {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidDispatchCommand(shadowNode, commandName, args);
  }
}

void UIManager::setNativeProps_DEPRECATED(
    const std::shared_ptr<const ShadowNode>& shadowNode,
    RawProps rawProps) const {
  auto& family = shadowNode->getFamily();
  {
    std::lock_guard<std::mutex> lock(family.nativePropsMutex);
    if (family.nativeProps_DEPRECATED) {
      // Values in `rawProps` patch (take precedence over)
      // `nativeProps_DEPRECATED`. For example, if both
      // `nativeProps_DEPRECATED` and `rawProps` contain key 'A'. Value from
      // `rawProps` overrides what was previously in `nativeProps_DEPRECATED`.
      family.nativeProps_DEPRECATED =
          std::make_unique<folly::dynamic>(mergeDynamicProps(
              *family.nativeProps_DEPRECATED,
              (folly::dynamic)rawProps,
              NullValueStrategy::Override));
    } else {
      family.nativeProps_DEPRECATED =
          std::make_unique<folly::dynamic>((folly::dynamic)rawProps);
    }
  }

  shadowTreeRegistry_.visit(
      family.getSurfaceId(), [&](const ShadowTree& shadowTree) {
        // The lambda passed to `commit` may be executed multiple times.
        // We need to create fresh copy of the `RawProps` object each time.
        auto ancestorShadowNode =
            shadowTree.getCurrentRevision().rootShadowNode;
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) {
              auto rootNode = oldRootShadowNode.cloneTree(
                  family, [&](const ShadowNode& oldShadowNode) {
                    auto& componentDescriptor =
                        componentDescriptorRegistry_->at(
                            shadowNode->getComponentHandle());
                    PropsParserContext propsParserContext{
                        family.getSurfaceId(), *contextContainer_};
                    auto props = componentDescriptor.cloneProps(
                        propsParserContext,
                        getShadowNodeInSubtree(*shadowNode, ancestorShadowNode)
                            ->getProps(),
                        RawProps(rawProps));

                    return oldShadowNode.clone({.props = props});
                  });

              return std::static_pointer_cast<RootShadowNode>(rootNode);
            },
            {/* default commit options */});
      });
}

void UIManager::sendAccessibilityEvent(
    const std::shared_ptr<const ShadowNode>& shadowNode,
    const std::string& eventType) {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidSendAccessibilityEvent(shadowNode, eventType);
  }
}

UIManagerViewTransitionDelegate* UIManager::getViewTransitionDelegate() const {
  return viewTransitionDelegate_;
}

void UIManager::configureNextLayoutAnimation(
    jsi::Runtime& runtime,
    const RawValue& config,
    const jsi::Value& successCallback,
    const jsi::Value& failureCallback) const {
  if (animationDelegate_ != nullptr) {
    animationDelegate_->uiManagerDidConfigureNextLayoutAnimation(
        runtime, config, successCallback, failureCallback);
  }
}

static std::shared_ptr<const ShadowNode> findShadowNodeByTagRecursively(
    const std::shared_ptr<const ShadowNode>& parentShadowNode,
    Tag tag) {
  if (parentShadowNode->getTag() == tag) {
    return parentShadowNode;
  }

  for (const std::shared_ptr<const ShadowNode>& shadowNode :
       parentShadowNode->getChildren()) {
    auto result = findShadowNodeByTagRecursively(shadowNode, tag);
    if (result) {
      return result;
    }
  }

  return nullptr;
}

std::shared_ptr<const ShadowNode> UIManager::findShadowNodeByTag_DEPRECATED(
    Tag tag) const {
  auto shadowNode = std::shared_ptr<const ShadowNode>{};

  shadowTreeRegistry_.enumerate([&](const ShadowTree& shadowTree, bool& stop) {
    auto rootShadowNodeHolder = shadowTree.getCurrentRevision().rootShadowNode;
    const auto* rootShadowNode = rootShadowNodeHolder.get();

    if (rootShadowNode != nullptr) {
      const auto& children = rootShadowNode->getChildren();
      if (!children.empty()) {
        const auto& child = children.front();
        shadowNode = findShadowNodeByTagRecursively(child, tag);
        if (shadowNode) {
          stop = true;
        }
      }
    }
  });

  return shadowNode;
}

void UIManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry& componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void UIManager::setDelegate(UIManagerDelegate* delegate) {
  delegate_ = delegate;
}

UIManagerDelegate* UIManager::getDelegate() {
  return delegate_;
}

void UIManager::visitBinding(
    const std::function<void(const UIManagerBinding& uiManagerBinding)>&
        callback,
    jsi::Runtime& runtime) const {
  auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
  if (uiManagerBinding) {
    callback(*uiManagerBinding);
  }
}

const ShadowTreeRegistry& UIManager::getShadowTreeRegistry() const {
  return shadowTreeRegistry_;
}

void UIManager::registerCommitHook(UIManagerCommitHook& commitHook) {
  std::unique_lock lock(commitHookMutex_);
  react_native_assert(
      std::find(commitHooks_.begin(), commitHooks_.end(), &commitHook) ==
      commitHooks_.end());
  commitHook.commitHookWasRegistered(*this);
  commitHooks_.push_back(&commitHook);
}

void UIManager::unregisterCommitHook(UIManagerCommitHook& commitHook) {
  std::unique_lock lock(commitHookMutex_);
  auto iterator =
      std::find(commitHooks_.begin(), commitHooks_.end(), &commitHook);
  react_native_assert(iterator != commitHooks_.end());
  commitHooks_.erase(iterator);
  commitHook.commitHookWasUnregistered(*this);
}

void UIManager::registerMountHook(UIManagerMountHook& mountHook) {
  std::unique_lock lock(mountHookMutex_);
  react_native_assert(
      std::find(mountHooks_.begin(), mountHooks_.end(), &mountHook) ==
      mountHooks_.end());
  mountHooks_.push_back(&mountHook);
}

void UIManager::unregisterMountHook(UIManagerMountHook& mountHook) {
  std::unique_lock lock(mountHookMutex_);
  auto iterator = std::find(mountHooks_.begin(), mountHooks_.end(), &mountHook);
  react_native_assert(iterator != mountHooks_.end());
  mountHooks_.erase(iterator);
}

#pragma mark - ShadowTreeDelegate

RootShadowNode::Unshared UIManager::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& oldRootShadowNode,
    const RootShadowNode::Unshared& newRootShadowNode,
    const ShadowTree::CommitOptions& commitOptions) const {
  TraceSection s("UIManager::shadowTreeWillCommit");

  std::shared_lock lock(commitHookMutex_);

  auto resultRootShadowNode = newRootShadowNode;
  for (auto* commitHook : commitHooks_) {
    resultRootShadowNode = commitHook->shadowTreeWillCommit(
        shadowTree, oldRootShadowNode, resultRootShadowNode, commitOptions);
  }

  return resultRootShadowNode;
}

void UIManager::shadowTreeDidFinishTransaction(
    std::shared_ptr<const MountingCoordinator> mountingCoordinator,
    bool mountSynchronously) const {
  TraceSection s("UIManager::shadowTreeDidFinishTransaction");

  if (delegate_ != nullptr) {
    delegate_->uiManagerDidFinishTransaction(
        std::move(mountingCoordinator), mountSynchronously);
  }
}

void UIManager::shadowTreeDidFinishReactCommit(
    const ShadowTree& shadowTree) const {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidFinishReactCommit(shadowTree);
  }
}

void UIManager::shadowTreeDidPromoteReactRevision(
    const ShadowTree& shadowTree) const {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidPromoteReactRevision(shadowTree);
  }
}

void UIManager::reportMount(SurfaceId surfaceId) const {
  TraceSection s("UIManager::reportMount");

  auto time = HighResTimeStamp::now();

  auto rootShadowNode = RootShadowNode::Shared{};
  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    rootShadowNode =
        shadowTree.getMountingCoordinator()->getBaseRevision().rootShadowNode;
  });

  {
    std::shared_lock lock(mountHookMutex_);

    for (auto* mountHook : mountHooks_) {
      if (rootShadowNode) {
        mountHook->shadowTreeDidMount(rootShadowNode, time);
      } else {
        mountHook->shadowTreeDidUnmount(surfaceId, time);
      }
    }
  }
}

#pragma mark - UIManagerAnimationDelegate

void UIManager::setAnimationDelegate(UIManagerAnimationDelegate* delegate) {
  animationDelegate_ = delegate;
}

void UIManager::stopSurfaceForAnimationDelegate(SurfaceId surfaceId) const {
  if (animationDelegate_ != nullptr) {
    animationDelegate_->stopSurface(surfaceId);
  }
}

void UIManager::setNativeAnimatedDelegate(
    std::weak_ptr<UIManagerNativeAnimatedDelegate> delegate) {
  nativeAnimatedDelegate_ = delegate;
}

void UIManager::setViewTransitionDelegate(
    UIManagerViewTransitionDelegate* delegate) {
  if (ReactNativeFeatureFlags::viewTransitionEnabled()) {
    viewTransitionDelegate_ = delegate;
  }
}

void UIManager::unstable_setAnimationBackend(
    std::shared_ptr<UIManagerAnimationBackend> animationBackend) {
  animationBackend_ = animationBackend;
}

std::weak_ptr<UIManagerAnimationBackend>
UIManager::unstable_getAnimationBackend() {
  return animationBackend_;
}

void UIManager::animationTick() const {
  if (animationDelegate_ != nullptr &&
      animationDelegate_->shouldAnimateFrame()) {
    shadowTreeRegistry_.enumerate([](const ShadowTree& shadowTree, bool&) {
      shadowTree.notifyDelegatesOfUpdates();
    });
  }

  if (!ReactNativeFeatureFlags::useSharedAnimatedBackend()) {
    if (auto nativeAnimatedDelegate = nativeAnimatedDelegate_.lock()) {
      nativeAnimatedDelegate->runAnimationFrame();
    }
  }
}

void UIManager::synchronouslyUpdateViewOnUIThread(
    Tag tag,
    const folly::dynamic& props) {
  if (delegate_ != nullptr) {
    delegate_->uiManagerShouldSynchronouslyUpdateViewOnUIThread(tag, props);
  }
}

#pragma mark ContextContainer

std::shared_ptr<const ContextContainer> UIManager::getContextContainer() const {
  return contextContainer_;
}

#pragma mark - Add & Remove event listener

void UIManager::addEventListener(
    std::shared_ptr<const EventListener> listener) {
  if (delegate_ != nullptr) {
    delegate_->uiManagerShouldAddEventListener(listener);
  }
}

void UIManager::removeEventListener(
    const std::shared_ptr<const EventListener>& listener) {
  if (delegate_ != nullptr) {
    delegate_->uiManagerShouldRemoveEventListener(listener);
  }
}

void UIManager::addOnSurfaceStartCallback(
    UIManagerDelegate::OnSurfaceStartCallback&& callback) {
  if (delegate_ != nullptr) {
    delegate_->uiManagerShouldAddOnSurfaceStartCallback(std::move(callback));
  }
}

} // namespace facebook::react
