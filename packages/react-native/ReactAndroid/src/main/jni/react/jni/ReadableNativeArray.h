/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "NativeArray.h"

#include "NativeCommon.h"
#include "NativeMap.h"

namespace facebook::react {

struct ReadableArray : jni::JavaClass<ReadableArray> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/ReadableArray;";
};

class ReadableNativeArray
    : public jni::HybridClass<ReadableNativeArray, NativeArray> {
 protected:
  friend HybridBase;

  template <class Dyn>
  explicit ReadableNativeArray(Dyn&& array)
      : HybridBase(std::forward<Dyn>(array)) {}

 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/react/bridge/ReadableNativeArray;";

  static void mapException(std::exception_ptr ex);
  static void registerNatives();

  bool equals(jni::alias_ref<ReadableNativeArray::javaobject> other);
  jni::local_ref<jni::JArrayClass<jobject>> importArray();
  jni::local_ref<jni::JArrayClass<jobject>> importTypeArray();
};

} // namespace facebook::react
