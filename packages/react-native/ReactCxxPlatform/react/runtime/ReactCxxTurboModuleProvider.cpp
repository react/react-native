/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactCxxTurboModuleProvider.h"

#include <react/coremodules/AppStateModule.h>
#include <react/coremodules/DeviceInfoModule.h>
#include <react/coremodules/PlatformConstantsModule.h>
#include <react/debug/react_native_assert.h>
#include <react/devsupport/DevLoadingViewModule.h>
#include <react/devsupport/DevSettingsModule.h>
#include <react/devsupport/LogBoxModule.h>
#include <react/devsupport/SourceCodeModule.h>
#include <react/io/ImageLoaderModule.h>
#include <react/io/NetworkingModule.h>
#include <react/io/WebSocketModule.h>
#include <react/logging/NativeExceptionsManager.h>
#include <react/nativemodule/defaults/DefaultTurboModules.h>
#include <react/nativemodule/intersectionobserver/NativeIntersectionObserver.h>
#include <react/nativemodule/mutationobserver/NativeMutationObserver.h>
#include <react/nativemodule/webperformance/NativePerformance.h>
#include <react/renderer/animated/AnimatedModule.h>

using namespace facebook::react;

ReactCxxTurboModuleProvider::ReactCxxTurboModuleProvider(
    TurboModuleProviders turboModuleProviders,
    std::shared_ptr<CallInvoker> jsInvoker,
    JsErrorHandler::OnJsError onJsError,
    std::shared_ptr<NativeAnimatedNodesManagerProvider>
        animatedNodesManagerProvider,
    std::shared_ptr<DevServerHelper> devServerHelper,
    std::shared_ptr<IDevUIDelegate> devUIDelegate,
    std::shared_ptr<SurfaceDelegate> logBoxSurfaceDelegate,
    HttpClientFactory httpClientFactory,
    WebSocketClientFactory webSocketClientFactory,
    std::function<void()> liveReloadCallback,
    std::shared_ptr<std::string> sourceURL)
    : turboModuleProviders_(std::move(turboModuleProviders)),
      jsInvoker_(std::move(jsInvoker)),
      onJsError_(std::move(onJsError)),
      animatedNodesManagerProvider_(std::move(animatedNodesManagerProvider)),
      devServerHelper_(std::move(devServerHelper)),
      devUIDelegate_(std::move(devUIDelegate)),
      logBoxSurfaceDelegate_(std::move(logBoxSurfaceDelegate)),
      httpClientFactory_(std::move(httpClientFactory)),
      webSocketClientFactory_(std::move(webSocketClientFactory)),
      liveReloadCallback_(std::move(liveReloadCallback)),
      sourceURL_(std::move(sourceURL)) {}

std::shared_ptr<TurboModule> ReactCxxTurboModuleProvider::operator()(
    const std::string& name) const {
  react_native_assert(!name.empty() && "TurboModule name must not be empty");

  for (const auto& turboModuleProvider : turboModuleProviders_) {
    if (turboModuleProvider) {
      if (auto turboModule = turboModuleProvider(name, jsInvoker_)) {
        return turboModule;
      }
    }
  }

  if (animatedNodesManagerProvider_ != nullptr &&
      name == AnimatedModule::kModuleName) {
    // when animatedNodesManagerProvider_ is null, defer to default
    return std::make_shared<AnimatedModule>(
        jsInvoker_, animatedNodesManagerProvider_);
  } else if (name == AppStateModule::kModuleName) {
    return std::make_shared<AppStateModule>(jsInvoker_);
  } else if (name == DeviceInfoModule::kModuleName) {
    return std::make_shared<DeviceInfoModule>(jsInvoker_);
  } else if (
      devUIDelegate_ != nullptr && name == DevLoadingViewModule::kModuleName) {
    return std::make_shared<DevLoadingViewModule>(jsInvoker_, devUIDelegate_);
  } else if (devServerHelper_ && name == DevSettingsModule::kModuleName) {
    return std::make_shared<DevSettingsModule>(
        jsInvoker_, devServerHelper_, liveReloadCallback_);
  } else if (name == PlatformConstantsModule::kModuleName) {
    return std::make_shared<PlatformConstantsModule>(jsInvoker_);
  } else if (name == ImageLoaderModule::kModuleName) {
    return std::make_shared<ImageLoaderModule>(jsInvoker_);
  } else if (name == SourceCodeModule::kModuleName) {
    return std::make_shared<SourceCodeModule>(
        jsInvoker_, sourceURL_ ? *sourceURL_ : "");
  } else if (name == WebSocketModule::kModuleName) {
    return std::make_shared<WebSocketModule>(
        jsInvoker_, webSocketClientFactory_);
  } else if (name == NativeExceptionsManager::kModuleName) {
    return std::make_shared<NativeExceptionsManager>(onJsError_, jsInvoker_);
  } else if (name == NativeIntersectionObserver::kModuleName) {
    return std::make_shared<NativeIntersectionObserver>(jsInvoker_);
  } else if (name == NativeMutationObserver::kModuleName) {
    return std::make_shared<NativeMutationObserver>(jsInvoker_);
  } else if (name == NetworkingModule::kModuleName) {
    return std::make_shared<NetworkingModule>(jsInvoker_, httpClientFactory_);
  } else if (name == LogBoxModule::kModuleName) {
    if (logBoxSurfaceDelegate_) {
      return std::make_shared<LogBoxModule>(jsInvoker_, logBoxSurfaceDelegate_);
    }
  }

  if (auto turboModule =
          DefaultTurboModules::getTurboModule(name, jsInvoker_)) {
    return turboModule;
  }

  LOG(WARNING) << "Failed to load TurboModule: " << name;
  return nullptr;
}
