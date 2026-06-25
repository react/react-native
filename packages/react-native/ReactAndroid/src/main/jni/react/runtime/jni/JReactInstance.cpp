/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactInstance.h"

#include <cxxreact/JSBigString.h>
#include <cxxreact/RecoverableError.h>
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/JSLogging.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#include <react/runtime/BridgelessNativeMethodCallInvoker.h>
#include <react/runtime/JSRuntimeBindings.h>

#include "JavaTimerRegistry.h"

namespace facebook::react {

JReactInstance::JReactInstance(
    jni::alias_ref<JJSRuntimeFactory::javaobject> jsRuntimeFactory,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeMessageQueueThread,
    jni::alias_ref<JJavaTimerManager::javaobject> javaTimerManager,
    jni::alias_ref<JJSTimerExecutor::javaobject> jsTimerExecutor,
    jni::alias_ref<JReactExceptionManager::javaobject> jReactExceptionManager,
    jni::alias_ref<JBindingsInstaller::javaobject> jBindingsInstaller,
    bool isProfiling,
    jni::alias_ref<JReactHostInspectorTarget::javaobject>
        jReactHostInspectorTarget) noexcept {
  // TODO(janzer): Lazily create runtime
  auto sharedJSMessageQueueThread =
      std::make_shared<JMessageQueueThread>(jsMessageQueueThread);
  auto sharedNativeMessageQueueThread =
      std::make_shared<JMessageQueueThread>(nativeMessageQueueThread);

  // Create the timer manager (for JS timers)
  auto timerRegistry =
      std::make_unique<JavaTimerRegistry>(jni::make_global(javaTimerManager));
  auto timerManager = std::make_shared<TimerManager>(std::move(timerRegistry));
  jsTimerExecutor->cthis()->setTimerManager(timerManager);

  jReactExceptionManager_ = jni::make_global(jReactExceptionManager);
  auto onJsError =
      [weakJReactExceptionManager = jni::make_weak(jReactExceptionManager)](
          jsi::Runtime& runtime,
          const JsErrorHandler::ProcessedError& error) mutable noexcept {
        if (auto jReactExceptionManager =
                weakJReactExceptionManager.lockLocal()) {
          jReactExceptionManager->reportJsException(runtime, error);
        }
      };

  jBindingsInstaller_ = jni::make_global(jBindingsInstaller);

  instance_ = std::make_unique<ReactInstance>(
      jsRuntimeFactory->cthis()->createJSRuntime(sharedJSMessageQueueThread),
      sharedJSMessageQueueThread,
      timerManager,
      std::move(onJsError),
      jReactHostInspectorTarget
          ? jReactHostInspectorTarget->cthis()->getInspectorTarget()
          : nullptr);

  auto bufferedRuntimeExecutor = instance_->getBufferedRuntimeExecutor();
  timerManager->setRuntimeExecutor(bufferedRuntimeExecutor);

  ReactInstance::JSRuntimeFlags options = {.isProfiling = isProfiling};
  // TODO T194671568 Consider moving runtime init to the JS thread.
  instance_->initializeRuntime(options, [this](jsi::Runtime& runtime) {
    react::Logger androidLogger =
        static_cast<void (*)(const std::string&, unsigned int)>(
            &reactAndroidLoggingHook);
    react::bindNativeLogger(runtime, androidLogger);
    if (jBindingsInstaller_ != nullptr) {
      auto appBindingInstaller =
          jBindingsInstaller_->cthis()->getBindingsInstallFunc();
      if (appBindingInstaller != nullptr) {
        appBindingInstaller(runtime);
      }
    }
  });

  auto unbufferedRuntimeExecutor = instance_->getUnbufferedRuntimeExecutor();
  // Set up the JS and native modules call invokers (for TurboModules)
  auto jsInvoker = std::make_unique<RuntimeSchedulerCallInvoker>(
      instance_->getRuntimeScheduler());
  jsCallInvokerHolder_ = jni::make_global(
      CallInvokerHolder::newObjectCxxArgs(std::move(jsInvoker)));
  auto nativeMethodCallInvoker =
      std::make_unique<BridgelessNativeMethodCallInvoker>(
          sharedNativeMessageQueueThread);
  nativeMethodCallInvokerHolder_ = jni::make_global(
      NativeMethodCallInvokerHolder::newObjectCxxArgs(
          std::move(nativeMethodCallInvoker)));

  // Storing this here to make sure the Java reference doesn't get destroyed
  unbufferedRuntimeExecutor_ = jni::make_global(
      JRuntimeExecutor::newObjectCxxArgs(unbufferedRuntimeExecutor));
  bufferedRuntimeExecutor_ = jni::make_global(
      JRuntimeExecutor::newObjectCxxArgs(bufferedRuntimeExecutor));
  runtimeScheduler_ = jni::make_global(
      JRuntimeScheduler::newObjectCxxArgs(instance_->getRuntimeScheduler()));
}

jni::local_ref<JReactInstance::jhybriddata> JReactInstance::initHybrid(
    jni::alias_ref<jhybridobject> /* unused */,
    jni::alias_ref<JJSRuntimeFactory::javaobject> jsRuntimeFactory,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
    jni::alias_ref<JavaMessageQueueThread::javaobject> nativeMessageQueueThread,
    jni::alias_ref<JJavaTimerManager::javaobject> javaTimerManager,
    jni::alias_ref<JJSTimerExecutor::javaobject> jsTimerExecutor,
    jni::alias_ref<JReactExceptionManager::javaobject> jReactExceptionManager,
    jni::alias_ref<JBindingsInstaller::javaobject> jBindingsInstaller,
    bool isProfiling,
    jni::alias_ref<JReactHostInspectorTarget::javaobject>
        jReactHostInspectorTarget) {
  return makeCxxInstance(
      jsRuntimeFactory,
      jsMessageQueueThread,
      nativeMessageQueueThread,
      javaTimerManager,
      jsTimerExecutor,
      jReactExceptionManager,
      jBindingsInstaller,
      isProfiling,
      jReactHostInspectorTarget);
}

void JReactInstance::loadJSBundleFromAssets(
    jni::alias_ref<JAssetManager::javaobject> assetManager,
    const std::string& assetURL) {
  const int kAssetsLength = 9; // strlen("assets://");
  auto sourceURL = assetURL.substr(kAssetsLength);

  auto manager = extractAssetManager(assetManager);
  auto script = loadScriptFromAssets(manager, sourceURL);
  instance_->loadScript(std::move(script), sourceURL);
}

void JReactInstance::loadJSBundleFromFile(
    const std::string& fileName,
    const std::string& sourceURL) {
  std::unique_ptr<const JSBigFileString> script;
  RecoverableError::runRethrowingAsRecoverable<std::system_error>(
      [&fileName, &script]() { script = JSBigFileString::fromPath(fileName); });
  instance_->loadScript(std::move(script), sourceURL);
}

/**
 * This is needed to initialize TurboModules; in the future this will be
 * replaced with something similar to runtimeExecutor, which we'll use for
 * Fabric as well.
 * TODO T44251068 Replace with runtimeExecutor
 */
jni::alias_ref<CallInvokerHolder::javaobject>
JReactInstance::getJSCallInvokerHolder() {
  return jsCallInvokerHolder_;
}

jni::alias_ref<NativeMethodCallInvokerHolder::javaobject>
JReactInstance::getNativeMethodCallInvokerHolder() {
  return nativeMethodCallInvokerHolder_;
}

void JReactInstance::callFunctionOnModule(
    const std::string& moduleName,
    const std::string& methodName,
    NativeArray* args) {
  instance_->callFunctionOnModule(
      moduleName,
      methodName,
      args != nullptr ? args->consume() : folly::dynamic::array());
}

jni::alias_ref<JRuntimeExecutor::javaobject>
JReactInstance::getUnbufferedRuntimeExecutor() noexcept {
  return unbufferedRuntimeExecutor_;
}

jni::alias_ref<JRuntimeExecutor::javaobject>
JReactInstance::getBufferedRuntimeExecutor() noexcept {
  return bufferedRuntimeExecutor_;
}

jni::alias_ref<JRuntimeScheduler::javaobject>
JReactInstance::getRuntimeScheduler() noexcept {
  return runtimeScheduler_;
}

void JReactInstance::registerSegment(
    int segmentId,
    const std::string& segmentPath) noexcept {
  instance_->registerSegment((uint32_t)segmentId, segmentPath);
}

void JReactInstance::handleMemoryPressureJs(jint level) {
  instance_->handleMemoryPressureJs(level);
}

jlong JReactInstance::getJavaScriptContext() {
  return (jlong)(intptr_t)instance_->getJavaScriptContext();
}

void JReactInstance::unregisterFromInspector() {
  instance_->unregisterFromInspector();
}

void JReactInstance::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JReactInstance::initHybrid),
      makeNativeMethod(
          "loadJSBundleFromAssets", JReactInstance::loadJSBundleFromAssets),
      makeNativeMethod(
          "loadJSBundleFromFile", JReactInstance::loadJSBundleFromFile),
      makeNativeMethod(
          "getJSCallInvokerHolder", JReactInstance::getJSCallInvokerHolder),
      makeNativeMethod(
          "getNativeMethodCallInvokerHolder",
          JReactInstance::getNativeMethodCallInvokerHolder),
      makeNativeMethod(
          "callFunctionOnModule", JReactInstance::callFunctionOnModule),
      makeNativeMethod(
          "getUnbufferedRuntimeExecutor",
          JReactInstance::getUnbufferedRuntimeExecutor),
      makeNativeMethod(
          "getBufferedRuntimeExecutor",
          JReactInstance::getBufferedRuntimeExecutor),
      makeNativeMethod(
          "getRuntimeScheduler", JReactInstance::getRuntimeScheduler),
      makeNativeMethod(
          "registerSegmentNative", JReactInstance::registerSegment),
      makeNativeMethod(
          "handleMemoryPressureJs", JReactInstance::handleMemoryPressureJs),
      makeNativeMethod(
          "getJavaScriptContext", JReactInstance::getJavaScriptContext),
      makeNativeMethod(
          "unregisterFromInspector", JReactInstance::unregisterFromInspector),
  });
}
} // namespace facebook::react
