/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/core/ReactRootViewTagGenerator.h>

namespace facebook::react {

// Pins the getManagedProps / hasManagedProps seam re-merged by
// AnimatedMountingOverrideDelegate to prevent the useNativeDriver mount flash.
class ManagedPropsMountingOverrideTests : public AnimationTestsBase {
 protected:
  struct OpacityGraph {
    Tag opacityTag;
    Tag styleTag;
    Tag propsTag;
    Tag viewTag;
  };

  // value -> style -> props graph for an animated opacity; view left
  // unconnected.
  OpacityGraph buildOpacityGraph(float initialOpacity) {
    const auto opacityTag = ++rootTag_;
    nodesManager_->createAnimatedNode(
        opacityTag,
        folly::dynamic::object("type", "value")("value", initialOpacity)(
            "offset", 0));

    const auto styleTag = ++rootTag_;
    nodesManager_->createAnimatedNode(
        styleTag,
        folly::dynamic::object("type", "style")(
            "style", folly::dynamic::object("opacity", opacityTag)));
    nodesManager_->connectAnimatedNodes(opacityTag, styleTag);

    const auto propsTag = ++rootTag_;
    nodesManager_->createAnimatedNode(
        propsTag,
        folly::dynamic::object("type", "props")(
            "props", folly::dynamic::object("style", styleTag)));
    nodesManager_->connectAnimatedNodes(styleTag, propsTag);

    const auto viewTag = ++rootTag_;
    return OpacityGraph{
        .opacityTag = opacityTag,
        .styleTag = styleTag,
        .propsTag = propsTag,
        .viewTag = viewTag};
  }

  Tag rootTag_{getNextRootViewTag()};
};

TEST_F(
    ManagedPropsMountingOverrideTests,
    getManagedPropsNullForUnconnectedView) {
  initNodesManager();

  const auto unknownTag = ++rootTag_;
  EXPECT_TRUE(nodesManager_->getManagedProps(unknownTag).isNull());
  EXPECT_FALSE(nodesManager_->hasManagedProps());
}

// Managed props mirror the live committed value every frame, never the frozen
// start value nor the 1.0 default.
TEST_F(
    ManagedPropsMountingOverrideTests,
    getManagedPropsReflectsLiveValueAcrossFrames) {
  initNodesManager();

  auto g = buildOpacityGraph(/*initialOpacity=*/0.0f);
  nodesManager_->connectAnimatedNodeToView(g.propsTag, g.viewTag);

  const auto frames = folly::dynamic::array(0.0f, 0.25f, 0.5f, 0.75f, 1.0f);
  nodesManager_->startAnimatingNode(
      /*animationId=*/1,
      g.opacityTag,
      folly::dynamic::object("type", "frames")("frames", frames)(
          "toValue", 1.0f),
      std::nullopt);

  const double startTimeInTick = 1000;
  for (int frame = 0; frame <= 4; ++frame) {
    runAnimationFrame(startTimeInTick + frame * SingleFrameIntervalMs);

    auto props = nodesManager_->getManagedProps(g.viewTag);
    ASSERT_FALSE(props.isNull());
    ASSERT_TRUE(props.isObject());
    ASSERT_EQ(props.count("opacity"), 1u);

    const double live = nodesManager_->getValue(g.opacityTag).value();
    EXPECT_DOUBLE_EQ(props["opacity"].asDouble(), live);

    if (frame == 0) {
      EXPECT_DOUBLE_EQ(live, 0.0);
    }
  }

  EXPECT_DOUBLE_EQ(nodesManager_->getValue(g.opacityTag).value(), 1.0);
  auto finalProps = nodesManager_->getManagedProps(g.viewTag);
  ASSERT_EQ(finalProps.count("opacity"), 1u);
  EXPECT_DOUBLE_EQ(finalProps["opacity"].asDouble(), 1.0);
}

// Without the connect-time seed props_ is empty at connect, so the override has
// nothing to merge: the opacity assertion fails pre-hardening, passes post.
TEST_F(
    ManagedPropsMountingOverrideTests,
    getManagedPropsLiveImmediatelyOnConnect) {
  initNodesManager();

  auto g = buildOpacityGraph(/*initialOpacity=*/0.8f);
  nodesManager_->connectAnimatedNodeToView(g.propsTag, g.viewTag);
  // No runAnimationFrame: the value must be live the instant the view is
  // managed.

  auto props = nodesManager_->getManagedProps(g.viewTag);
  EXPECT_FALSE(props.isNull());
  ASSERT_TRUE(props.isObject());
  ASSERT_EQ(props.count("opacity"), 1u);
  EXPECT_DOUBLE_EQ(props["opacity"].asDouble(), static_cast<double>(0.8f));
}

// A brand-new view connected to an already mid-flight shared value, with no
// frame in between: fails pre-hardening, passes post.
TEST_F(
    ManagedPropsMountingOverrideTests,
    getManagedPropsLiveOnConnectWhileValueMidFlight) {
  initNodesManager();

  auto g = buildOpacityGraph(/*initialOpacity=*/0.0f);
  nodesManager_->connectAnimatedNodeToView(g.propsTag, g.viewTag);

  const auto frames = folly::dynamic::array(0.0f, 0.25f, 0.5f, 0.75f, 1.0f);
  nodesManager_->startAnimatingNode(
      /*animationId=*/1,
      g.opacityTag,
      folly::dynamic::object("type", "frames")("frames", frames)(
          "toValue", 1.0f),
      std::nullopt);
  runAnimationFrame(1000);
  runAnimationFrame(1000 + 2 * SingleFrameIntervalMs);

  const double live = nodesManager_->getValue(g.opacityTag).value();
  ASSERT_GT(live, 0.0);
  ASSERT_LT(live, 1.0);

  const auto styleTag2 = ++rootTag_;
  nodesManager_->createAnimatedNode(
      styleTag2,
      folly::dynamic::object("type", "style")(
          "style", folly::dynamic::object("opacity", g.opacityTag)));
  nodesManager_->connectAnimatedNodes(g.opacityTag, styleTag2);
  const auto propsTag2 = ++rootTag_;
  nodesManager_->createAnimatedNode(
      propsTag2,
      folly::dynamic::object("type", "props")(
          "props", folly::dynamic::object("style", styleTag2)));
  nodesManager_->connectAnimatedNodes(styleTag2, propsTag2);
  const auto viewTag2 = ++rootTag_;
  nodesManager_->connectAnimatedNodeToView(propsTag2, viewTag2);

  auto props = nodesManager_->getManagedProps(viewTag2);
  EXPECT_FALSE(props.isNull());
  ASSERT_EQ(props.count("opacity"), 1u);
  EXPECT_DOUBLE_EQ(props["opacity"].asDouble(), live);
}

TEST_F(
    ManagedPropsMountingOverrideTests,
    hasManagedPropsTracksConnectAndDisconnect) {
  initNodesManager();

  auto g = buildOpacityGraph(/*initialOpacity=*/0.5f);

  EXPECT_FALSE(nodesManager_->hasManagedProps());
  EXPECT_TRUE(nodesManager_->getManagedProps(g.viewTag).isNull());

  nodesManager_->connectAnimatedNodeToView(g.propsTag, g.viewTag);
  EXPECT_TRUE(nodesManager_->hasManagedProps());
  EXPECT_FALSE(nodesManager_->getManagedProps(g.viewTag).isNull());

  nodesManager_->disconnectAnimatedNodeFromView(g.propsTag, g.viewTag);
  EXPECT_FALSE(nodesManager_->hasManagedProps());
  EXPECT_TRUE(nodesManager_->getManagedProps(g.viewTag).isNull());
}

TEST_F(ManagedPropsMountingOverrideTests, getManagedPropsIsolatedPerView) {
  initNodesManager();

  auto g = buildOpacityGraph(/*initialOpacity=*/0.3f);
  nodesManager_->connectAnimatedNodeToView(g.propsTag, g.viewTag);

  EXPECT_FALSE(nodesManager_->getManagedProps(g.viewTag).isNull());
  EXPECT_TRUE(nodesManager_->getManagedProps(g.viewTag + 1000).isNull());
}

} // namespace facebook::react
