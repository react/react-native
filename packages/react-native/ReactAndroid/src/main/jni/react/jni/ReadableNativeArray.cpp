/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReadableNativeArray.h"

#include "ReadableNativeMap.h"

using namespace facebook::jni;

namespace facebook::react {

void ReadableNativeArray::mapException(std::exception_ptr ex) {
  try {
    std::rethrow_exception(ex);
  } catch (const folly::TypeError& err) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass, err.what());
  }
}

local_ref<JArrayClass<jobject>> ReadableNativeArray::importArray() {
  auto size = static_cast<jsize>(array_.size());
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    addDynamicToJArray(jarray, ii, array_.at(ii));
  }
  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeArray::importTypeArray() {
  auto size = static_cast<jsize>(array_.size());
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    jarray->setElement(ii, ReadableType::getType(array_.at(ii).type()).get());
  }
  return jarray;
}

bool ReadableNativeArray::equals(
    jni::alias_ref<ReadableNativeArray::javaobject> other) {
  return array_ == other->cthis()->array_;
}

void ReadableNativeArray::registerNatives() {
  registerHybrid({
      makeNativeMethod("importArray", ReadableNativeArray::importArray),
      makeNativeMethod("importTypeArray", ReadableNativeArray::importTypeArray),
      makeNativeMethod("nativeEquals", ReadableNativeArray::equals),
  });
}

} // namespace facebook::react
