/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <memory>

namespace facebook::react {

class TurboModule;
class CallInvoker;

class CxxReactPackage : public jni::HybridClass<CxxReactPackage> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/runtime/cxxreactpackage/CxxReactPackage;";

  virtual std::shared_ptr<TurboModule> getModule(
      const std::string& name,
      const std::shared_ptr<CallInvoker>& jsInvoker) = 0;

 private:
  friend HybridBase;
};

} // namespace facebook::react
