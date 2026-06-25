/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DefaultTurboModules.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/nativemodule/dom/NativeDOM.h>
#include <react/nativemodule/featureflags/NativeReactNativeFeatureFlags.h>
#include <react/nativemodule/idlecallbacks/NativeIdleCallbacks.h>
#include <react/nativemodule/intersectionobserver/NativeIntersectionObserver.h>
#include <react/nativemodule/microtasks/NativeMicrotasks.h>
#include <react/nativemodule/mutationobserver/NativeMutationObserver.h>
#include <react/nativemodule/viewtransition/NativeViewTransition.h>
#include <react/nativemodule/webperformance/NativePerformance.h>
#include <react/renderer/animated/AnimatedModule.h>

#ifdef REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY
#include <react/nativemodule/devtoolsruntimesettings/DevToolsRuntimeSettingsModule.h>
#endif

namespace facebook::react {

/* static */ std::shared_ptr<TurboModule> DefaultTurboModules::getTurboModule(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  if (name == NativeReactNativeFeatureFlags::kModuleName) {
    return std::make_shared<NativeReactNativeFeatureFlags>(jsInvoker);
  }

  if (name == NativeMicrotasks::kModuleName) {
    return std::make_shared<NativeMicrotasks>(jsInvoker);
  }

  if (name == NativeIdleCallbacks::kModuleName) {
    return std::make_shared<NativeIdleCallbacks>(jsInvoker);
  }

  if (name == NativeDOM::kModuleName) {
    return std::make_shared<NativeDOM>(jsInvoker);
  }

  if (name == NativePerformance::kModuleName) {
    return std::make_shared<NativePerformance>(jsInvoker);
  }

  if (ReactNativeFeatureFlags::enableIntersectionObserverByDefault()) {
    if (name == NativeIntersectionObserver::kModuleName) {
      return std::make_shared<NativeIntersectionObserver>(jsInvoker);
    }
  }

  if (ReactNativeFeatureFlags::enableMutationObserverByDefault()) {
    if (name == NativeMutationObserver::kModuleName) {
      return std::make_shared<NativeMutationObserver>(jsInvoker);
    }
  }

  if (ReactNativeFeatureFlags::viewTransitionEnabled()) {
    if (name == NativeViewTransition::kModuleName) {
      return std::make_shared<NativeViewTransition>(jsInvoker);
    }
  }

  if (ReactNativeFeatureFlags::cxxNativeAnimatedEnabled() &&
  // on Android, the render loop for AnimatedModule is driven
  // internally whether or not shared backend is enabled; ios uses
  // RCTAnimatedModuleProvider.mm to drive the render loop when shared backend
  // is off
#ifndef __ANDROID__
      ReactNativeFeatureFlags::useSharedAnimatedBackend() &&
#endif
      name == AnimatedModule::kModuleName) {
    return std::make_shared<AnimatedModule>(
        jsInvoker, std::make_shared<NativeAnimatedNodesManagerProvider>());
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY
  if (name == DevToolsRuntimeSettingsModule::kModuleName) {
    return std::make_shared<DevToolsRuntimeSettingsModule>(jsInvoker);
  }
#endif

  return nullptr;
}

} // namespace facebook::react
