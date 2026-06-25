/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactHost.h"

#include <ReactCommon/TurboModuleBinding.h>
#include <cxxreact/JSBigString.h>
#include <folly/system/ThreadName.h>
#include <glog/logging.h>
#include <jserrorhandler/JsErrorHandler.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/debug/react_native_assert.h>
#include <react/devsupport/DevServerHelper.h>
#include <react/devsupport/IDevUIDelegate.h>
#include <react/devsupport/PackagerConnection.h>
#include <react/devsupport/inspector/Inspector.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/http/IHttpClient.h>
#include <react/http/IWebSocketClient.h>
#include <react/io/ResourceLoader.h>
#include <react/logging/LogOnce.h>
#include <react/renderer/componentregistry/native/NativeComponentRegistryBinding.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerDelegateImpl.h>
#include <react/renderer/scheduler/SurfaceDelegate.h>
#include <react/renderer/scheduler/SurfaceManager.h>
#include <react/renderer/uimanager/IMountingManager.h>
#include <react/runtime/JSRuntimeBindings.h>
#include <react/runtime/PlatformTimerRegistryImpl.h>
#include <react/runtime/hermes/HermesInstance.h>
#include <react/threading/MessageQueueThreadImpl.h>

#include "ReactCxxTurboModuleProvider.h"

namespace facebook::react {

struct ReactInstanceData {
  std::shared_ptr<IMountingManager> mountingManager;
  std::shared_ptr<MessageQueueThread> messageQueueThread;
  std::shared_ptr<RunLoopObserverManager> runLoopObserverManager;
  std::shared_ptr<const ContextContainer> contextContainer;
  ComponentRegistryFactory componentRegistryFactory;
  JsErrorHandler::OnJsError onJsError;
  Logger logger;
  std::shared_ptr<IDevUIDelegate> devUIDelegate;
  TurboModuleProviders turboModuleProviders;
  std::shared_ptr<SurfaceDelegate> logBoxSurfaceDelegate;
  std::shared_ptr<NativeAnimatedNodesManagerProvider>
      animatedNodesManagerProvider;
  ReactInstance::BindingsInstallFunc bindingsInstallFunc;
  std::shared_ptr<AnimationChoreographer> animationChoreographer;
};

ReactHost::ReactHost(
    ReactInstanceConfig reactInstanceConfig,
    std::shared_ptr<IMountingManager> mountingManager,
    std::shared_ptr<RunLoopObserverManager> runLoopObserverManager,
    std::shared_ptr<const ContextContainer> contextContainer,
    JsErrorHandler::OnJsError onJsError,
    Logger logger,
    std::shared_ptr<IDevUIDelegate> devUIDelegate,
    TurboModuleProviders turboModuleProviders,
    std::shared_ptr<SurfaceDelegate> logBoxSurfaceDelegate,
    std::shared_ptr<NativeAnimatedNodesManagerProvider>
        animatedNodesManagerProvider,
    ReactInstance::BindingsInstallFunc bindingsInstallFunc,
    std::shared_ptr<AnimationChoreographer> animationChoreographer)
    : reactInstanceConfig_(std::move(reactInstanceConfig)) {
  auto componentRegistryFactory =
      mountingManager->getComponentRegistryFactory();
  reactInstanceData_ = std::make_unique<ReactInstanceData>(ReactInstanceData{
      .mountingManager = mountingManager,
      .messageQueueThread = nullptr,
      .runLoopObserverManager = runLoopObserverManager,
      .contextContainer = std::move(contextContainer),
      .componentRegistryFactory = std::move(componentRegistryFactory),
      .onJsError = std::move(onJsError),
      .logger = std::move(logger),
      .devUIDelegate = devUIDelegate,
      .turboModuleProviders = std::move(turboModuleProviders),
      .logBoxSurfaceDelegate = logBoxSurfaceDelegate,
      .animatedNodesManagerProvider = animatedNodesManagerProvider,
      .bindingsInstallFunc = std::move(bindingsInstallFunc),
      .animationChoreographer = std::move(animationChoreographer)});
  if (!reactInstanceData_->contextContainer
           ->find<MessageQueueThreadFactory>(MessageQueueThreadFactoryKey)
           .has_value()) {
    reactInstanceData_->contextContainer->insert(
        MessageQueueThreadFactoryKey, MessageQueueThreadFactory([]() {
          return std::make_shared<MessageQueueThreadImpl>();
        }));
  }
  if (!reactInstanceData_->contextContainer
           ->find<HttpClientFactory>(HttpClientFactoryKey)
           .has_value()) {
    throw std::runtime_error("No HttpClientFactory provided");
  }
  if (!reactInstanceData_->contextContainer
           ->find<WebSocketClientFactory>(WebSocketClientFactoryKey)
           .has_value()) {
    throw std::runtime_error("No WebSocketClientFactory provided");
  }
  createReactInstance();
}

ReactHost::~ReactHost() noexcept {
  destroyReactInstance();
}

void ReactHost::createReactInstance() {
  // Set up timers
  std::unique_ptr<PlatformTimerRegistry> platformTimers;
  if (reactInstanceConfig_.platformTimerRegistryFactory) {
    platformTimers = reactInstanceConfig_.platformTimerRegistryFactory();
  } else {
    platformTimers = std::make_unique<PlatformTimerRegistryImpl>();
  }
  auto* platformTimersPtr = platformTimers.get();
  auto timerManager = std::make_shared<TimerManager>(std::move(platformTimers));
  platformTimersPtr->setTimerManager(timerManager);

  auto httpClientFactory =
      reactInstanceData_->contextContainer->at<HttpClientFactory>(
          HttpClientFactoryKey);

  auto webSocketClientFactory =
      reactInstanceData_->contextContainer->at<WebSocketClientFactory>(
          WebSocketClientFactoryKey);

  auto devToolsHttpClientFactory =
      reactInstanceData_->contextContainer
          ->find<HttpClientFactory>(DevToolsHttpClientFactoryKey)
          .value_or(httpClientFactory);

  auto devToolsWebSocketClientFactory =
      reactInstanceData_->contextContainer
          ->find<WebSocketClientFactory>(DevToolsWebSocketClientFactoryKey)
          .value_or(webSocketClientFactory);

  // Create devServerHelper
  if (!devServerHelper_ &&
      (reactInstanceConfig_.enableInspector ||
       reactInstanceConfig_.enableDevMode)) {
    devServerHelper_ = std::make_shared<DevServerHelper>(
        reactInstanceConfig_.appId,
        reactInstanceConfig_.deviceName,
        reactInstanceConfig_.devServerHost,
        reactInstanceConfig_.devServerPort,
        devToolsHttpClientFactory,
        [this](
            const std::string& moduleName,
            const std::string& methodName,
            folly::dynamic&& args) {
          reactInstance_->callFunctionOnModule(
              moduleName, methodName, std::move(args));
        });
  }

  if (!inspector_ && reactInstanceConfig_.enableInspector) {
    inspector_ = std::make_shared<Inspector>(
        reactInstanceConfig_.appId,
        reactInstanceConfig_.deviceName,
        devToolsWebSocketClientFactory,
        devToolsHttpClientFactory);
    inspector_->ensureHostTarget(
        [this]() { reloadReactInstance(); },
        [weakDevUIDelegate =
             std::weak_ptr<IDevUIDelegate>(reactInstanceData_->devUIDelegate)](
            bool showDebuggerOverlay,
            std::function<void()>&& resumeDebuggerFn) {
          if (auto debugUIDelegate = weakDevUIDelegate.lock()) {
            if (showDebuggerOverlay) {
              debugUIDelegate->showDebuggerOverlay(std::move(resumeDebuggerFn));
            } else {
              debugUIDelegate->hideDebuggerOverlay();
            }
          }
        });
  }

  if (!packagerConnection_ && reactInstanceConfig_.enableDevMode) {
    packagerConnection_ = std::make_unique<PackagerConnection>(
        devToolsWebSocketClientFactory,
        devServerHelper_->getPackagerConnectionUrl(),
        [this]() { reloadReactInstance(); },
        []() {});
  }

  // Create the React Instance
  auto messageQueueThreadFactory =
      reactInstanceData_->contextContainer->at<MessageQueueThreadFactory>(
          MessageQueueThreadFactoryKey);
  reactInstanceData_->messageQueueThread = messageQueueThreadFactory();
  std::unique_ptr<JSRuntime> runtime = HermesInstance::createJSRuntime(
      nullptr,
      reactInstanceData_->messageQueueThread,
      /* allocInOldGenBeforeTTI */ false);

  if (reactInstanceConfig_.enableInspector) {
    react_native_assert(
        inspector_ != nullptr && "Inspector is not initialized");
  }
  reactInstance_ = std::make_unique<ReactInstance>(
      std::move(runtime),
      reactInstanceData_->messageQueueThread,
      timerManager,
      reactInstanceData_->onJsError,
      inspector_ != nullptr ? inspector_->inspectorTarget().get() : nullptr);
  timerManager->setRuntimeExecutor(
      reactInstance_->getBufferedRuntimeExecutor());
  reactInstanceData_->contextContainer->insert(
      RuntimeSchedulerKey,
      std::weak_ptr<RuntimeScheduler>(reactInstance_->getRuntimeScheduler()));

  // Create scheduler
  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = reactInstanceData_->contextContainer;
  toolbox.runtimeExecutor = reactInstance_->getBufferedRuntimeExecutor();
  toolbox.bridgelessBindingsExecutor =
      reactInstance_->getUnbufferedRuntimeExecutor();
  toolbox.componentRegistryFactory =
      reactInstanceData_->componentRegistryFactory;
  toolbox.eventBeatFactory =
      [runLoopObserverManager = reactInstanceData_->runLoopObserverManager,
       runtimeScheduler = reactInstance_->getRuntimeScheduler()](
          std::shared_ptr<EventBeat::OwnerBox> ownerBox) {
        return runLoopObserverManager->createEventBeat(
            ownerBox, *runtimeScheduler);
      };
  toolbox.animationChoreographer = reactInstanceData_->animationChoreographer;

  auto schedulerDelegate = std::make_unique<SchedulerDelegateImpl>(
      reactInstanceData_->mountingManager);
  scheduler_ =
      std::make_unique<Scheduler>(toolbox, nullptr, schedulerDelegate.get());

  surfaceManager_ = std::make_unique<SurfaceManager>(*scheduler_);
  schedulerDelegate->setUIManager(scheduler_->getUIManager());
  schedulerDelegate_ = std::move(schedulerDelegate);

  reactInstanceData_->mountingManager->setSchedulerTaskExecutor(
      [this](SchedulerTask&& task) { runOnScheduler(std::move(task)); });

  reactInstanceData_->mountingManager->setUIManager(scheduler_->getUIManager());

  auto jsInvoker = std::make_shared<RuntimeSchedulerCallInvoker>(
      reactInstance_->getRuntimeScheduler());

  if (inspector_ != nullptr) {
    inspector_->connectDebugger(devServerHelper_->getInspectorUrl());
  }

  auto liveReloadCallback = [this]() { reloadReactInstance(); };
  ReactCxxTurboModuleProvider turboModuleManager(
      reactInstanceData_->turboModuleProviders,
      jsInvoker,
      reactInstanceData_->onJsError,
      reactInstanceData_->animatedNodesManagerProvider,
      reactInstanceConfig_.enableDevMode ? devServerHelper_ : nullptr,
      reactInstanceData_->devUIDelegate,
      reactInstanceData_->logBoxSurfaceDelegate,
      httpClientFactory,
      webSocketClientFactory,
      std::move(liveReloadCallback),
      sourceURL_);

  reactInstance_->initializeRuntime(
      {
#if defined(WITH_PERFETTO) || defined(RNCXX_WITH_PROFILING_PROVIDER)
          .isProfiling = true,
#else
          .isProfiling = false,
#endif
          .runtimeDiagnosticFlags = ""},
      [weakMountingManager =
           std::weak_ptr<IMountingManager>(reactInstanceData_->mountingManager),
       logger = reactInstanceData_->logger,
       bindingsInstallFunc = reactInstanceData_->bindingsInstallFunc,
       turboModuleManager =
           std::move(turboModuleManager)](jsi::Runtime& runtime) mutable {
        if (logger) {
          bindNativeLogger(runtime, logger);
        }

        // Set up component provider
        bindHasComponentProvider(
            runtime, [weakMountingManager](const std::string& name) -> bool {
              if (auto strongMountingManager = weakMountingManager.lock()) {
                return strongMountingManager->hasComponent(name);
              }
              return false;
            });

        // Set up TurboModules
        TurboModuleBinding::install(runtime, std::move(turboModuleManager));

        if (bindingsInstallFunc) {
          bindingsInstallFunc(runtime);
        }
      });
}

void ReactHost::destroyReactInstance() {
  if (inspector_ != nullptr) {
    reactInstance_->unregisterFromInspector();
  }
  if (surfaceManager_) {
    surfaceManager_->stopAllSurfaces();
  }
  reactInstanceData_->messageQueueThread->quitSynchronous();
  surfaceManager_ = nullptr;
  scheduler_ = nullptr;
  schedulerDelegate_ = nullptr;

  reactInstanceData_->contextContainer->erase(RuntimeSchedulerKey);
  reactInstanceData_->mountingManager->setSchedulerTaskExecutor(nullptr);
  reactInstance_ = nullptr;
  reactInstanceData_->messageQueueThread = nullptr;
}

void ReactHost::reloadReactInstance() {
  if (isReloadingReactInstance_.exchange(true)) {
    return;
  }

  std::thread([this]() {
    folly::setThreadName("ReactReload");

    std::vector<SurfaceManager::SurfaceProps> surfaceProps;
    for (auto& surfaceId : surfaceManager_->getRunningSurfaces()) {
      if (auto surfaceProp = surfaceManager_->getSurfaceProps(surfaceId);
          surfaceProp.has_value()) {
        surfaceProps.emplace_back(*surfaceProp);
      }
    }
    destroyReactInstance();
    createReactInstance();
    loadScriptFromDevServer();
    for (auto& surfaceProp : surfaceProps) {
      startSurface(
          surfaceProp.surfaceId,
          surfaceProp.moduleName,
          surfaceProp.props,
          surfaceProp.layoutConstraints,
          surfaceProp.layoutContext);
    }
    isReloadingReactInstance_ = false;
  }).detach();
}

bool ReactHost::loadScript(
    const std::string& bundlePath,
    const std::string& sourcePath) noexcept {
  bool isLoaded = false;
  if (reactInstanceConfig_.enableDevMode && devServerHelper_) {
    devServerHelper_->setSourcePath(sourcePath);
    isLoaded = loadScriptFromDevServer();
  }
  if (!isLoaded) {
    LOG(INFO) << "Devserver is not provided.";
    isLoaded = loadScriptFromBundlePath(bundlePath);
  }
  return isLoaded;
}

void ReactHost::openDebugger() {
  if (inspector_ != nullptr && devServerHelper_ != nullptr) {
    devServerHelper_->openDebugger();
  }
}

bool ReactHost::loadScriptFromDevServer() {
  try {
    auto bundleUrl = devServerHelper_->getBundleUrl();
    auto response =
        devServerHelper_
            ->downloadBundleResourceSync(
                bundleUrl,
                [weakDevUIDelegate = std::weak_ptr<IDevUIDelegate>(
                     reactInstanceData_->devUIDelegate)](
                    DevServerHelper::DownloadProgressStatus status) {
                  if (auto devUIDelegate = weakDevUIDelegate.lock()) {
                    if (status ==
                        DevServerHelper::DownloadProgressStatus::STARTED) {
                      devUIDelegate->showDownloadBundleProgress();
                    } else {
                      devUIDelegate->hideDownloadBundleProgress();
                    }
                  }
                })
            .get();
    auto script = std::make_unique<JSBigStdString>(std::move(response));
    *sourceURL_ = bundleUrl;
    reactInstance_->loadScript(std::move(script), bundleUrl);
    devServerHelper_->setupHMRClient();
    return true;
  } catch (...) {
    LOG(WARNING)
        << "Unable to download JS bundle from Metro, falling back to prebuilt JS bundle. "
        << "To start Metro, run in command line: 'cd ~/fbsource/xplat/js && js1 run'";
    return false;
  }
}

bool ReactHost::loadScriptFromBundlePath(const std::string& bundlePath) {
  try {
    LOG(INFO) << "Loading JS bundle from bundle path: " << bundlePath;
    auto script = ResourceLoader::getFileContents(bundlePath);
    *sourceURL_ = "";
    reactInstance_->loadScript(std::move(script), bundlePath);
    LOG(INFO) << "Loaded JS bundle from bundle path: " << bundlePath;
    return true;
  } catch (...) {
    LOG(WARNING) << "Unable to read bundle from bundle path" << bundlePath;
    return false;
  }
}

void ReactHost::startSurface(
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& initialProps,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) noexcept {
  surfaceManager_->startSurface(
      surfaceId, moduleName, initialProps, layoutConstraints, layoutContext);
}

void ReactHost::setSurfaceConstraints(
    SurfaceId surfaceId,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) noexcept {
  surfaceManager_->constraintSurfaceLayout(
      surfaceId, layoutConstraints, layoutContext);
}

void ReactHost::stopSurface(SurfaceId surfaceId) noexcept {
  surfaceManager_->stopSurface(surfaceId);
}

void ReactHost::stopAllSurfaces() noexcept {
  surfaceManager_->stopAllSurfaces();
}

bool ReactHost::isSurfaceRunning(SurfaceId surfaceId) const noexcept {
  return surfaceManager_->isSurfaceRunning(surfaceId);
}

std::unordered_set<SurfaceId> ReactHost::getRunningSurfaces() const noexcept {
  return surfaceManager_->getRunningSurfaces();
}

void ReactHost::runOnScheduler(
    std::function<void(Scheduler& scheduler)>&& task) const {
  if (!isReloadingReactInstance_) {
    task(*scheduler_);
  }
}

void ReactHost::runOnRuntimeScheduler(
    std::function<void(jsi::Runtime& runtime)>&& task,
    SchedulerPriority priority) const noexcept {
  if (!isReloadingReactInstance_) {
    reactInstance_->getRuntimeScheduler()->scheduleTask(
        priority, std::move(task));
  }
}

void ReactHost::emitDeviceEvent(folly::dynamic&& args) {
  if (!isReloadingReactInstance_) {
    reactInstance_->callFunctionOnModule(
        "RCTDeviceEventEmitter", "emit", std::move(args));
  }
}

} // namespace facebook::react
