/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/image/ImageComponentDescriptor.h>
#include <react/renderer/components/modal/ModalHostViewComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/text/ParagraphComponentDescriptor.h>
#include <react/renderer/components/text/RawTextComponentDescriptor.h>
#include <react/renderer/components/text/TextComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>

namespace facebook::react {

inline ComponentRegistryFactory getDefaultComponentRegistryFactory() {
  return [](const EventDispatcher::Weak& eventDispatcher,
            const std::shared_ptr<const ContextContainer>& contextContainer) {
    static auto providerRegistry = []() {
      auto providerRegistry =
          std::make_shared<ComponentDescriptorProviderRegistry>();
      providerRegistry->add(
          concreteComponentDescriptorProvider<ImageComponentDescriptor>());
      providerRegistry->add(
          concreteComponentDescriptorProvider<ParagraphComponentDescriptor>());
      providerRegistry->add(
          concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>());
      providerRegistry->add(
          concreteComponentDescriptorProvider<RawTextComponentDescriptor>());
      providerRegistry->add(
          concreteComponentDescriptorProvider<TextComponentDescriptor>());
      providerRegistry->add(
          concreteComponentDescriptorProvider<ViewComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<
                            ModalHostViewComponentDescriptor>());
      return providerRegistry;
    }();
    return providerRegistry->createComponentDescriptorRegistry(
        {eventDispatcher, contextContainer, nullptr});
  };
}

} // namespace facebook::react
