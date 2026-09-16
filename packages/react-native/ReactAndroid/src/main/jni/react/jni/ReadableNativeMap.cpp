/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReadableNativeMap.h"

#include "ReadableNativeArray.h"

using namespace facebook::jni;

namespace facebook::react {

void ReadableNativeMap::mapException(std::exception_ptr ex) {
  try {
    std::rethrow_exception(ex);
  } catch (const folly::TypeError& err) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass, err.what());
  }
}

void ReadableNativeMap::throwIfKeysNotImported() const {
  if (!values_.has_value()) [[unlikely]] {
    throwNewJavaException(
        "java/lang/IllegalStateException",
        "importKeys must be called before importing values or types");
  }
}

void addDynamicToJArray(
    alias_ref<JArrayClass<jobject>> jarray,
    jint index,
    const folly::dynamic& dyn) {
  local_ref<jobject> value;
  switch (dyn.type()) {
    case folly::dynamic::Type::BOOL:
      value = JBoolean::valueOf(static_cast<jboolean>(dyn.getBool()));
      break;
    case folly::dynamic::Type::INT64:
      value = JDouble::valueOf(static_cast<double>(dyn.getInt()));
      break;
    case folly::dynamic::Type::DOUBLE:
      value = JDouble::valueOf(dyn.getDouble());
      break;
    case folly::dynamic::Type::STRING:
      value = make_jstring(dyn.getString());
      break;
    case folly::dynamic::Type::OBJECT:
      value = ReadableNativeMap::newObjectCxxArgs(dyn);
      break;
    case folly::dynamic::Type::ARRAY:
      value = ReadableNativeArray::newObjectCxxArgs(dyn);
      break;
    case folly::dynamic::Type::NULLT:
    default:
      break;
  }
  jarray->setElement(index, value.get());
}

local_ref<JArrayClass<jstring>> ReadableNativeMap::importKeys() {
  throwIfConsumed();

  auto size = map_ == nullptr ? 0 : static_cast<jsize>(map_.size());
  std::vector<const folly::dynamic*> values(size);

  auto jarray = JArrayClass<jstring>::newArray(size);
  jint i = 0;
  if (map_ != nullptr) {
    for (auto& pair : map_.items()) {
      values[i] = &pair.second;
      jarray->setElement(i++, make_jstring(pair.first.getString()).get());
    }
  }
  values_ = std::move(values);

  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeMap::importValues() {
  throwIfConsumed();
  throwIfKeysNotImported();

  const auto& values = values_.value();
  auto size = static_cast<jsize>(values.size());
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    addDynamicToJArray(jarray, ii, *values[ii]);
  }
  return jarray;
}

local_ref<JArrayClass<jobject>> ReadableNativeMap::importTypes() {
  throwIfConsumed();
  throwIfKeysNotImported();

  const auto& values = values_.value();
  auto size = static_cast<jsize>(values.size());
  auto jarray = JArrayClass<jobject>::newArray(size);
  for (jint ii = 0; ii < size; ii++) {
    jarray->setElement(ii, ReadableType::getType(values[ii]->type()).get());
  }
  return jarray;
}

local_ref<ReadableNativeMap::jhybridobject>
ReadableNativeMap::createWithContents(folly::dynamic&& map) {
  if (map.isNull()) {
    return {nullptr};
  }

  if (!map.isObject()) {
    throwNewJavaException(
        exceptions::gUnexpectedNativeTypeExceptionClass,
        "expected Map, got a %s",
        map.typeName());
  }

  return newObjectCxxArgs(std::move(map));
}

void ReadableNativeMap::registerNatives() {
  registerHybrid({
      makeNativeMethod("importKeys", ReadableNativeMap::importKeys),
      makeNativeMethod("importValues", ReadableNativeMap::importValues),
      makeNativeMethod("importTypes", ReadableNativeMap::importTypes),
  });
}

} // namespace facebook::react
