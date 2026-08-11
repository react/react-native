/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <folly/dynamic.h>
#include <folly/json.h>

#include "ReadableNativeArray.h"

namespace facebook::react {

struct ReadableNativeMap;

struct WritableArray : jni::JavaClass<WritableArray> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/WritableArray;";
};

struct WritableNativeArray
    : public jni::HybridClass<WritableNativeArray, ReadableNativeArray> {
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/react/bridge/WritableNativeArray;";

  WritableNativeArray();
  WritableNativeArray(folly::dynamic&& val);

  static void initHybrid(jni::alias_ref<jhybridobject> jobj);

  void pushNull();
  void pushBoolean(jboolean value);
  void pushDouble(jdouble value);
  void pushInt(jint value);
  void pushLong(jlong value);
  void pushString(jstring value);
  void pushNativeArray(ReadableNativeArray* otherArray);
  void pushNativeMap(ReadableNativeMap* map);

  static void registerNatives();
};

} // namespace facebook::react
