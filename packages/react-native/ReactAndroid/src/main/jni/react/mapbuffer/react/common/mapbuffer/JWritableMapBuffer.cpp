/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JWritableMapBuffer.h"
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

namespace facebook::react {

MapBuffer JWritableMapBuffer::getMapBuffer() {
  static const auto getKeys =
      javaClassStatic()->getMethod<jni::JArrayInt()>("getKeys");
  static const auto getValues =
      javaClassStatic()->getMethod<jni::JArrayClass<jni::JObject>()>(
          "getValues");

  auto keyArray = getKeys(self());
  auto values = getValues(self());

  auto keys = keyArray->pin();

  MapBufferBuilder builder;

  auto size = keys.size();
  for (int i = 0; i < size; i++) {
    auto key = keys[i];
    jni::local_ref<jni::JObject> value = values->getElement(i);

    static const auto booleanClass = jni::JBoolean::javaClassStatic();
    static const auto integerClass = jni::JInteger::javaClassStatic();
    static const auto doubleClass = jni::JDouble::javaClassStatic();
    static const auto stringClass = jni::JString::javaClassStatic();
    static const auto readableMapClass = JReadableMapBuffer::javaClassStatic();
    static const auto writableMapClass = JWritableMapBuffer::javaClassStatic();
    static const auto intArrayClass = jni::JArrayInt::javaClassStatic();
    static const auto doubleArrayClass = jni::JArrayDouble::javaClassStatic();

    if (value->isInstanceOf(booleanClass)) {
      auto element = jni::static_ref_cast<jni::JBoolean>(value);
      builder.putBool(key, element->value() != 0u);
    } else if (value->isInstanceOf(integerClass)) {
      auto element = jni::static_ref_cast<jni::JInteger>(value);
      builder.putInt(key, element->value());
    } else if (value->isInstanceOf(doubleClass)) {
      auto element = jni::static_ref_cast<jni::JDouble>(value);
      builder.putDouble(key, element->value());
    } else if (value->isInstanceOf(stringClass)) {
      auto element = jni::static_ref_cast<jni::JString>(value);
      builder.putString(key, element->toStdString());
    } else if (value->isInstanceOf(readableMapClass)) {
      auto element =
          jni::static_ref_cast<JReadableMapBuffer::jhybridobject>(value);
      builder.putMapBuffer(key, MapBuffer(element->cthis()->data()));
    } else if (value->isInstanceOf(writableMapClass)) {
      auto element =
          jni::static_ref_cast<JWritableMapBuffer::javaobject>(value);
      builder.putMapBuffer(key, element->getMapBuffer());
    } else if (value->isInstanceOf(intArrayClass)) {
      auto array = jni::static_ref_cast<jni::JArrayInt>(value);
      auto pinned = array->pin();
      builder.putIntBuffer(
          key,
          std::vector<int32_t>(pinned.get(), pinned.get() + pinned.size()));
    } else if (value->isInstanceOf(doubleArrayClass)) {
      auto array = jni::static_ref_cast<jni::JArrayDouble>(value);
      auto pinned = array->pin();
      builder.putDoubleBuffer(
          key, std::vector<double>(pinned.get(), pinned.get() + pinned.size()));
    }
  }

  return builder.build();
}

} // namespace facebook::react
