/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "NativeCommon.h"
#include "ReadableNativeArray.h"
#include "ReadableNativeMap.h"

#include <fbjni/fbjni.h>
#include <folly/dynamic.h>
#include <folly/json.h>

namespace facebook::react {

struct JDynamic : public jni::JavaClass<JDynamic> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/react/bridge/Dynamic;";
};

class JDynamicNative : public jni::HybridClass<JDynamicNative, JDynamic> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/DynamicNative;";

  JDynamicNative(folly::dynamic payload) : payload_(std::move(payload)) {}

  static void registerNatives() {
    javaClassStatic()->registerNatives(
        {makeNativeMethod("isNullNative", JDynamicNative::isNullNative),
         makeNativeMethod("getTypeNative", JDynamicNative::getTypeNative),
         makeNativeMethod("asDouble", JDynamicNative::asDouble),
         makeNativeMethod("asBoolean", JDynamicNative::asBoolean),
         makeNativeMethod("asString", JDynamicNative::asString),
         makeNativeMethod("asArray", JDynamicNative::asArray),
         makeNativeMethod("asMap", JDynamicNative::asMap)});
  }

 private:
  friend HybridBase;

  jni::local_ref<ReadableType> getTypeNative();
  jni::local_ref<jstring> asString();
  jboolean asBoolean();
  jdouble asDouble();
  jboolean isNullNative();
  jni::local_ref<ReadableArray> asArray();
  jni::local_ref<ReadableMap> asMap();

  folly::dynamic payload_;
};

} // namespace facebook::react
