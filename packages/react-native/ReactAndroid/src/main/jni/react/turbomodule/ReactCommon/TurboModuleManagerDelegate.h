/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/JavaTurboModule.h>
#include <fbjni/fbjni.h>
#include <memory>
#include <string>

namespace facebook::react {

class TurboModuleManagerDelegate
    : public jni::HybridClass<TurboModuleManagerDelegate> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/internal/turbomodule/core/TurboModuleManagerDelegate;";

  virtual std::shared_ptr<TurboModule> getTurboModule(
      const std::string& name,
      const JavaTurboModule::InitParams& params) = 0;
  virtual std::shared_ptr<TurboModule> getTurboModule(
      const std::string& name,
      const std::shared_ptr<CallInvoker>& jsInvoker) = 0;

 private:
  friend HybridBase;
};

} // namespace facebook::react
