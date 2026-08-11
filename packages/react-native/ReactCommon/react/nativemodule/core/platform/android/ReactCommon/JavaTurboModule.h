/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>
#include <react/bridging/CallbackWrapper.h>
#include <react/jni/JCallback.h>

namespace facebook::react {

struct JTurboModule : jni::JavaClass<JTurboModule> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/interfaces/TurboModule;";
};

struct JTurboModuleWithJSIBindings
    : jni::JavaClass<JTurboModuleWithJSIBindings> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/interfaces/TurboModuleWithJSIBindings;";
};

class JSI_EXPORT JavaTurboModule : public TurboModule {
 public:
  // TODO(T65603471): Should we unify this with a Fabric abstraction?
  struct InitParams {
    std::string moduleName;
    jni::alias_ref<jobject> instance;
    std::shared_ptr<CallInvoker> jsInvoker;
    std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker;
  };

  JavaTurboModule(const InitParams& params);
  virtual ~JavaTurboModule();

  jsi::Value invokeJavaMethod(
      jsi::Runtime& runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string& methodName,
      const std::string& methodSignature,
      const jsi::Value* args,
      size_t argCount,
      jmethodID& cachedMethodID);

 protected:
  void configureEventEmitterCallback();

  [[deprecated]] void setEventEmitterCallback(
      jni::alias_ref<jobject> /*unused*/) {
    configureEventEmitterCallback();
  }

 private:
  // instance_ can be of type JTurboModule, or JNativeModule
  jni::global_ref<jobject> instance_;
  std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker_;
};

} // namespace facebook::react
