/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_MODULE_INTEROP

#include <string>
#include <vector>

#include <ReactCommon/TurboModule.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include "JavaTurboModule.h"

namespace facebook::react {

class JSI_EXPORT JavaInteropTurboModule : public JavaTurboModule {
 public:
  struct MethodDescriptor {
    std::string methodName;
    std::string jniSignature;
    TurboModuleMethodValueKind jsiReturnKind;
    int jsArgCount;
  };

  JavaInteropTurboModule(
      const JavaTurboModule::InitParams &params,
      const std::vector<MethodDescriptor> &methodDescriptors);

  std::vector<facebook::jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime &runtime) override;

 protected:
  jsi::Value create(jsi::Runtime &runtime, const jsi::PropNameID &propName) override;

 private:
  std::vector<MethodDescriptor> methodDescriptors_;
  std::vector<jmethodID> methodIDs_;
  jsi::Value constantsCache_;

  const jsi::Value &getConstants(jsi::Runtime &runtime);
  bool exportsConstants();
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_MODULE_INTEROP
