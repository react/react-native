/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeCommon.h"

using namespace facebook::jni;

namespace facebook::react {

namespace exceptions {
const char* gUnexpectedNativeTypeExceptionClass =
    "com/facebook/react/bridge/UnexpectedNativeTypeException";
}

namespace {

// Returns a leaked global_ref.
alias_ref<ReadableType> getTypeField(const char* fieldName) {
  static auto cls = ReadableType::javaClassStatic();
  auto field = cls->getStaticField<ReadableType::javaobject>(fieldName);
  return make_global(cls->getStaticFieldValue(field)).release();
}

} // namespace

alias_ref<ReadableType> ReadableType::getType(folly::dynamic::Type type) {
  switch (type) {
    case folly::dynamic::Type::NULLT: {
      static auto val = getTypeField("Null");
      return val;
    }
    case folly::dynamic::Type::BOOL: {
      static auto val = getTypeField("Boolean");
      return val;
    }
    case folly::dynamic::Type::DOUBLE:
    case folly::dynamic::Type::INT64: {
      static auto val = getTypeField("Number");
      return val;
    }
    case folly::dynamic::Type::STRING: {
      static auto val = getTypeField("String");
      return val;
    }
    case folly::dynamic::Type::OBJECT: {
      static auto val = getTypeField("Map");
      return val;
    }
    case folly::dynamic::Type::ARRAY: {
      static auto val = getTypeField("Array");
      return val;
    }
    default:
      throwNewJavaException(
          exceptions::gUnexpectedNativeTypeExceptionClass, "Unknown type");
  }
}

} // namespace facebook::react
