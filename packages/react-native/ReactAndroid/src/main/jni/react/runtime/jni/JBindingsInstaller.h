/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/runtime/BindingsInstaller.h>
#include <react/runtime/ReactInstance.h>

namespace facebook::react {

class JBindingsInstaller : public jni::HybridClass<JBindingsInstaller>,
                           public BindingsInstaller {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/runtime/BindingsInstaller;";

  ~JBindingsInstaller() {}

 private:
  friend HybridBase;
};

} // namespace facebook::react
