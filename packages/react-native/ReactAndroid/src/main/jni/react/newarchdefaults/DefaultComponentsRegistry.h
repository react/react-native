/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/fabric/ComponentFactory.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

class DefaultComponentsRegistry
    : public facebook::jni::JavaClass<DefaultComponentsRegistry> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/defaults/DefaultComponentsRegistry;";

  static void registerNatives();

  static std::function<void(
      std::shared_ptr<const ComponentDescriptorProviderRegistry>)>
      registerComponentDescriptorsFromEntryPoint;

  static std::function<void(
      std::shared_ptr<const ComponentDescriptorProviderRegistry>)>
      registerCodegenComponentDescriptorsFromEntryPoint;

 private:
  static void setRegistryRunction(
      jni::alias_ref<jclass> /*unused*/,
      ComponentFactory* delegate);
};

} // namespace facebook::react
