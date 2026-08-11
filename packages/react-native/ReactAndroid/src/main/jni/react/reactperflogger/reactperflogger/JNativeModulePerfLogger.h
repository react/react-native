/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <reactperflogger/NativeModulePerfLogger.h>
#include <memory>

namespace facebook::react {

class JNativeModulePerfLogger
    : public jni::HybridClass<JNativeModulePerfLogger> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/reactperflogger/NativeModulePerfLogger;";

  virtual std::unique_ptr<facebook::react::NativeModulePerfLogger> get() = 0;

 private:
  friend HybridBase;
};

} // namespace facebook::react
