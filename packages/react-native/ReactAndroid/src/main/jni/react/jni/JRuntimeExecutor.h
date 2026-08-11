/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <fbjni/fbjni.h>

namespace facebook::react {

class JRuntimeExecutor : public jni::HybridClass<JRuntimeExecutor> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/RuntimeExecutor;";

  RuntimeExecutor get();

 private:
  friend HybridBase;
  JRuntimeExecutor(RuntimeExecutor runtimeExecutor);
  RuntimeExecutor runtimeExecutor_;
};

} // namespace facebook::react
