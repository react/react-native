/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "FantomTextInput.h"

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/image/ImageComponentDescriptor.h>
#include <react/renderer/components/modal/ModalHostViewComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/text/ParagraphComponentDescriptor.h>
#include <react/renderer/components/text/RawTextComponentDescriptor.h>
#include <react/renderer/components/text/SelectableParagraphComponentDescriptor.h>
#include <react/renderer/components/text/TextComponentDescriptor.h>
#include <react/renderer/components/view/LayoutConformanceComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>

namespace facebook::react {

inline ComponentRegistryFactory getDefaultComponentRegistryFactory(std::shared_ptr<TextLayoutManager> textLayoutManager)
{
  return [textLayoutManager = std::move(textLayoutManager)](
             const EventDispatcher::Weak &eventDispatcher,
             const std::shared_ptr<const ContextContainer> &contextContainer) {
    contextContainer->insert("TextLayoutManager", textLayoutManager);
    static const auto providerRegistry = []() {
      auto providerRegistry = std::make_shared<ComponentDescriptorProviderRegistry>();
      providerRegistry->add(concreteComponentDescriptorProvider<ImageComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<LayoutConformanceComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<ParagraphComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<RawTextComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<SelectableParagraphComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<TextComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<ViewComponentDescriptor>());
      providerRegistry->add(concreteComponentDescriptorProvider<ModalHostViewComponentDescriptor>());
      providerRegistry->add(
          concreteComponentDescriptorProvider<FantomTextInputComponentDescriptor<FantomAndroidTextInputName>>());
      providerRegistry->add(
          concreteComponentDescriptorProvider<FantomTextInputComponentDescriptor<FantomSinglelineTextInputName>>());
      providerRegistry->add(
          concreteComponentDescriptorProvider<FantomTextInputComponentDescriptor<FantomMultilineTextInputName>>());
      return providerRegistry;
    }();
    return providerRegistry->createComponentDescriptorRegistry(
        {.eventDispatcher = eventDispatcher, .contextContainer = contextContainer, .flavor = nullptr});
  };
}

} // namespace facebook::react
