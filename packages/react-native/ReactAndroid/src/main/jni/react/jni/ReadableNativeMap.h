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
#include <optional>
#include <vector>

#include "NativeMap.h"

namespace facebook::react {

struct WritableNativeMap;

struct ReadableMap : jni::JavaClass<ReadableMap> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/bridge/ReadableMap;";
};

void addDynamicToJArray(jni::alias_ref<jni::JArrayClass<jobject>> jarray, jint index, const folly::dynamic &dyn);

struct ReadableNativeMap : jni::HybridClass<ReadableNativeMap, NativeMap> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/bridge/ReadableNativeMap;";

  jni::local_ref<jni::JArrayClass<jstring>> importKeys();
  jni::local_ref<jni::JArrayClass<jobject>> importValues();
  jni::local_ref<jni::JArrayClass<jobject>> importTypes();
  static jni::local_ref<jhybridobject> createWithContents(folly::dynamic &&map);

  static void mapException(std::exception_ptr ex);
  static void registerNatives();

  using HybridBase::HybridBase;
  friend HybridBase;
  friend struct WritableNativeMap;

 private:
  void throwIfKeysNotImported() const;

  // folly::dynamic stores object entries in an F14NodeMap, so these pointers
  // remain valid across the insertions and replacements exposed by
  // WritableNativeMap.
  std::optional<std::vector<const folly::dynamic *>> values_;
};

} // namespace facebook::react
