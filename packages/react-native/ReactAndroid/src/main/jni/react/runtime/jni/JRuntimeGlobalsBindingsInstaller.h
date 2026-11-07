/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/NativeMap.h>

#include "JBindingsInstaller.h"

namespace facebook::react {

class JRuntimeGlobalsBindingsInstaller : public jni::HybridClass<JRuntimeGlobalsBindingsInstaller, JBindingsInstaller> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/runtime/RuntimeGlobalsBindingsInstaller;";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      NativeMap *globals,
      jni::alias_ref<JBindingsInstaller::javaobject> bindingsInstaller);

  static void registerNatives();

  ReactInstance::BindingsInstallFunc getBindingsInstallFunc() override;

 private:
  explicit JRuntimeGlobalsBindingsInstaller(ReactInstance::BindingsInstallFunc installFunc)
      : installFunc_(std::move(installFunc))
  {
  }

  const ReactInstance::BindingsInstallFunc installFunc_;

  friend HybridBase;
};

} // namespace facebook::react
