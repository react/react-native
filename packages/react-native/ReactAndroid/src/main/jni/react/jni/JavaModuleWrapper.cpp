/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JavaModuleWrapper.h"

#include <glog/logging.h>

#include <cxxreact/CxxNativeModule.h>
#include <cxxreact/Instance.h>
#include <cxxreact/JsArgumentHelpers.h>
#include <cxxreact/MessageQueueThread.h>
#include <cxxreact/NativeModule.h>
#include <fbjni/fbjni.h>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

#include "ReadableNativeArray.h"

#ifndef RCT_REMOVE_LEGACY_ARCH

namespace facebook::react {

std::string JMethodDescriptor::getSignature() const {
  static auto signature = javaClassStatic()->getField<jstring>("signature");
  return getFieldValue(signature)->toStdString();
}

std::string JMethodDescriptor::getName() const {
  static auto name = javaClassStatic()->getField<jstring>("name");
  return getFieldValue(name)->toStdString();
}

std::string JMethodDescriptor::getType() const {
  static auto type = javaClassStatic()->getField<jstring>("type");
  return getFieldValue(type)->toStdString();
}

std::string JavaNativeModule::getName() {
  static auto getNameMethod =
      wrapper_->getClass()->getMethod<jstring()>("getName");
  return getNameMethod(wrapper_)->toStdString();
}

std::string JavaNativeModule::getSyncMethodName(unsigned int reactMethodId) {
  if (reactMethodId >= syncMethods_.size()) {
    throw std::invalid_argument(
        "methodId " + std::to_string(reactMethodId) + " out of range [0.." +
        std::to_string(syncMethods_.size()) + "]");
  }

  auto& methodInvoker = syncMethods_[reactMethodId];
  if (!methodInvoker.has_value()) {
    throw std::invalid_argument(
        "methodId " + std::to_string(reactMethodId) +
        " is not a recognized sync method");
  }

  return methodInvoker->getMethodName();
}

std::vector<MethodDescriptor> JavaNativeModule::getMethods() {
  std::vector<MethodDescriptor> ret;
  syncMethods_.clear();
  auto descs = wrapper_->getMethodDescriptors();
  for (const auto& desc : *descs) {
    auto methodName = desc->getName();
    auto methodType = desc->getType();

    if (methodType == "sync") {
      // allow for the sync methods vector to have empty values, resize on
      // demand
      size_t methodIndex = ret.size();
      if (methodIndex >= syncMethods_.size()) {
        syncMethods_.resize(methodIndex + 1);
      }
      syncMethods_.insert(
          syncMethods_.begin() + methodIndex,
          MethodInvoker(
              desc->getMethod(),
              methodName,
              desc->getSignature(),
              getName() + "." + methodName,
              true));
    }

    ret.emplace_back(std::move(methodName), std::move(methodType));
  }
  return ret;
}

folly::dynamic JavaNativeModule::getConstants() {
  static auto constantsMethod =
      wrapper_->getClass()->getMethod<NativeMap::javaobject()>("getConstants");
  auto constants = constantsMethod(wrapper_);
  if (!constants) {
    return nullptr;
  } else {
    return cthis(constants)->consume();
  }
}

void JavaNativeModule::invoke(
    unsigned int reactMethodId,
    folly::dynamic&& params,
    int callId) {
  messageQueueThread_->runOnQueue(
      [this, reactMethodId, params = std::move(params), callId] {
        static auto invokeMethod =
            wrapper_->getClass()
                ->getMethod<void(jint, ReadableNativeArray::javaobject)>(
                    "invoke");
#ifdef WITH_FBSYSTRACE
        if (callId != -1) {
          fbsystrace_end_async_flow(TRACE_TAG_REACT, "native", callId);
        }
#endif
        invokeMethod(
            wrapper_,
            static_cast<jint>(reactMethodId),
            ReadableNativeArray::newObjectCxxArgs(params).get());
      });
}

MethodCallResult JavaNativeModule::callSerializableNativeHook(
    unsigned int reactMethodId,
    folly::dynamic&& params) {
  // TODO: evaluate whether calling through invoke is potentially faster
  if (reactMethodId >= syncMethods_.size()) {
    throw std::invalid_argument(
        "methodId " + std::to_string(reactMethodId) + " out of range [0.." +
        std::to_string(syncMethods_.size()) + "]");
  }

  auto& method = syncMethods_[reactMethodId];
  CHECK(method.has_value() && method->isSyncHook())
      << "Trying to invoke a asynchronous method as synchronous hook";
  return method->invoke(instance_, wrapper_->getModule(), params);
}

jni::local_ref<JReflectMethod::javaobject> JMethodDescriptor::getMethod()
    const {
  static auto method =
      javaClassStatic()->getField<JReflectMethod::javaobject>("method");
  return getFieldValue(method);
}

} // namespace facebook::react

#endif
