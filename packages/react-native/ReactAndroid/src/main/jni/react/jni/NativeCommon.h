/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <folly/dynamic.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

struct ReadableType : public jni::JavaClass<ReadableType> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/ReadableType;";

  static jni::local_ref<ReadableType> getType(folly::dynamic::Type type);
};

namespace exceptions {

extern const char* gUnexpectedNativeTypeExceptionClass;

template <typename T>
void throwIfObjectAlreadyConsumed(const T& t, const char* msg) {
  if (t->isConsumed) {
    jni::throwNewJavaException(
        "com/facebook/react/bridge/ObjectAlreadyConsumedException", msg);
  }
}

} // namespace exceptions

} // namespace facebook::react
