/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react {

class TransformHelper : public jni::JavaClass<TransformHelper> {
 public:
  static auto constexpr* kJavaDescriptor =
      "Lcom/facebook/react/uimanager/TransformHelper;";

  static void registerNatives();
};

} // namespace facebook::react
