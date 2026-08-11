/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/BindingsInstallerHolder.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace facebook::react {

class SampleTurboModuleJSIBindings
    : public jni::JavaClass<SampleTurboModuleJSIBindings> {
 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/fbreact/specs/SampleTurboModule;";

  SampleTurboModuleJSIBindings() = default;

  static void registerNatives();

 private:
  // Using static function as a simple demonstration
  static jni::local_ref<BindingsInstallerHolder::javaobject>
  getBindingsInstaller(jni::alias_ref<SampleTurboModuleJSIBindings> jobj);
};

} // namespace facebook::react
