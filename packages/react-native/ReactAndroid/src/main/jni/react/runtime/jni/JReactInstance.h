/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/NativeMethodCallInvokerHolder.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/JRuntimeScheduler.h>
#include <react/jni/JSLoader.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/runtime/JSRuntimeFactory.h>
#include <react/runtime/PlatformTimerRegistry.h>
#include <react/runtime/ReactInstance.h>

#include "JBindingsInstaller.h"
#include "JJSRuntimeFactory.h"
#include "JJSTimerExecutor.h"
#include "JJavaTimerManager.h"
#include "JReactExceptionManager.h"
#include "JReactHostInspectorTarget.h"

namespace facebook::react {

class JReactInstance : public jni::HybridClass<JReactInstance> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/runtime/ReactInstance;";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> /*unused*/,
      jni::alias_ref<JJSRuntimeFactory::javaobject> jsRuntimeFactory,
      jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
      jni::alias_ref<JavaMessageQueueThread::javaobject>
          nativeMessageQueueThread,
      jni::alias_ref<JJavaTimerManager::javaobject> javaTimerManager,
      jni::alias_ref<JJSTimerExecutor::javaobject> jsTimerExecutor,
      jni::alias_ref<JReactExceptionManager::javaobject> jReactExceptionManager,
      jni::alias_ref<JBindingsInstaller::javaobject> jBindingsInstaller,
      bool isProfiling,
      jni::alias_ref<JReactHostInspectorTarget::javaobject>
          jReactHostInspectorTarget);

  static void registerNatives();

  void loadJSBundleFromAssets(
      jni::alias_ref<JAssetManager::javaobject> assetManager,
      const std::string& assetURL);

  void loadJSBundleFromFile(
      const std::string& fileName,
      const std::string& sourceURL);

  void callFunctionOnModule(
      const std::string& moduleName,
      const std::string& methodName,
      NativeArray* args);

  jni::alias_ref<JRuntimeExecutor::javaobject>
  getUnbufferedRuntimeExecutor() noexcept;
  jni::alias_ref<JRuntimeExecutor::javaobject>
  getBufferedRuntimeExecutor() noexcept;
  jni::alias_ref<JRuntimeScheduler::javaobject> getRuntimeScheduler() noexcept;

  void registerSegment(int segmentId, const std::string& segmentPath) noexcept;

  void handleMemoryPressureJs(jint level);

  void unregisterFromInspector();

 private:
  friend HybridBase;

  explicit JReactInstance(
      jni::alias_ref<JJSRuntimeFactory::javaobject> jsRuntimeFactory,
      jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread,
      jni::alias_ref<JavaMessageQueueThread::javaobject>
          nativeMessageQueueThread,
      jni::alias_ref<JJavaTimerManager::javaobject> javaTimerManager,
      jni::alias_ref<JJSTimerExecutor::javaobject> jsTimerExecutor,
      jni::alias_ref<JReactExceptionManager::javaobject> jReactExceptionManager,
      jni::alias_ref<JBindingsInstaller::javaobject> jBindingsInstaller,
      bool isProfiling,
      jni::alias_ref<JReactHostInspectorTarget::javaobject>
          jReactHostInspectorTarget) noexcept;

  jni::alias_ref<CallInvokerHolder::javaobject> getJSCallInvokerHolder();
  jni::alias_ref<NativeMethodCallInvokerHolder::javaobject>
  getNativeMethodCallInvokerHolder();

  std::unique_ptr<ReactInstance> instance_;
  jni::global_ref<JRuntimeExecutor::javaobject> unbufferedRuntimeExecutor_;
  jni::global_ref<JRuntimeExecutor::javaobject> bufferedRuntimeExecutor_;
  jni::global_ref<JRuntimeScheduler::javaobject> runtimeScheduler_;
  jni::global_ref<CallInvokerHolder::javaobject> jsCallInvokerHolder_;
  jni::global_ref<NativeMethodCallInvokerHolder::javaobject>
      nativeMethodCallInvokerHolder_;
  jni::global_ref<JReactExceptionManager::javaobject> jReactExceptionManager_;
  jni::global_ref<JBindingsInstaller::javaobject> jBindingsInstaller_;

  jlong getJavaScriptContext();
};

} // namespace facebook::react
