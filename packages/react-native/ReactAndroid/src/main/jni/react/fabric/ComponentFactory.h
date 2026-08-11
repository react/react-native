/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>

namespace facebook::react {

class Instance;

class ComponentFactory : public jni::HybridClass<ComponentFactory> {
 public:
  constexpr static const char* const kJavaDescriptor =
      "Lcom/facebook/react/fabric/ComponentFactory;";

  static void registerNatives();

  ComponentRegistryFactory buildRegistryFunction;

 private:
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass> /*unused*/);
};

} // namespace facebook::react
