/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TesterAppDelegate.h"

#include "NativeFantom.h"
#include "platform/TesterTurboModuleProvider.h"
#include "stubs/StubClock.h"
#include "stubs/StubHttpClient.h"
#include "stubs/StubQueue.h"
#include "stubs/StubWebSocketClient.h"

#include <folly/dynamic.h>
#include <folly/json.h>
#include <glog/logging.h>
#include <logger/react_native_log.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/io/ImageLoaderModule.h>
#include <react/logging/DefaultOnJsErrorHandler.h>
#include <react/nativemodule/cputime/NativeCPUTime.h>
#include <react/nativemodule/fantomtestspecificmethods/NativeFantomTestSpecificMethods.h>
#include <react/renderer/animated/NativeAnimatedNodesManagerProvider.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/mounting/stubs/stubs.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/runtime/ReactHost.h>
#include <react/threading/MessageQueueThreadImpl.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/RunLoopObserverManager.h>
#include <iostream>
#include <vector>

namespace facebook::react {

namespace {
const char* logLevelToString(unsigned int logLevel) {
  switch (logLevel) {
    case ReactNativeLogLevelFatal:
      return "error";
    case ReactNativeLogLevelError:
      return "error";
    case ReactNativeLogLevelWarning:
      return "warn";
    case ReactNativeLogLevelInfo:
      return "info";
    default:
      return "info";
  }
}

void reportConsoleLog(const std::string& message, unsigned int logLevel) {
  folly::dynamic log = folly::dynamic::object();
  log["type"] = "console-log";
  log["level"] = logLevelToString(logLevel);
  log["message"] = message;
  std::cout << folly::toJson(log) << std::endl;
}
} // namespace

TesterAppDelegate::TesterAppDelegate(
    const ReactInstanceConfig& reactInstanceConfig) {
  LOG(INFO) << "Creating AppDelegate and Reacthost instances";

  mountingManager_ =
      std::make_shared<TesterMountingManager>([this](SurfaceId surfaceId) {
        reactHost_->runOnScheduler([&surfaceId](Scheduler& scheduler) {
          scheduler.reportMount(surfaceId);
        });
      });

  auto contextContainer = std::make_shared<const ContextContainer>();
  contextContainer->insert(
      MessageQueueThreadFactoryKey, MessageQueueThreadFactory([&]() {
        auto queue = std::make_shared<StubQueue>();
        queue_ = queue;
        return queue;
      }));
  contextContainer->insert(HttpClientFactoryKey, getStubHttpClientFactory());
  contextContainer->insert(
      WebSocketClientFactoryKey, getStubWebSocketClientFactory());
  contextContainer->insert(
      DevToolsHttpClientFactoryKey, getHttpClientFactory());
  contextContainer->insert(
      DevToolsWebSocketClientFactoryKey, getWebSocketClientFactory());

  runLoopObserverManager_ = std::make_shared<RunLoopObserverManager>();

  TurboModuleProviders turboModuleProviders{
      [&](const std::string& name,
          const std::shared_ptr<CallInvoker>& jsInvoker)
          -> std::shared_ptr<TurboModule> {
        if (name == NativeFantom::kModuleName) {
          return std::make_shared<NativeFantom>(*this, jsInvoker);
        } else if (name == NativeCPUTime::kModuleName) {
          return std::make_shared<NativeCPUTime>(jsInvoker);
        } else if (name == NativeFantomTestSpecificMethods::kModuleName) {
          return std::make_shared<NativeFantomTestSpecificMethods>(jsInvoker);
        } else if (name == ImageLoaderModule::kModuleName) {
          return std::make_shared<ImageLoaderModule>(
              jsInvoker, mountingManager_->getImageLoader());
        } else {
          return nullptr;
        }
      },
      TesterTurboModuleProvider::getTurboModuleProvider()};

  g_setNativeAnimatedNowTimestampFunction(StubClock::now);

  std::shared_ptr<NativeAnimatedNodesManagerProvider> provider;

  if (!ReactNativeFeatureFlags::useSharedAnimatedBackend()) {
    provider = std::make_shared<NativeAnimatedNodesManagerProvider>(
        [this](std::function<void()>&& onRender, bool /*isAsync*/) {
          onAnimationRender_ = std::move(onRender);
        },
        [this](bool /*isAsync*/) { onAnimationRender_ = nullptr; });
  }

  animationChoreographer_ = std::make_shared<TesterAnimationChoreographer>();

  reactHost_ = std::make_unique<ReactHost>(
      reactInstanceConfig,
      mountingManager_,
      runLoopObserverManager_,
      std::move(contextContainer),
      getDefaultOnJsErrorFunc(),
      reportConsoleLog,
      nullptr,
      turboModuleProviders,
      nullptr,
      std::move(provider),
      nullptr,
      animationChoreographer_);

  // Ensure that the ReactHost initialisation is completed.
  // This will call `setupJSNativeFantom`.
  flushMessageQueue();
}

TesterAppDelegate::~TesterAppDelegate() {
  // Stop all surfaces before destroying the ReactHost to prevent asserts from
  // crashing the app.
  reactHost_->stopAllSurfaces();
}

void TesterAppDelegate::loadScript(
    const std::string& bundlePath,
    const std::string& sourcePath) {
  LOG(INFO) << "Loading script: " << bundlePath << " source " << sourcePath;
  reactHost_->loadScript(bundlePath, sourcePath);

  jsi::Runtime* runtimePtr = nullptr;
  reactHost_->runOnRuntimeScheduler(
      [&runtimePtr](jsi::Runtime& runtime) { runtimePtr = &runtime; });

  // Run JS code to copy out pointer to the runtime to `runtimePtr`.
  flushMessageQueue();

  // Invoke the test function directly, so it happens outside of the runloop
  auto func = runtimePtr->global()
                  .getProperty(*runtimePtr, "$$RunTests$$")
                  .asObject(*runtimePtr)
                  .asFunction(*runtimePtr);

  func.call(*runtimePtr);
}

void TesterAppDelegate::openDebugger() const {
  reactHost_->openDebugger();
}

void TesterAppDelegate::startSurface(
    jsi::Runtime& runtime,
    float widthDp,
    float heightDp,
    SurfaceId surfaceId,
    float pointScaleFactor,
    float offsetX,
    float offsetY) {
  Size extentsDp{static_cast<Float>(widthDp), static_cast<Float>(heightDp)};
  LayoutConstraints layoutConstraints{
      .minimumSize = extentsDp,
      .maximumSize = extentsDp,
      .layoutDirection = LayoutDirection::LeftToRight,
  };

  LayoutContext layoutContext{
      .pointScaleFactor = pointScaleFactor,
      .viewportOffset = {.x = offsetX, .y = offsetY},
  };

  reactHost_->startSurface(
      surfaceId, "" /* emptySurface */, {}, layoutConstraints, layoutContext);
  LOG(INFO) << "started surface: " << surfaceId;

  auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
  if (uiManagerBinding == nullptr) {
    LOG(ERROR) << "UIManagerBinding is not available";
    return;
  }

  uiManagerBinding->getUIManager().getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree& shadowTree) {
        auto viewTree = StubViewTree(
            ShadowView(*shadowTree.getCurrentRevision().rootShadowNode));
        static_cast<std::shared_ptr<TesterMountingManager>>(mountingManager_)
            ->initViewTree(surfaceId, viewTree);
      });
}

void TesterAppDelegate::updateSurfaceConstraints(
    SurfaceId surfaceId,
    float widthDp,
    float heightDp,
    float pointScaleFactor) {
  Size extentsDp{static_cast<Float>(widthDp), static_cast<Float>(heightDp)};
  LayoutConstraints layoutConstraints{
      .minimumSize = extentsDp,
      .maximumSize = extentsDp,
      .layoutDirection = LayoutDirection::LeftToRight,
  };

  LayoutContext layoutContext{
      .pointScaleFactor = pointScaleFactor,
  };

  reactHost_->setSurfaceConstraints(
      surfaceId, layoutConstraints, layoutContext);
}

void TesterAppDelegate::stopSurface(SurfaceId surfaceId) {
  LOG(INFO) << "stopSurface: " << surfaceId;
  reactHost_->stopSurface(surfaceId);
}

void TesterAppDelegate::onRender() {
  runLoopObserverManager_->onRender();
}

void TesterAppDelegate::produceFramesForDuration(double milliseconds) {
  // Fixed time step of 16.333ms (approximately 60fps)
  // TODO: Make frame rate configurable from JavaScript.
  const double timeStep = 16333;
  double remainingTimeMicrosecs = milliseconds * 1000;

  while (remainingTimeMicrosecs > 0) {
    double stepMs = std::min(remainingTimeMicrosecs, timeStep);
    std::chrono::microseconds duration =
        std::chrono::microseconds(static_cast<long>(stepMs));

    StubClock::advanceTimeBy(duration);

    // Call UI tick for each time step
    runUITick();

    remainingTimeMicrosecs -= timeStep;
  }
}

void TesterAppDelegate::runUITick() {
  if (ReactNativeFeatureFlags::useSharedAnimatedBackend()) {
    auto milliseconds = std::chrono::duration_cast<AnimationTimestamp>(
        StubClock::now().time_since_epoch());
    animationChoreographer_->runUITick(milliseconds);
  } else if (onAnimationRender_) {
    onAnimationRender_();
  }
}

void TesterAppDelegate::flushMessageQueue() {
  if (auto queue = queue_.lock()) {
    queue->flush();
  }
  runUITick();
}

bool TesterAppDelegate::hasPendingTasksInMessageQueue() {
  if (auto queue = queue_.lock()) {
    return queue->hasPendingCallbacks();
  } else {
    return false;
  }
}

std::vector<std::string> TesterAppDelegate::getConsoleLogs() {
  return consoleLogs_;
}

} // namespace facebook::react
