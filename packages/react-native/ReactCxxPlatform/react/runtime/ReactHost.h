/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ReactInstanceConfig.h"

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include <cxxreact/MessageQueueThread.h>
#include <react/logging/DefaultLogger.h>
#include <react/nativemodule/JavaScriptModule.h>
#include <react/nativemodule/TurboModuleProvider.h>
#include <react/renderer/animationbackend/AnimationChoreographer.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/runtime/ReactInstance.h>
#include <react/utils/RunLoopObserverManager.h>
#include <atomic>
#include <functional>
#include <memory>
#include <string>
#include <unordered_set>

namespace facebook::react {

class AnimatedMountingOverrideDelegate;
class DevServerHelper;
class IMountingManager;
class Inspector;
class NativeAnimatedNodesManagerProvider;
class PackagerConnection;
class SchedulerDelegate;
class SurfaceDelegate;
class SurfaceManager;
struct IDevUIDelegate;
struct ReactInstanceData;

class ReactHost {
 public:
  ReactHost(
      ReactInstanceConfig reactInstanceConfig,
      std::shared_ptr<IMountingManager> mountingManager,
      std::shared_ptr<RunLoopObserverManager> runLoopObserverManager,
      std::shared_ptr<const ContextContainer> contextContainer,
      JsErrorHandler::OnJsError onJsError,
      Logger logger,
      std::shared_ptr<IDevUIDelegate> devUIDelegate = nullptr,
      TurboModuleProviders turboModuleProviders = {},
      std::shared_ptr<SurfaceDelegate> logBoxSurfaceDelegate = nullptr,
      std::shared_ptr<NativeAnimatedNodesManagerProvider> animatedNodesManagerProvider = nullptr,
      ReactInstance::BindingsInstallFunc bindingsInstallFunc = nullptr,
      std::shared_ptr<AnimationChoreographer> animationChoreographer = nullptr);
  ReactHost(const ReactHost &) = delete;
  ReactHost &operator=(const ReactHost &) = delete;
  ReactHost(ReactHost &&) noexcept = delete;
  ReactHost &operator=(ReactHost &&) noexcept = delete;
  ~ReactHost() noexcept;

  bool loadScript(const std::string &bundlePath, const std::string &sourcePath) noexcept;

  void openDebugger();

  void startSurface(
      SurfaceId surfaceId,
      const std::string &moduleName /* can be empty */,
      const folly::dynamic &initialProps,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext = {}) noexcept;

  void setSurfaceConstraints(
      SurfaceId surfaceId,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext) noexcept;

  void stopSurface(SurfaceId surfaceId) noexcept;

  void stopAllSurfaces() noexcept;

  bool isSurfaceRunning(SurfaceId surfaceId) const noexcept;

  std::unordered_set<SurfaceId> getRunningSurfaces() const noexcept;

  void runOnScheduler(std::function<void(Scheduler &scheduler)> &&task) const;

  void runOnRuntimeScheduler(
      std::function<void(jsi::Runtime &runtime)> &&task,
      SchedulerPriority priority = SchedulerPriority::NormalPriority) const noexcept;

  void emitDeviceEvent(folly::dynamic &&args);

 private:
  void createReactInstance();
  void destroyReactInstance();
  void reloadReactInstance();

  bool loadScriptFromDevServer();
  bool loadScriptFromBundlePath(const std::string &bundlePath);

  const ReactInstanceConfig reactInstanceConfig_;
  std::unique_ptr<ReactInstanceData> reactInstanceData_;
  std::unique_ptr<ReactInstance> reactInstance_;
  std::atomic<bool> isReloadingReactInstance_{false};

  std::unique_ptr<SchedulerDelegate> schedulerDelegate_;
  std::unique_ptr<Scheduler> scheduler_;
  std::unique_ptr<SurfaceManager> surfaceManager_;

  std::shared_ptr<DevServerHelper> devServerHelper_;
  std::shared_ptr<std::string> sourceURL_ = std::make_shared<std::string>();
  std::shared_ptr<Inspector> inspector_;
  std::unique_ptr<PackagerConnection> packagerConnection_;

  std::shared_ptr<AnimatedMountingOverrideDelegate> animatedMountingOverrideDelegate_;
};

} // namespace facebook::react
