/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DefaultComponentsRegistry.h"

#include <CoreComponentsRegistry.h>
#include <fbjni/fbjni.h>
#include <react/debug/react_native_assert.h>
#include <react/fabric/ComponentFactory.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/FBReactNativeSpec/ComponentDescriptors.h>

namespace facebook::react {

std::function<void(std::shared_ptr<const ComponentDescriptorProviderRegistry>)>
    DefaultComponentsRegistry::registerComponentDescriptorsFromEntryPoint{};

std::function<void(std::shared_ptr<const ComponentDescriptorProviderRegistry>)>
    DefaultComponentsRegistry::
        registerCodegenComponentDescriptorsFromEntryPoint{};

void DefaultComponentsRegistry::setRegistryRunction(
    jni::alias_ref<jclass> /*unused*/,
    ComponentFactory* delegate) {
  delegate
      ->buildRegistryFunction = [](const EventDispatcher::Weak& eventDispatcher,
                                   const std::shared_ptr<
                                       const ContextContainer>&
                                       contextContainer) {
    ComponentDescriptorParameters params{
        .eventDispatcher = eventDispatcher,
        .contextContainer = contextContainer,
        .flavor = nullptr};

    auto providerRegistry = CoreComponentsRegistry::sharedProviderRegistry();
    if (registerComponentDescriptorsFromEntryPoint) {
      registerComponentDescriptorsFromEntryPoint(providerRegistry);
    } else {
      LOG(WARNING)
          << "Custom component descriptors were not configured from JNI_OnLoad";
    }
    if (registerCodegenComponentDescriptorsFromEntryPoint) {
      registerCodegenComponentDescriptorsFromEntryPoint(providerRegistry);
    } else {
      LOG(WARNING)
          << "Codegen component descriptors were not configured from JNI_OnLoad";
    }
    CoreComponentsRegistry::addCoreComponents(providerRegistry);

    auto registry = providerRegistry->createComponentDescriptorRegistry(params);
    auto& mutableRegistry = const_cast<ComponentDescriptorRegistry&>(*registry);
    mutableRegistry.setFallbackComponentDescriptor(
        std::make_shared<UnimplementedNativeViewComponentDescriptor>(params));

    return registry;
  };
}

void DefaultComponentsRegistry::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "register", DefaultComponentsRegistry::setRegistryRunction),
  });
}

} // namespace facebook::react
