/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JDynamicNative.h"
#include "ReadableNativeArray.h"
#include "ReadableNativeMap.h"

using namespace facebook::jni;

namespace facebook::react {

jboolean JDynamicNative::isNullNative() {
  return static_cast<jboolean>(payload_.isNull());
}

jni::alias_ref<ReadableType> JDynamicNative::getTypeNative() {
  return ReadableType::getType(payload_.type());
}

jni::local_ref<jstring> JDynamicNative::asString() {
  return jni::make_jstring(payload_.asString());
}

jboolean JDynamicNative::asBoolean() {
  return static_cast<jboolean>(payload_.asBool());
}

jdouble JDynamicNative::asDouble() {
  return payload_.asDouble();
}

jni::local_ref<ReadableArray> JDynamicNative::asArray() {
  return jni::adopt_local(
      reinterpret_cast<ReadableArray::javaobject>(
          ReadableNativeArray::newObjectCxxArgs(payload_).release()));
}

jni::local_ref<ReadableMap> JDynamicNative::asMap() {
  return jni::adopt_local(
      reinterpret_cast<ReadableMap::javaobject>(
          ReadableNativeMap::createWithContents(std::move(payload_))
              .release()));
}

} // namespace facebook::react
