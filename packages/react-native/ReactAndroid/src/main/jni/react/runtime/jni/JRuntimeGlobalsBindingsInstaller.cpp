/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JRuntimeGlobalsBindingsInstaller.h"

#include <react/runtime/RuntimeGlobals.h>

namespace facebook::react {

jni::local_ref<JRuntimeGlobalsBindingsInstaller::jhybriddata>
JRuntimeGlobalsBindingsInstaller::initHybrid(
    jni::alias_ref<jclass>,
    NativeMap* globals,
    jni::alias_ref<JBindingsInstaller::javaobject> bindingsInstaller) {
  ReactInstance::BindingsInstallFunc additionalBindings;
  if (bindingsInstaller) {
    additionalBindings = [installer = jni::make_global(bindingsInstaller)](
                             jsi::Runtime& runtime) {
      auto install = installer->cthis()->getBindingsInstallFunc();
      if (install) {
        install(runtime);
      }
    };
  }
  return makeCxxInstance(createRuntimeGlobalsInstaller(
      globals->consume(), std::move(additionalBindings)));
}

ReactInstance::BindingsInstallFunc
JRuntimeGlobalsBindingsInstaller::getBindingsInstallFunc() {
  return installFunc_;
}

void JRuntimeGlobalsBindingsInstaller::registerNatives() {
  registerHybrid({makeNativeMethod(
      "initHybrid", JRuntimeGlobalsBindingsInstaller::initHybrid)});
}

} // namespace facebook::react
