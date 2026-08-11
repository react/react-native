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
#include "ReadableNativeMap.h"

namespace facebook::react {

struct WritableMap : jni::JavaClass<WritableMap> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/WritableMap;";
};

struct WritableNativeMap
    : jni::HybridClass<WritableNativeMap, ReadableNativeMap> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/WritableNativeMap;";

  WritableNativeMap();
  WritableNativeMap(folly::dynamic&& val);

  static void initHybrid(jni::alias_ref<jhybridobject> jobj);

  void putNull(std::string key);
  void putBoolean(std::string key, bool val);
  void putDouble(std::string key, double val);
  void putInt(std::string key, int val);
  void putLong(std::string key, jlong val);
  void putString(std::string key, jni::alias_ref<jstring> val);
  void putNativeArray(std::string key, ReadableNativeArray* otherArray);
  void putNativeMap(std::string key, ReadableNativeMap* otherMap);
  void mergeNativeMap(ReadableNativeMap* other);

  static void registerNatives();

  friend HybridBase;
};

} // namespace facebook::react
