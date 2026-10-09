/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>
#include <utility>
#include <vector>

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>

using namespace facebook::react;

TEST(ShadowNodeFamilyTest, sealObjectCorrectly) {
  /*
   * The structure:
   * <A>
   *  <AA>
   *    <AAA/>
   *  </AA>
   * </A>
   */
  ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
  auto eventDispatcher = EventDispatcher::Shared{};
  auto componentDescriptorRegistry =
      componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
          ComponentDescriptorParameters{
              .eventDispatcher = eventDispatcher,
              .contextContainer = nullptr,
              .flavor = nullptr});

  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());

  auto builder = ComponentBuilder{componentDescriptorRegistry};

  auto shadowNodeAAA = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeAA = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto elementA =
      Element<ViewShadowNode>()
        .tag(1)
        .finalize([](ViewShadowNode &shadowNode){
          shadowNode.sealRecursive();
        })
        .children({
          Element<ViewShadowNode>()
            .tag(2)
            .reference(shadowNodeAA)
            .children({
              Element<ViewShadowNode>()
                .reference(shadowNodeAAA)
                .tag(3)
            })
        });
  auto elementB =
    Element<ViewShadowNode>()
      .tag(1)
      .finalize([](ViewShadowNode &shadowNode){
        shadowNode.sealRecursive();
      });
  // clang-format on

  auto shadowNodeA = builder.build(elementA);
  auto shadowNodeB = builder.build(elementB);

  // Negative case:
  auto ancestors1 = shadowNodeB->getFamily().getAncestors(*shadowNodeA);
  EXPECT_EQ(ancestors1.size(), 0);

  // Positive case:
  auto ancestors2 = shadowNodeAAA->getFamily().getAncestors(*shadowNodeA);
  EXPECT_EQ(ancestors2.size(), 2);
  EXPECT_EQ(&ancestors2[0].first.get(), shadowNodeA.get());
  EXPECT_EQ(&ancestors2[1].first.get(), shadowNodeAA.get());
}

TEST(ShadowNodeFamilyTest, callsDestroyedCallbackWhetherOrNotMounted) {
  ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
  auto componentDescriptorRegistry =
      componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
          ComponentDescriptorParameters{
              .eventDispatcher = EventDispatcher::Shared{},
              .contextContainer = nullptr,
              .flavor = nullptr});
  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());
  auto builder = ComponentBuilder{componentDescriptorRegistry};

  auto mountedShadowNode = builder.build(Element<ViewShadowNode>().tag(1));
  auto unmountedShadowNode = builder.build(Element<ViewShadowNode>().tag(2));
  auto destroyedFamilies = std::vector<std::pair<Tag, bool>>{};
  for (const auto& shadowNode : {mountedShadowNode, unmountedShadowNode}) {
    shadowNode->getFamilyShared()->onFamilyDestroyed(
        [&](const ShadowNodeFamily& family) {
          destroyedFamilies.emplace_back(
              family.getTag(), family.hasBeenMounted());
        });
  }
  mountedShadowNode->setMounted(true);

  mountedShadowNode.reset();
  unmountedShadowNode.reset();

  EXPECT_EQ(
      destroyedFamilies,
      (std::vector<std::pair<Tag, bool>>{{1, true}, {2, false}}));
}

TEST(ShadowNodeFamilyTest, deprecatedUnmountedCallbackSkipsMountedFamilies) {
  ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
  auto componentDescriptorRegistry =
      componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
          ComponentDescriptorParameters{
              .eventDispatcher = EventDispatcher::Shared{},
              .contextContainer = nullptr,
              .flavor = nullptr});
  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());
  auto builder = ComponentBuilder{componentDescriptorRegistry};

  auto mountedShadowNode = builder.build(Element<ViewShadowNode>().tag(1));
  auto unmountedShadowNode = builder.build(Element<ViewShadowNode>().tag(2));
  auto destroyedTags = std::vector<Tag>{};
  for (const auto& shadowNode : {mountedShadowNode, unmountedShadowNode}) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    shadowNode->getFamilyShared()->onUnmountedFamilyDestroyed(
        [&](const ShadowNodeFamily& family) {
          destroyedTags.push_back(family.getTag());
        });
#pragma clang diagnostic pop
  }
  mountedShadowNode->setMounted(true);

  mountedShadowNode.reset();
  unmountedShadowNode.reset();

  EXPECT_EQ(destroyedTags, std::vector<Tag>{2});
}
