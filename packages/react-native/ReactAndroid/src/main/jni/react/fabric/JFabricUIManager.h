/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react {

class FabricUIManagerBinding;

class JFabricUIManager : public jni::JavaClass<JFabricUIManager> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/fabric/FabricUIManager;";

  FabricUIManagerBinding* getBinding();
};

} // namespace facebook::react
