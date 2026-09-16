/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeResizeObserver.h"
#include <react/renderer/bridging/bridging.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
NativeResizeObserverModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeResizeObserver>(
      std::move(jsInvoker));
}

namespace facebook::react {

template <>
struct Bridging<NativeResizeObserverObserveOptions>
    : NativeResizeObserverNativeResizeObserverObserveOptionsBridging<
          NativeResizeObserverObserveOptions> {};

template <>
struct Bridging<NativeResizeObserverEntry>
    : NativeResizeObserverNativeResizeObserverEntryBridging<
          NativeResizeObserverEntry> {};

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
    const jsi::Object& token) {
  return token.getNativeState<ShadowNodeFamily>(runtime);
}

UIManager& uiManagerFromRuntime(jsi::Runtime& runtime) {
  return UIManagerBinding::getBinding(runtime)->getUIManager();
}

RuntimeScheduler& runtimeSchedulerFromRuntime(jsi::Runtime& runtime) {
  return *RuntimeSchedulerBinding::getBinding(runtime)->getRuntimeScheduler();
}

ResizeObserverBoxOptions boxOptionsFromOptionalString(
    const std::optional<std::string>& box) {
  if (box.has_value()) {
    if (*box == "border-box") {
      return ResizeObserverBoxOptions::BorderBox;
    } else if (*box == "device-pixel-content-box") {
      return ResizeObserverBoxOptions::DevicePixelContentBox;
    }
  }

  return ResizeObserverBoxOptions::ContentBox;
}

NativeResizeObserverEntry convertToNativeModuleEntry(
    jsi::Runtime& runtime,
    const ResizeObserverEntry& entry) {
  auto contentRect = RectAsTuple{
      entry.contentRect.origin.x,
      entry.contentRect.origin.y,
      entry.contentRect.size.width,
      entry.contentRect.size.height};
  auto borderBoxSize =
      SizeAsTuple{entry.borderBoxSize.width, entry.borderBoxSize.height};
  auto contentBoxSize =
      SizeAsTuple{entry.contentBoxSize.width, entry.contentBoxSize.height};
  auto devicePixelContentBoxSize = SizeAsTuple{
      entry.devicePixelContentBoxSize.width,
      entry.devicePixelContentBoxSize.height};

  return {
      entry.resizeObserverId,
      entry.shadowNodeFamily->getInstanceHandle(runtime),
      contentRect,
      borderBoxSize,
      contentBoxSize,
      devicePixelContentBoxSize};
}

} // namespace

NativeResizeObserver::NativeResizeObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeResizeObserverCxxSpec(std::move(jsInvoker)) {}

jsi::Object NativeResizeObserver::observe(
    jsi::Runtime& runtime,
    const NativeResizeObserverObserveOptions& options) {
  auto resizeObserverId = options.resizeObserverId;
  auto shadowNodeFamily = options.targetShadowNode->getFamilyShared();
  auto boxOptions = boxOptionsFromOptionalString(options.box);

  resizeObserverManager_.observe(
      resizeObserverId, shadowNodeFamily, boxOptions);

  return tokenFromShadowNodeFamily(runtime, shadowNodeFamily);
}

void NativeResizeObserver::unobserve(
    jsi::Runtime& runtime,
    ResizeObserverObserverId resizeObserverId,
    jsi::Object targetToken) {
  auto shadowNodeFamily = shadowNodeFamilyFromToken(runtime, targetToken);
  resizeObserverManager_.unobserve(resizeObserverId, shadowNodeFamily);
}

void NativeResizeObserver::connect(
    jsi::Runtime& runtime,
    NativeResizeObserverNotifyCallback notifyResizeObserversFunction) {
  // `SyncCallback` is move-only, so share it: the manager copies the callable
  // before invoking it, so that a `disconnect()` from within a callback can't
  // destroy it mid-call. It also already holds the runtime it was created with,
  // hence the unused parameter.
  auto callback = std::make_shared<NativeResizeObserverNotifyCallback>(
      std::move(notifyResizeObserversFunction));

  resizeObserverManager_.connect(
      runtimeSchedulerFromRuntime(runtime),
      uiManagerFromRuntime(runtime),
      [callback = std::move(callback)](
          jsi::Runtime& /*runtime*/, bool hasResizeLoopError) {
        (*callback)(hasResizeLoopError);
      });
}

void NativeResizeObserver::disconnect(jsi::Runtime& runtime) {
  resizeObserverManager_.disconnect(
      runtimeSchedulerFromRuntime(runtime), uiManagerFromRuntime(runtime));
}

std::vector<NativeResizeObserverEntry> NativeResizeObserver::takeRecords(
    jsi::Runtime& runtime) {
  auto entries = resizeObserverManager_.takeRecords();

  std::vector<NativeResizeObserverEntry> nativeModuleEntries;
  nativeModuleEntries.reserve(entries.size());

  for (const auto& entry : entries) {
    nativeModuleEntries.emplace_back(
        convertToNativeModuleEntry(runtime, entry));
  }

  return nativeModuleEntries;
}

} // namespace facebook::react
