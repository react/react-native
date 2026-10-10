/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/renderer/animationbackend/AnimatedPropsBuilder.h>
#include <react/renderer/animationbackend/AnimatedPropsRegistry.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

class AnimatedPropsRegistryTest : public ::testing::Test {
 protected:
  ComponentBuilder builder =
      simpleComponentBuilder(std::make_shared<ContextContainer>());
  std::shared_ptr<ViewShadowNode> node =
      builder.build(Element<ViewShadowNode>().surfaceId(1).tag(10));
  AnimatedPropsRegistry registry;

  void SetUp() override {
    registry.initializeSurface(1);
  }

  void update(AnimatedProps props) {
    std::vector<AnimationMutations> batches(1);
    batches[0].batch.push_back(
        AnimationMutation{
            .tag = 10,
            .family = node->getFamilyShared(),
            .props = std::move(props)});
    registry.update(batches);
  }

  void updateRaw(folly::dynamic props) {
    update(
        {.props = {},
         .rawProps = std::make_unique<RawProps>(std::move(props))});
  }

  void expectRawProps(const folly::dynamic& expected) {
    EXPECT_EQ(*snapshot().rawProps, expected);
  }

  PropsSnapshot& snapshot() {
    return *registry.getMap(1).second.at(10);
  }
};

TEST_F(AnimatedPropsRegistryTest, rawUpdatesDoNotAllocateTypedProps) {
  for (int frame = 0; frame < 10; frame++) {
    updateRaw(folly::dynamic::object("opacity", frame / 10.0));
    auto& props = snapshot();
    EXPECT_EQ(props.props, nullptr);
    EXPECT_TRUE(props.propNames.empty());
    EXPECT_EQ((*props.rawProps)["opacity"], frame / 10.0);
  }
}

TEST_F(AnimatedPropsRegistryTest, updatePreservesInputForSynchronousMount) {
  folly::dynamic rawProps = folly::dynamic::object("opacity", 0.25)(
      "transform",
      folly::dynamic::array(folly::dynamic::object("translateX", 10)));
  std::vector<AnimationMutations> batches(1);
  batches[0].batch.push_back(
      AnimationMutation{
          .tag = 10,
          .family = node->getFamilyShared(),
          .props = AnimatedProps{
              .props = {}, .rawProps = std::make_unique<RawProps>(rawProps)}});
  registry.update(batches);
  registry.update(batches);
  EXPECT_EQ(batches[0].batch[0].props.rawProps->toDynamic(), rawProps);
  EXPECT_EQ(*snapshot().rawProps, rawProps);
}

TEST_F(AnimatedPropsRegistryTest, mergesPendingUpdatesPerKey) {
  updateRaw(
      folly::dynamic::object("opacity", 0.25)(
          "shadowOffset", folly::dynamic::object("width", 2)("height", 3)));
  updateRaw(
      folly::dynamic::object(
          "shadowOffset", folly::dynamic::object("width", 7)));
  expectRawProps(
      folly::dynamic::object("opacity", 0.25)(
          "shadowOffset", folly::dynamic::object("width", 7)));
}

TEST_F(AnimatedPropsRegistryTest, mergesCommittedUpdatesPerKey) {
  updateRaw(
      folly::dynamic::object("opacity", 0.25)(
          "shadowOffset", folly::dynamic::object("width", 2)("height", 3)));
  snapshot();
  updateRaw(
      folly::dynamic::object(
          "shadowOffset", folly::dynamic::object("width", 7)));
  expectRawProps(
      folly::dynamic::object("opacity", 0.25)(
          "shadowOffset", folly::dynamic::object("width", 7)));
}

TEST_F(AnimatedPropsRegistryTest, nullResetsArePreservedInPendingProps) {
  updateRaw(folly::dynamic::object("opacity", 0.25)("borderRadius", 4));
  updateRaw(folly::dynamic::object("opacity", nullptr));
  expectRawProps(folly::dynamic::object("opacity", nullptr)("borderRadius", 4));
}

TEST_F(AnimatedPropsRegistryTest, nullResetsArePreservedInCommittedProps) {
  updateRaw(folly::dynamic::object("opacity", 0.25)("borderRadius", 4));
  snapshot();
  updateRaw(folly::dynamic::object("opacity", nullptr));
  expectRawProps(folly::dynamic::object("opacity", nullptr)("borderRadius", 4));
  updateRaw(folly::dynamic::object("opacity", 0.5));
  expectRawProps(folly::dynamic::object("opacity", 0.5)("borderRadius", 4));
}

TEST_F(AnimatedPropsRegistryTest, arraysReplaceInsteadOfMerging) {
  updateRaw(
      folly::dynamic::object(
          "transform",
          folly::dynamic::array(
              folly::dynamic::object("translateX", 2),
              folly::dynamic::object("scale", 3))));
  snapshot();
  auto transform =
      folly::dynamic::array(folly::dynamic::object("rotate", "1rad"));
  updateRaw(folly::dynamic::object("transform", transform));
  EXPECT_EQ((*snapshot().rawProps)["transform"], transform);
}

TEST_F(AnimatedPropsRegistryTest, valuesReplaceRegardlessOfType) {
  updateRaw(folly::dynamic::object("value", 5));
  snapshot();
  folly::dynamic object = folly::dynamic::object("width", 2)("height", nullptr);
  updateRaw(folly::dynamic::object("value", object));
  expectRawProps(folly::dynamic::object("value", object));
  updateRaw(folly::dynamic::object("value", 7));
  expectRawProps(folly::dynamic::object("value", 7));
}

TEST_F(AnimatedPropsRegistryTest, typedPropsCanFollowRawProps) {
  updateRaw(folly::dynamic::object("opacity", 0.25));
  snapshot();
  AnimatedPropsBuilder builder;
  builder.setOpacity(0.75);
  update(builder.get());
  auto& props = snapshot();
  ASSERT_NE(props.props, nullptr);
  EXPECT_FLOAT_EQ(props.props->opacity, 0.75);
  EXPECT_TRUE(props.propNames.contains(OPACITY));
  EXPECT_EQ((*props.rawProps)["opacity"], 0.25);
  BaseViewProps viewProps;
  updateProp(OPACITY, viewProps, props);
  EXPECT_FLOAT_EQ(viewProps.opacity, 0.75);
}

TEST_F(AnimatedPropsRegistryTest, rawPropsCanFollowTypedProps) {
  AnimatedPropsBuilder builder;
  builder.setOpacity(0.75);
  update(builder.get());
  snapshot();
  updateRaw(folly::dynamic::object("opacity", 0.25));
  auto& props = snapshot();
  ASSERT_NE(props.props, nullptr);
  EXPECT_FLOAT_EQ(props.props->opacity, 0.75);
  EXPECT_TRUE(props.propNames.contains(OPACITY));
  EXPECT_EQ((*props.rawProps)["opacity"], 0.25);
}

TEST_F(AnimatedPropsRegistryTest, mergesTypedUpdatesAcrossCommits) {
  AnimatedPropsBuilder builder;
  builder.setOpacity(0.75);
  builder.setShadowRadius(2);
  update(builder.get());
  snapshot();
  builder.setOpacity(0.5);
  update(builder.get());
  auto& props = snapshot();
  ASSERT_NE(props.props, nullptr);
  EXPECT_FLOAT_EQ(props.props->opacity, 0.5);
  EXPECT_FLOAT_EQ(props.props->shadowRadius, 2);
  EXPECT_EQ(props.propNames.size(), 2u);
}

TEST_F(AnimatedPropsRegistryTest, jsiRawPropsAreConverted) {
  auto runtime = hermes::makeHermesRuntime();
  {
    auto object = jsi::Object(*runtime);
    object.setProperty(*runtime, "opacity", 0.25);
    update(
        {.props = {},
         .rawProps = std::make_unique<RawProps>(
             *runtime, jsi::Value(*runtime, object))});
    object.setProperty(*runtime, "opacity", 0.5);
    update(
        {.props = {},
         .rawProps = std::make_unique<RawProps>(
             *runtime, jsi::Value(*runtime, object))});
  }
  runtime.reset();
  expectRawProps(folly::dynamic::object("opacity", 0.5));
  EXPECT_EQ(snapshot().props, nullptr);
}

TEST_F(AnimatedPropsRegistryTest, stoppedSurfacesIgnoreUpdates) {
  registry.clearOnSurfaceStop(1);
  updateRaw(folly::dynamic::object("opacity", 0.5));
  registry.initializeSurface(1);
  EXPECT_TRUE(registry.getMap(1).second.empty());
}

} // namespace facebook::react
