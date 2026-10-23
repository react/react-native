/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <folly/dynamic.h>
#include <gtest/gtest.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/uimanager/SynchronousTransformOverlay.h>

namespace facebook::react {

class SynchronousTransformOverlayTest : public ::testing::Test {
 protected:
  SynchronousTransformOverlayTest()
      : contextContainer_(std::make_shared<ContextContainer>()),
        propsParserContext_(-1, *contextContainer_) {
    auto builder = simpleComponentBuilder();
    // clang-format off
    auto element =
      Element<ViewShadowNode>()
        .tag(1)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.size = {.width=1000, .height=1000};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
        .children({
          Element<ViewShadowNode>()
          .tag(2)
          .finalize([](ViewShadowNode &shadowNode){
            auto layoutMetrics = EmptyLayoutMetrics;
            layoutMetrics.frame.origin = {.x=10, .y=20};
            layoutMetrics.frame.size = {.width=100, .height=200};
            shadowNode.setLayoutMetrics(layoutMetrics);
          })
          .props([] {
            auto sharedProps = std::make_shared<ViewProps>();
            sharedProps->transform = Transform::Translate(5, 5, 0);
            return sharedProps;
          })
          .reference(childShadowNode_)
      });
    // clang-format on
    rootShadowNode_ = builder.build(element);
  }

  std::shared_ptr<const ContextContainer> contextContainer_;
  PropsParserContext propsParserContext_;
  std::shared_ptr<ViewShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> childShadowNode_;
  SynchronousTransformOverlay overlay_;
};

TEST_F(SynchronousTransformOverlayTest, isEmptyWithoutTransforms) {
  EXPECT_TRUE(overlay_.isEmpty());
  EXPECT_FALSE(overlay_.getTransformOverride(*childShadowNode_).has_value());

  // Props without a transform are ignored.
  overlay_.update(
      2, folly::dynamic::object("opacity", 0.5), propsParserContext_);
  EXPECT_TRUE(overlay_.isEmpty());
  EXPECT_FALSE(overlay_.getTransformOverride(*childShadowNode_).has_value());
}

TEST_F(SynchronousTransformOverlayTest, parsesTransformLikeProps) {
  overlay_.update(
      2,
      folly::dynamic::object(
          "transform",
          folly::dynamic::array(folly::dynamic::object("translateX", 100))),
      propsParserContext_);

  EXPECT_FALSE(overlay_.isEmpty());

  auto transform = overlay_.getTransformOverride(*childShadowNode_);
  ASSERT_TRUE(transform.has_value());
  EXPECT_EQ(*transform, Transform::Translate(100, 0, 0));

  // Nodes without an entry are not overridden.
  EXPECT_FALSE(overlay_.getTransformOverride(*rootShadowNode_).has_value());

  // The resolved transform is relative to the node's own frame: the
  // percentage is resolved against the committed layout metrics, like
  // `ConcreteViewShadowNode::getTransform` does.
  overlay_.update(
      2,
      folly::dynamic::object(
          "transform",
          folly::dynamic::array(folly::dynamic::object("translateY", "50%"))),
      propsParserContext_);
  transform = overlay_.getTransformOverride(*childShadowNode_);
  ASSERT_TRUE(transform.has_value());
  EXPECT_EQ(*transform, Transform::Translate(0, 100, 0));
}

TEST_F(SynchronousTransformOverlayTest, mergesTransformOriginUpdates) {
  // The committed props have no transform origin; a synchronous update of
  // the origin alone applies to the committed transform (5, 5).
  overlay_.update(
      2,
      folly::dynamic::object("transformOrigin", folly::dynamic::array(0, 0, 0)),
      propsParserContext_);
  auto transform = overlay_.getTransformOverride(*childShadowNode_);
  ASSERT_TRUE(transform.has_value());
  EXPECT_EQ(*transform, Transform::Translate(5, 5, 0));

  // A later transform update keeps the previously written origin.
  overlay_.update(
      2,
      folly::dynamic::object(
          "transform",
          folly::dynamic::array(folly::dynamic::object("scale", 2))),
      propsParserContext_);
  transform = overlay_.getTransformOverride(*childShadowNode_);
  ASSERT_TRUE(transform.has_value());
  // Scaling around the top-left corner (origin 0, 0) rather than the center.
  auto expected = BaseViewProps::resolveTransform(
      Size{.width = 100, .height = 200},
      Transform::Scale(2, 2, 1),
      TransformOrigin{
          .xy = {ValueUnit(0, UnitType::Point), ValueUnit(0, UnitType::Point)},
          .z = 0});
  EXPECT_EQ(*transform, expected);
}

TEST_F(SynchronousTransformOverlayTest, removesAndPrunesEntries) {
  overlay_.update(
      2,
      folly::dynamic::object(
          "transform",
          folly::dynamic::array(folly::dynamic::object("translateX", 100))),
      propsParserContext_);
  overlay_.update(
      3,
      folly::dynamic::object(
          "transform",
          folly::dynamic::array(folly::dynamic::object("translateX", 100))),
      propsParserContext_);

  overlay_.remove(3);
  EXPECT_FALSE(overlay_.isEmpty());
  EXPECT_TRUE(overlay_.getTransformOverride(*childShadowNode_).has_value());

  // Pruning only keeps the tags reported as alive.
  overlay_.prune([](Tag tag) { return tag != 2; });
  EXPECT_TRUE(overlay_.isEmpty());
  EXPECT_FALSE(overlay_.getTransformOverride(*childShadowNode_).has_value());

  overlay_.update(
      2,
      folly::dynamic::object(
          "transform",
          folly::dynamic::array(folly::dynamic::object("translateX", 100))),
      propsParserContext_);
  overlay_.clear();
  EXPECT_TRUE(overlay_.isEmpty());
}

TEST_F(SynchronousTransformOverlayTest, needsPruningOnceEnoughEntriesExist) {
  EXPECT_FALSE(overlay_.needsPruning());
  for (Tag tag = 1; tag <= 64; tag++) {
    overlay_.update(
        tag,
        folly::dynamic::object(
            "transform",
            folly::dynamic::array(folly::dynamic::object("translateX", 1))),
        propsParserContext_);
  }
  EXPECT_TRUE(overlay_.needsPruning());

  // Everything is still alive: the threshold doubles so that a steady set of
  // animated views does not trigger a tree walk on every commit.
  overlay_.prune([](Tag /*tag*/) { return true; });
  EXPECT_FALSE(overlay_.needsPruning());
}

} // namespace facebook::react
