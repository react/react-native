/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <folly/dynamic.h>

#include "NativeCommon.h"

namespace facebook::react {

class NativeArray : public jni::HybridClass<NativeArray> {
 public:
  static auto constexpr* kJavaDescriptor =
      "Lcom/facebook/react/bridge/NativeArray;";

  jni::local_ref<jstring> toString();

  const folly::dynamic& getArray() const {
    return array_;
  }

  RN_EXPORT folly::dynamic consume();

  // Whether this array has been added to another array or map and no longer
  // has a valid array value.
  bool isConsumed;

  static void registerNatives();

 protected:
  folly::dynamic array_;

  friend HybridBase;

  template <class Dyn>
  explicit NativeArray(Dyn&& array)
      : isConsumed(false), array_(std::forward<Dyn>(array)) {
    assertInternalType();
  }

  void assertInternalType();
  void throwIfConsumed();

  NativeArray(const NativeArray&) = delete;
  NativeArray& operator=(const NativeArray&) = delete;
};

} // namespace facebook::react
