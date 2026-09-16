/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeIntersectionObserver.h"
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
NativeIntersectionObserverModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeIntersectionObserver>(
      std::move(jsInvoker));
}

namespace facebook::react {

namespace {

jsi::Object tokenFromShadowNodeFamily(
    jsi::Runtime& runtime,
    ShadowNodeFamily::Shared shadowNodeFamily) {
  jsi::Object token(runtime);
  token.setNativeState(
      runtime,
      std::const_pointer_cast<ShadowNodeFamily>(std::move(shadowNodeFamily)));
  return token;
}

ShadowNodeFamily::Shared shadowNodeFamilyFromToken(
    jsi::Runtime& runtime,
    jsi::Object token) {
  return token.getNativeState<ShadowNodeFamily>(runtime);
}

} // namespace

NativeIntersectionObserver::NativeIntersectionObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeIntersectionObserverCxxSpec(std::move(jsInvoker)) {}

jsi::Object NativeIntersectionObserver::observeV2(
    jsi::Runtime& runtime,
    NativeIntersectionObserverObserveOptions options) {
  auto intersectionObserverId = options.intersectionObserverId;
  auto shadowNode = options.targetShadowNode;
  auto shadowNodeFamily = shadowNode->getFamilyShared();

  std::optional<ShadowNodeFamily::Shared> observationRootShadowNodeFamily;
  if (options.rootShadowNode.has_value()) {
    observationRootShadowNodeFamily =
        options.rootShadowNode.value()->getFamilyShared();
  }

  auto thresholds = options.thresholds;
  auto rootThresholds = options.rootThresholds;
  auto rootMargin = options.rootMargin;
  auto& uiManager = getUIManagerFromRuntime(runtime);

  intersectionObserverManager_.observe(
      intersectionObserverId,
      observationRootShadowNodeFamily,
      shadowNodeFamily,
      thresholds,
      rootThresholds,
      rootMargin,
      uiManager);

  return tokenFromShadowNodeFamily(runtime, shadowNodeFamily);
}

void NativeIntersectionObserver::unobserveV2(
    jsi::Runtime& runtime,
    IntersectionObserverObserverId intersectionObserverId,
    jsi::Object targetToken) {
  auto shadowNodeFamily =
      shadowNodeFamilyFromToken(runtime, std::move(targetToken));
  intersectionObserverManager_.unobserve(
      intersectionObserverId, shadowNodeFamily);
}

void NativeIntersectionObserver::connect(
    jsi::Runtime& runtime,
    AsyncCallback<> notifyIntersectionObserversCallback) {
  auto& uiManager = getUIManagerFromRuntime(runtime);
  intersectionObserverManager_.connect(
      *RuntimeSchedulerBinding::getBinding(runtime)->getRuntimeScheduler(),
      uiManager,
      std::move(notifyIntersectionObserversCallback));
}

void NativeIntersectionObserver::disconnect(jsi::Runtime& runtime) {
  auto& uiManager = getUIManagerFromRuntime(runtime);
  intersectionObserverManager_.disconnect(
      *RuntimeSchedulerBinding::getBinding(runtime)->getRuntimeScheduler(),
      uiManager);
}

std::vector<NativeIntersectionObserverEntry>
NativeIntersectionObserver::takeRecords(jsi::Runtime& runtime) {
  auto entries = intersectionObserverManager_.takeRecords();

  std::vector<NativeIntersectionObserverEntry> nativeModuleEntries;
  nativeModuleEntries.reserve(entries.size());

  for (const auto& entry : entries) {
    nativeModuleEntries.emplace_back(
        convertToNativeModuleEntry(entry, runtime));
  }

  return nativeModuleEntries;
}

NativeIntersectionObserverEntry
NativeIntersectionObserver::convertToNativeModuleEntry(
    const IntersectionObserverEntry& entry,
    jsi::Runtime& runtime) {
  RectAsTuple targetRect = {
      entry.targetRect.origin.x,
      entry.targetRect.origin.y,
      entry.targetRect.size.width,
      entry.targetRect.size.height};
  RectAsTuple rootRect = {
      entry.rootRect.origin.x,
      entry.rootRect.origin.y,
      entry.rootRect.size.width,
      entry.rootRect.size.height};
  RectAsTuple intersectionRect = {
      entry.intersectionRect.origin.x,
      entry.intersectionRect.origin.y,
      entry.intersectionRect.size.width,
      entry.intersectionRect.size.height};

  NativeIntersectionObserverEntry nativeModuleEntry = {
      entry.intersectionObserverId,
      (*entry.shadowNodeFamily).getInstanceHandle(runtime),
      targetRect,
      rootRect,
      intersectionRect,
      entry.isIntersectingAboveThresholds,
      entry.time,
  };

  return nativeModuleEntry;
}

UIManager& NativeIntersectionObserver::getUIManagerFromRuntime(
    jsi::Runtime& runtime) {
  return UIManagerBinding::getBinding(runtime)->getUIManager();
}

} // namespace facebook::react
