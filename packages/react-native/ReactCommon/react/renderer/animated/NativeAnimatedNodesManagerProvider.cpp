/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeAnimatedNodesManagerProvider.h"

#include <glog/logging.h>
#include <react/renderer/animated/MergedValueDispatcher.h>
#include <react/renderer/animated/internal/AnimatedMountingOverrideDelegate.h>
#include <react/renderer/animated/internal/primitives.h>
#include <react/renderer/animationbackend/AnimationBackend.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

namespace facebook::react {

UIManagerNativeAnimatedDelegateImpl::UIManagerNativeAnimatedDelegateImpl(
    std::weak_ptr<NativeAnimatedNodesManager> manager)
    : nativeAnimatedNodesManager_(manager) {}

void UIManagerNativeAnimatedDelegateImpl::runAnimationFrame() {
  if (auto nativeAnimatedNodesManagerStrong =
          nativeAnimatedNodesManager_.lock()) {
    nativeAnimatedNodesManagerStrong->onRender();
  }
}

NativeAnimatedNodesManagerProvider::NativeAnimatedNodesManagerProvider(
    NativeAnimatedNodesManager::StartOnRenderCallback startOnRenderCallback,
    NativeAnimatedNodesManager::StopOnRenderCallback stopOnRenderCallback,
    NativeAnimatedNodesManager::FrameRateListenerCallback
        frameRateListenerCallback)
    : eventEmitterListenerContainer_(
          std::make_shared<EventEmitterListenerContainer>()),
      startOnRenderCallback_(std::move(startOnRenderCallback)),
      stopOnRenderCallback_(std::move(stopOnRenderCallback)),
      frameRateListenerCallback_(std::move(frameRateListenerCallback)) {}

std::shared_ptr<NativeAnimatedNodesManager>
NativeAnimatedNodesManagerProvider::getOrCreate(
    jsi::Runtime& runtime,
    std::shared_ptr<CallInvoker> jsInvoker) {
  if (nativeAnimatedNodesManager_ != nullptr) {
    return nativeAnimatedNodesManager_;
  }

  auto* uiManager = &UIManagerBinding::getBinding(runtime)->getUIManager();

  auto animationBackend = uiManager->unstable_getAnimationBackend().lock();
  if (animationBackend == nullptr) {
    // === PATH 1: Legacy Backend (no shared AnimationBackend attached) ===
    // Uses the architecture with MergedValueDispatcher and
    // AnimatedMountingOverrideDelegate

    mergedValueDispatcher_ = std::make_unique<MergedValueDispatcher>(
        [jsInvoker](std::function<void()>&& func) {
          jsInvoker->invokeAsync(std::move(func));
        },
        [uiManager](std::unordered_map<Tag, folly::dynamic>&& tagToProps) {
          uiManager->updateShadowTree(std::move(tagToProps));
        });

    NativeAnimatedNodesManager::FabricCommitCallback fabricCommitCallback =
        [this](std::unordered_map<Tag, folly::dynamic>& tagToProps) {
          mergedValueDispatcher_->dispatch(tagToProps);
        };

    auto directManipulationCallback =
        [uiManager](Tag viewTag, const folly::dynamic& props) {
          uiManager->synchronouslyUpdateViewOnUIThread(viewTag, props);
        };

    // TODO: remove force casting.
    auto* scheduler = (Scheduler*)uiManager->getDelegate();
    auto resolvePlatformColor = [scheduler, uiManager](
                                    SurfaceId surfaceId,
                                    const RawValue& value,
                                    SharedColor& result) {
      if (uiManager) {
        if (surfaceId != animated::undefinedAnimatedNodeIdentifier) {
          PropsParserContext propsParserContext{
              surfaceId, *scheduler->getContextContainer()};
          fromRawValue(propsParserContext, value, result);
        } else {
          LOG(ERROR)
              << "Cannot resolve platformColor because surfaceId is unavailable.";
        }
      }
    };

    nativeAnimatedNodesManager_ = std::make_shared<NativeAnimatedNodesManager>(
        std::move(directManipulationCallback),
        std::move(fabricCommitCallback),
        std::move(resolvePlatformColor),
        std::move(startOnRenderCallback_),
        std::move(stopOnRenderCallback_),
        std::move(frameRateListenerCallback_));

    nativeAnimatedDelegate_ =
        std::make_shared<UIManagerNativeAnimatedDelegateImpl>(
            nativeAnimatedNodesManager_);

    animatedMountingOverrideDelegate_ =
        std::make_shared<AnimatedMountingOverrideDelegate>(
            *nativeAnimatedNodesManager_, *scheduler);

    // Register on existing surfaces
    uiManager->getShadowTreeRegistry().enumerate(
        [animatedMountingOverrideDelegate =
             std::weak_ptr<const AnimatedMountingOverrideDelegate>(
                 animatedMountingOverrideDelegate_)](
            const ShadowTree& shadowTree, bool& /*stop*/) {
          shadowTree.getMountingCoordinator()->setMountingOverrideDelegate(
              animatedMountingOverrideDelegate);
        });

    // Register on surfaces started in the future
    uiManager->setOnSurfaceStartCallback(
        [animatedMountingOverrideDelegate =
             std::weak_ptr<const AnimatedMountingOverrideDelegate>(
                 animatedMountingOverrideDelegate_)](
            const ShadowTree& shadowTree) {
          shadowTree.getMountingCoordinator()->setMountingOverrideDelegate(
              animatedMountingOverrideDelegate);
        });

    uiManager->setNativeAnimatedDelegate(nativeAnimatedDelegate_);
  } else {
    // === PATH 2: Shared AnimationBackend ===
    // Uses the shared AnimationBackend from UIManager. The backend handles all
    // animation commits and platform integration internally. It is guaranteed
    // non-null here because it was successfully locked above.
    animationBackend->registerJSInvoker(jsInvoker);

    nativeAnimatedNodesManager_ =
        std::make_shared<NativeAnimatedNodesManager>(animationBackend);
  }

  addEventEmitterListener(
      nativeAnimatedNodesManager_->getEventEmitterListener());

  uiManager->addEventListener(
      std::make_shared<EventListener>(
          [eventEmitterListenerContainerWeak =
               std::weak_ptr<EventEmitterListenerContainer>(
                   eventEmitterListenerContainer_)](const RawEvent& rawEvent) {
            const auto& eventTarget = rawEvent.eventTarget;
            const auto& eventPayload = rawEvent.eventPayload;
            if (eventTarget && eventPayload) {
              if (auto eventEmitterListenerContainer =
                      eventEmitterListenerContainerWeak.lock();
                  eventEmitterListenerContainer != nullptr) {
                return eventEmitterListenerContainer->willDispatchEvent(
                    eventTarget->getTag(), rawEvent.type, *eventPayload);
              }
            }
            return false;
          }));

  return nativeAnimatedNodesManager_;
}

void NativeAnimatedNodesManagerProvider::addEventEmitterListener(
    const std::shared_ptr<EventEmitterListener>& listener) {
  eventEmitterListenerContainer_->addListener(listener);
}

std::shared_ptr<EventEmitterListener>
NativeAnimatedNodesManagerProvider::getEventEmitterListener() {
  if (!eventEmitterListener_) {
    eventEmitterListener_ = std::make_shared<EventEmitterListener>(
        [eventEmitterListenerContainerWeak =
             std::weak_ptr<EventEmitterListenerContainer>(
                 eventEmitterListenerContainer_)](
            Tag tag,
            const std::string& eventName,
            const EventPayload& payload) -> bool {
          if (auto eventEmitterListenerContainer =
                  eventEmitterListenerContainerWeak.lock();
              eventEmitterListenerContainer != nullptr) {
            return eventEmitterListenerContainer->willDispatchEvent(
                tag, eventName, payload);
          }
          return false;
        });
  }
  return eventEmitterListener_;
}

} // namespace facebook::react
