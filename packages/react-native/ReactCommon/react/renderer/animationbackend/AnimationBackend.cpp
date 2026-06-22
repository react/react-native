/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationBackend.h"
#include "AnimatedPropsRegistry.h"

#include <cxxreact/TraceSection.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/animationbackend/AnimatedPropsSerializer.h>
#include <chrono>
#include <utility>

namespace facebook::react {

static inline Props::Shared cloneProps(
    AnimatedProps& animatedProps,
    const ShadowNode& shadowNode) {
  PropsParserContext propsParserContext{
      shadowNode.getSurfaceId(), *shadowNode.getContextContainer()};
  Props::Shared newProps;
  if (animatedProps.rawProps) {
    if (ReactNativeFeatureFlags::enableFabricCommitBranching()) {
      newProps = shadowNode.getComponentDescriptor().cloneProps(
          propsParserContext,
          shadowNode.getProps(),
          std::move(*animatedProps.rawProps));
    } else {
      newProps = shadowNode.getComponentDescriptor().cloneProps(
          propsParserContext,
          shadowNode.getProps(),
          RawProps(*animatedProps.rawProps));
    }
  } else {
    newProps = shadowNode.getComponentDescriptor().cloneProps(
        propsParserContext, shadowNode.getProps(), {});
  }

  auto viewProps = std::const_pointer_cast<BaseViewProps>(
      std::static_pointer_cast<const BaseViewProps>(newProps));
  for (auto& animatedProp : animatedProps.props) {
    cloneProp(*viewProps, *animatedProp);
  }
  return newProps;
}

AnimationBackend::AnimationBackend(
    std::shared_ptr<AnimationChoreographer> animationChoreographer,
    std::shared_ptr<UIManager> uiManager)
    : animatedPropsRegistry_(std::make_shared<AnimatedPropsRegistry>()),
      animationChoreographer_(std::move(animationChoreographer)),
      commitHook_(*uiManager, animatedPropsRegistry_),
      uiManager_(std::move(uiManager)) {
  react_native_assert(uiManager_.expired() == false);
}

void AnimationBackend::unpackMutations(
    AnimationMutations& mutations,
    std::unordered_map<SurfaceId, SurfaceUpdates>& surfaceUpdates,
    std::set<SurfaceId>& asyncFlushSurfaces) {
  for (auto& mutation : mutations.batch) {
    const auto family = mutation.family;
    react_native_assert(family != nullptr);

    auto& [families, updates, hasLayoutUpdates] =
        surfaceUpdates[family->getSurfaceId()];
    hasLayoutUpdates |= mutation.hasLayoutUpdates;
    families.insert(family);
    updates[mutation.tag] = std::move(mutation.props);
  }

  asyncFlushSurfaces.merge(mutations.asyncFlushSurfaces);
}

void AnimationBackend::applySurfaceUpdates(
    std::unordered_map<SurfaceId, SurfaceUpdates>& surfaceUpdates,
    const std::set<SurfaceId>& asyncFlushSurfaces) {
  TraceSection s(
      "AnimationBackend::applySurfaceUpdates",
      "surfaceCount",
      surfaceUpdates.size());
  animatedPropsRegistry_->update(surfaceUpdates);

  for (auto& [surfaceId, updates] : surfaceUpdates) {
    if (updates.hasLayoutUpdates) {
      commitUpdates(surfaceId, updates);
    } else {
      synchronouslyUpdateProps(surfaceId, updates.propsMap);
    }
  }

  requestAsyncFlushForSurfaces(asyncFlushSurfaces);
}

void AnimationBackend::applyMutations(AnimationMutations mutations) {
  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates;
  std::set<SurfaceId> asyncFlushSurfaces;
  unpackMutations(mutations, surfaceUpdates, asyncFlushSurfaces);
  applySurfaceUpdates(surfaceUpdates, asyncFlushSurfaces);
}

void AnimationBackend::onAnimationFrame(AnimationTimestamp timestamp) {
  TraceSection s("AnimationBackend::onAnimationFrame");
  std::vector<CallbackWithId> callbacksCopy;

  {
    std::lock_guard lock(mutex_);
    callbacksCopy = callbacks;
  }

  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates;
  std::set<SurfaceId> asyncFlushSurfaces;
  for (auto& callbackWithId : callbacksCopy) {
    auto mutations = callbackWithId.callback(timestamp);
    unpackMutations(mutations, surfaceUpdates, asyncFlushSurfaces);
  }
  applySurfaceUpdates(surfaceUpdates, asyncFlushSurfaces);
}

CallbackId AnimationBackend::start(const Callback& callback) {
  std::lock_guard lock(mutex_);

  auto callbackId = nextCallbackId_++;
  callbacks.push_back({.callbackId = callbackId, .callback = callback});
  if (!isRenderCallbackStarted_) {
    animationChoreographer_->resume();
    isRenderCallbackStarted_ = true;
  }

  return callbackId;
}

void AnimationBackend::stop(CallbackId callbackId) {
  std::lock_guard lock(mutex_);

  auto it = std::find_if(callbacks.begin(), callbacks.end(), [&](auto& c) {
    return c.callbackId == callbackId;
  });
  if (it == callbacks.end()) {
    return;
  }

  callbacks.erase(it);
  if (isRenderCallbackStarted_ && callbacks.empty()) {
    animationChoreographer_->pause();
    isRenderCallbackStarted_ = false;
  }
}

void AnimationBackend::trigger() {
  onAnimationFrame(std::chrono::steady_clock::now().time_since_epoch());
}

void AnimationBackend::pushAnimationMutations(const Callback& callback) {
  auto timestamp = animationChoreographer_->now();
  auto mutations = callback(timestamp);
  applyMutations(std::move(mutations));
}

void AnimationBackend::commitUpdates(
    SurfaceId surfaceId,
    SurfaceUpdates& surfaceUpdates) {
  TraceSection s(
      "AnimationBackend::commitUpdates",
      "surfaceId",
      surfaceId,
      "updateCount",
      surfaceUpdates.propsMap.size());
  auto uiManager = uiManager_.lock();
  if (!uiManager) {
    return;
  }

  auto& surfaceFamilies = surfaceUpdates.families;
  auto& updates = surfaceUpdates.propsMap;

  uiManager->getShadowTreeRegistry().visit(
      surfaceId, [&surfaceFamilies, &updates](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&surfaceFamilies,
             &updates](const RootShadowNode& oldRootShadowNode) {
              return std::static_pointer_cast<RootShadowNode>(
                  oldRootShadowNode.cloneMultiple(
                      surfaceFamilies,
                      [&surfaceFamilies, &updates](
                          const ShadowNode& shadowNode,
                          const ShadowNodeFragment& fragment) {
                        auto newProps = ShadowNodeFragment::propsPlaceholder();
                        if (surfaceFamilies.contains(
                                shadowNode.getFamilyShared())) {
                          auto& animatedProps = updates.at(shadowNode.getTag());
                          newProps = cloneProps(animatedProps, shadowNode);
                        }
                        return shadowNode.clone(
                            {.props = newProps,
                             .children = fragment.children,
                             .state = shadowNode.getState()});
                      }));
            },
            {.mountSynchronously = true});
      });
}

void AnimationBackend::synchronouslyUpdatePropsUnbuffered(
    const std::unordered_map<Tag, AnimatedProps>& updates) {
  TraceSection s(
      "AnimationBackend::synchronouslyUpdatePropsUnbuffered",
      "updateCount",
      updates.size());
  for (auto& [tag, animatedProps] : updates) {
    auto dyn = animationbackend::packAnimatedProps(animatedProps);
    if (auto uiManager = uiManager_.lock()) {
      uiManager->synchronouslyUpdateViewOnUIThread(tag, dyn);
    }
  }
}

void AnimationBackend::synchronouslyUpdateProps(
    SurfaceId surfaceId,
    const std::unordered_map<Tag, AnimatedProps>& updates) {
  TraceSection s(
      "AnimationBackend::synchronouslyUpdateProps",
      "surfaceId",
      surfaceId,
      "updateCount",
      updates.size());
  if (ReactNativeFeatureFlags::optimizedAnimatedPropUpdates()) {
    if (auto uiManager = uiManager_.lock()) {
      uiManager->synchronouslyUpdateAnimatedPropsOnUIThread(surfaceId, updates);
    }
    return;
  }
  synchronouslyUpdatePropsUnbuffered(updates);
}

void AnimationBackend::requestAsyncFlushForSurfaces(
    const std::set<SurfaceId>& surfaces) {
  TraceSection s(
      "AnimationBackend::requestAsyncFlushForSurfaces",
      "surfaceCount",
      surfaces.size());
  react_native_assert(
      jsInvoker_ != nullptr ||
      surfaces.empty() && "jsInvoker_ was not provided");
  std::weak_ptr<AnimatedPropsRegistry> weakAnimatedPropsRegistry =
      animatedPropsRegistry_;
  for (const auto& surfaceId : surfaces) {
    // perform an empty commit on the js thread, to force the commit hook to
    // push updated shadow nodes to react through RSNRU
    jsInvoker_->invokeAsync(
        [weakUIManager = uiManager_, surfaceId, weakAnimatedPropsRegistry]() {
          auto uiManager = weakUIManager.lock();
          if (!uiManager) {
            return;
          }
          uiManager->getShadowTreeRegistry().visit(
              surfaceId,
              [weakAnimatedPropsRegistry](const ShadowTree& shadowTree) {
                auto result = shadowTree.commit(
                    [weakAnimatedPropsRegistry](
                        const RootShadowNode& oldRootShadowNode) {
                      return std::static_pointer_cast<RootShadowNode>(
                          oldRootShadowNode.ShadowNode::clone({}));
                    },
                    {.source = ShadowTreeCommitSource::AnimationEndSync});
                // To clear the registry, the updates neeed to be propagated to
                // React with RSNRU. Without
                // updateRuntimeShadowNodeReferencesOnCommitThread this won't
                // happen if we do any commits on the main thread, since the
                // runtimeShadowNodeReference_ is not propagated to nodes cloned
                // outside of the JS thread. So when the flag is disabled we
                // keep the updates in the registry and we will reapply them in
                // a commit hook triggered by a rerender.
                if (result == ShadowTree::CommitStatus::Succeeded &&
                    ReactNativeFeatureFlags::
                        updateRuntimeShadowNodeReferencesOnCommitThread()) {
                  if (auto animatedPropsRegistry =
                          weakAnimatedPropsRegistry.lock()) {
                    animatedPropsRegistry->clear(shadowTree.getSurfaceId());
                  }
                }
              });
        });
  }
}

void AnimationBackend::clearRegistry(SurfaceId surfaceId) {
  animatedPropsRegistry_->clear(surfaceId);
}

void AnimationBackend::clearRegistryOnSurfaceStop(SurfaceId surfaceId) {
  animatedPropsRegistry_->clearOnSurfaceStop(surfaceId);
}

void AnimationBackend::registerJSInvoker(
    std::shared_ptr<CallInvoker> jsInvoker) {
  if (!jsInvoker_) {
    jsInvoker_ = jsInvoker;
  }
}

} // namespace facebook::react
