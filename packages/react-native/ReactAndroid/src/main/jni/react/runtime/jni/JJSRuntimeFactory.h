/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <react/runtime/JSRuntimeFactory.h>

namespace facebook::react {

class JJSRuntimeFactory : public jni::HybridClass<JJSRuntimeFactory>,
                          public JSRuntimeFactory {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/runtime/JSRuntimeFactory;";

 private:
  friend HybridBase;
};

} // namespace facebook::react
