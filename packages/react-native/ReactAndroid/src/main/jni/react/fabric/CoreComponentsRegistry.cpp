/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CoreComponentsRegistry.h"

#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/components/FBReactNativeSpec/ComponentDescriptors.h>
#include <react/renderer/components/androidswitch/AndroidSwitchComponentDescriptor.h>
#include <react/renderer/components/androidtextinput/AndroidTextInputComponentDescriptor.h>
#include <react/renderer/components/image/ImageComponentDescriptor.h>
#include <react/renderer/components/modal/ModalHostViewComponentDescriptor.h>
#include <react/renderer/components/progressbar/AndroidProgressBarComponentDescriptor.h>
#include <react/renderer/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#include <react/renderer/components/scrollview/AndroidHorizontalScrollContentViewComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/text/ParagraphComponentDescriptor.h>
#include <react/renderer/components/text/RawTextComponentDescriptor.h>
#include <react/renderer/components/text/SelectableParagraphComponentDescriptor.h>
#include <react/renderer/components/text/TextComponentDescriptor.h>
#include <react/renderer/components/text/TextEffectComponentDescriptor.h>
#include <react/renderer/components/view/LayoutConformanceComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/components/virtualview/VirtualViewComponentDescriptor.h>

namespace facebook::react::CoreComponentsRegistry {

std::shared_ptr<const ComponentDescriptorProviderRegistry>
sharedProviderRegistry() {
  static auto providerRegistry =
      std::make_shared<ComponentDescriptorProviderRegistry>();
  return providerRegistry;
}

void addCoreComponents(
    std::shared_ptr<const ComponentDescriptorProviderRegistry>
        providerRegistry) {
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          AndroidProgressBarComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          AndroidSwipeRefreshLayoutComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          ActivityIndicatorViewComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          AndroidTextInputComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<ImageComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<ModalHostViewComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<AndroidSwitchComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<TextComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<TextEffectComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<RawTextComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          AndroidHorizontalScrollContentViewComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<ParagraphComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          SelectableParagraphComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          AndroidDrawerLayoutComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          DebuggingOverlayComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<
          LayoutConformanceComponentDescriptor>());
  providerRegistry->add(
      concreteComponentDescriptorProvider<VirtualViewComponentDescriptor>());
}

} // namespace facebook::react::CoreComponentsRegistry
