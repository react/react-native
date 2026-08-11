/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react {

struct JNativeModule : jni::JavaClass<JNativeModule> {
  constexpr static const char* const kJavaDescriptor =
      "Lcom/facebook/react/bridge/NativeModule;";
};

} // namespace facebook::react
