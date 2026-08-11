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

class NativeMap : public jni::HybridClass<NativeMap> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/NativeMap;";

  jni::local_ref<jstring> toString();

  RN_EXPORT folly::dynamic consume();

  // Whether this map has been added to another array or map and no longer
  // has a valid map value.
  bool isConsumed;

  static void registerNatives();

 protected:
  folly::dynamic map_;

  friend HybridBase;

  template <class Dyn>
  explicit NativeMap(Dyn&& map)
      : isConsumed(false), map_(std::forward<Dyn>(map)) {}

  void throwIfConsumed();

  NativeMap(const NativeMap&) = delete;
  NativeMap& operator=(const NativeMap&) = delete;
};

} // namespace facebook::react
