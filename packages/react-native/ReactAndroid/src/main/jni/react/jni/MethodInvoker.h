/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <cxxreact/JSExecutor.h>
#include <fbjni/fbjni.h>
#include <folly/dynamic.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

namespace facebook::react {

class Instance;

struct [[deprecated(
    "This API will be removed along with the legacy architecture.")]] JReflectMethod
    : public jni::JavaClass<JReflectMethod> {
  static constexpr auto kJavaDescriptor = "Ljava/lang/reflect/Method;";

  jmethodID getMethodID() {
    auto id = jni::Environment::current()->FromReflectedMethod(self());
    jni::throwPendingJniExceptionAsCppException();
    return id;
  }
};

struct [[deprecated(
    "This API will be removed along with the legacy architecture.")]] JBaseJavaModule
    : public jni::JavaClass<JBaseJavaModule> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/BaseJavaModule;";
};

class [[deprecated(
    "This API will be removed along with the legacy architecture.")]] MethodInvoker {
 public:
  MethodInvoker(
      jni::alias_ref<JReflectMethod::javaobject> method,
      std::string methodName,
      std::string signature,
      std::string traceName,
      bool isSync);

  MethodCallResult invoke(
      std::weak_ptr<Instance> & instance,
      jni::alias_ref<JBaseJavaModule::javaobject> module,
      const folly::dynamic& params);

  std::string getMethodName() const;

  bool isSyncHook() const {
    return isSync_;
  }

 private:
  jmethodID method_;
  std::string methodName_;
  std::string signature_;
  std::size_t jsArgCount_;
  std::string traceName_;
  bool isSync_;
};

} // namespace facebook::react

#endif
