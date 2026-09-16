/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

using namespace facebook::react;

TEST(ElementTest, testNormalCases) {
  auto builder = simpleComponentBuilder();

  auto shadowNodeA = std::shared_ptr<RootShadowNode>{};
  auto shadowNodeAA = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeAB = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeABA = std::shared_ptr<ViewShadowNode>{};

  auto propsAA = std::make_shared<ViewProps>();
  propsAA->nativeId = "node AA";

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(shadowNodeA)
        .tag(1)
        .props([]() {
          auto props = std::make_shared<RootProps>();
          props->nativeId = "node A";
          return props;
        })
        .finalize([](RootShadowNode &shadowNode){
          shadowNode.sealRecursive();
        })
        .children({
          Element<ViewShadowNode>()
            .reference(shadowNodeAA)
            .tag(2)
            .props(propsAA),
          Element<ViewShadowNode>()
            .reference(shadowNodeAB)
            .tag(3)
            .props([]() {
               auto props = std::make_shared<ViewProps>();
               props->nativeId = "node AB";
               return props;
            })
            .children({
              Element<ViewShadowNode>()
                .reference(shadowNodeABA)
                .tag(4)
                .props([]() {
                  auto props = std::make_shared<ViewProps>();
                  props->nativeId = "node ABA";
                  return props;
                })
            })
        });
  // clang-format on

  auto shadowNode = builder.build(element);

  EXPECT_EQ(shadowNode, shadowNodeA);

  // Tags
  EXPECT_EQ(shadowNodeA->getTag(), 1);
  EXPECT_EQ(shadowNodeAA->getTag(), 2);
  EXPECT_EQ(shadowNodeAB->getTag(), 3);
  EXPECT_EQ(shadowNodeABA->getTag(), 4);

  // Children
  EXPECT_EQ(shadowNodeA->getChildren().size(), 2);
  EXPECT_EQ(shadowNodeAA->getChildren().size(), 0);
  EXPECT_EQ(shadowNodeAB->getChildren().size(), 1);
  EXPECT_EQ(shadowNodeABA->getChildren().size(), 0);
  EXPECT_EQ(
      shadowNodeA->getChildren(),
      (std::vector<std::shared_ptr<const ShadowNode>>{
          shadowNodeAA, shadowNodeAB}));
  EXPECT_EQ(
      shadowNodeAB->getChildren(),
      (std::vector<std::shared_ptr<const ShadowNode>>{shadowNodeABA}));

  // Props
  EXPECT_EQ(shadowNodeA->getProps()->nativeId, "node A");
  EXPECT_EQ(shadowNodeABA->getProps()->nativeId, "node ABA");
  EXPECT_EQ(shadowNodeAA->getProps(), propsAA);

  // Finalize
  EXPECT_TRUE(shadowNodeA->getSealed());
  EXPECT_TRUE(shadowNodeAA->getSealed());
  EXPECT_TRUE(shadowNodeAB->getSealed());
  EXPECT_TRUE(shadowNodeABA->getSealed());
}
