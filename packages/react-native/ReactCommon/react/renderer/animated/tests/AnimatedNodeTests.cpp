/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/animated/internal/NativeAnimatedAllowlist.h>
#include <react/renderer/animated/nodes/ColorAnimatedNode.h>
#include <react/renderer/animated/nodes/ObjectAnimatedNode.h>
#include <react/renderer/core/ReactRootViewTagGenerator.h>
#include <react/renderer/graphics/Color.h>

namespace facebook::react {

class AnimatedNodeTests : public AnimationTestsBase {};

TEST_F(AnimatedNodeTests, setAnimatedNodeValue) {
  initNodesManager();

  auto rootTag = getNextRootViewTag();
  auto animatedNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      animatedNodeTag,
      folly::dynamic::object("type", "value")("value", 0)("offset", 5));
  EXPECT_EQ(nodeNeedsUpdate(animatedNodeTag), true);

  runAnimationFrame(0);
  EXPECT_EQ(nodeNeedsUpdate(animatedNodeTag), false);

  nodesManager_->setAnimatedNodeValue(animatedNodeTag, 100);
  // ValueAnimatedNode will immediately update value, before Animated updates
  // dirtied nodes at next frame
  EXPECT_EQ(nodesManager_->getValue(animatedNodeTag), 105);

  EXPECT_EQ(nodeNeedsUpdate(animatedNodeTag), true);

  runAnimationFrame(0);
  EXPECT_EQ(nodeNeedsUpdate(animatedNodeTag), false);

  nodesManager_->dropAnimatedNode(animatedNodeTag);
}

TEST_F(AnimatedNodeTests, updatePropsNode) {
  initNodesManager();

  // Step 1: Build the Nodes graph
  auto rootTag = getNextRootViewTag();

  // Create ColorNode
  auto rTag = ++rootTag;
  auto gTag = ++rootTag;
  auto bTag = ++rootTag;
  auto aTag = ++rootTag;
  auto colorNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      rTag, folly::dynamic::object("type", "value")("value", 0)("offset", 0));
  nodesManager_->createAnimatedNode(
      gTag, folly::dynamic::object("type", "value")("value", 255)("offset", 0));
  nodesManager_->createAnimatedNode(
      bTag, folly::dynamic::object("type", "value")("value", 0)("offset", 0));
  nodesManager_->createAnimatedNode(
      aTag, folly::dynamic::object("type", "value")("value", 0.5)("offset", 0));
  nodesManager_->createAnimatedNode(
      colorNodeTag,
      folly::dynamic::object("type", "color")("r", rTag)("g", gTag)("b", bTag)(
          "a", aTag));
  nodesManager_->connectAnimatedNodes(rTag, colorNodeTag);
  nodesManager_->connectAnimatedNodes(gTag, colorNodeTag);
  nodesManager_->connectAnimatedNodes(bTag, colorNodeTag);
  nodesManager_->connectAnimatedNodes(aTag, colorNodeTag);

  // Create opacity ValueNode
  auto opacityNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      opacityNodeTag,
      folly::dynamic::object("type", "value")("value", 0.8f)("offset", 0));

  // Create StyleNode
  auto styleNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      styleNodeTag,
      folly::dynamic::object("type", "style")(
          "style",
          folly::dynamic::object("backgroundColor", colorNodeTag)(
              "opacity", opacityNodeTag)));

  nodesManager_->connectAnimatedNodes(colorNodeTag, styleNodeTag);
  nodesManager_->connectAnimatedNodes(opacityNodeTag, styleNodeTag);

  // Create PropsNode
  auto propsNodeTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      propsNodeTag,
      folly::dynamic::object("type", "props")(
          "props", folly::dynamic::object("style", styleNodeTag)));
  nodesManager_->connectAnimatedNodes(styleNodeTag, propsNodeTag);

  // Connect PropsNode to View
  auto viewTag = ++rootTag;
  nodesManager_->connectAnimatedNodeToView(propsNodeTag, viewTag);

  runAnimationFrame(0);

  // Step 2: Update backgroundColor
  {
    nodesManager_->setAnimatedNodeValue(bTag, 100);
    nodesManager_->setAnimatedNodeValue(aTag, 0.3);

    // Confirm the nodes graph is correctly marked dirty
    EXPECT_EQ(nodeNeedsUpdate(rTag), false);
    EXPECT_EQ(nodeNeedsUpdate(gTag), false);
    EXPECT_EQ(nodeNeedsUpdate(bTag), true);
    EXPECT_EQ(nodeNeedsUpdate(aTag), true);
    EXPECT_EQ(nodeNeedsUpdate(opacityNodeTag), false);
    // connected style/prop nodes are not marked dirty but they will be updated
    // at next render
    EXPECT_EQ(nodeNeedsUpdate(styleNodeTag), false);
    EXPECT_EQ(nodeNeedsUpdate(propsNodeTag), false);

    // Flush changes
    runAnimationFrame(0);

    // Check props commit done via MountingManager
    auto color =
        static_cast<Color>(lastCommittedProps["backgroundColor"].asInt());
    EXPECT_EQ(redFromColor({color}), 0);
    EXPECT_EQ(greenFromColor({color}), 255);
    EXPECT_EQ(blueFromColor({color}), 100);
    EXPECT_EQ(alphaFromColor({color}), static_cast<uint8_t>(0.3 * 255));
    EXPECT_EQ(lastUpdatedNodeTag, viewTag);
  }

  // Step 3: Update opacity
  {
    nodesManager_->setAnimatedNodeValue(opacityNodeTag, 0.1f);

    // Confirm the nodes graph is correctly marked dirty
    EXPECT_EQ(nodeNeedsUpdate(rTag), false);
    EXPECT_EQ(nodeNeedsUpdate(gTag), false);
    EXPECT_EQ(nodeNeedsUpdate(bTag), false);
    EXPECT_EQ(nodeNeedsUpdate(aTag), false);
    EXPECT_EQ(nodeNeedsUpdate(opacityNodeTag), true);
    // connected style/prop nodes are not marked dirty but they will be updated
    // at next render
    EXPECT_EQ(nodeNeedsUpdate(styleNodeTag), false);
    EXPECT_EQ(nodeNeedsUpdate(propsNodeTag), false);

    // Flush changes
    runAnimationFrame(0);

    // Check props commit done via MountingManager
    EXPECT_EQ(lastCommittedProps["opacity"], 0.1f);
    EXPECT_EQ(lastUpdatedNodeTag, viewTag);
  }
}

TEST_F(AnimatedNodeTests, ModulusAnimatedNode) {
  initNodesManager();

  auto rootTag = getNextRootViewTag();

  auto valueTag = ++rootTag;
  auto moduloTag = ++rootTag;

  nodesManager_->createAnimatedNode(
      valueTag,
      folly::dynamic::object("type", "value")("value", 0)("offset", 1));
  nodesManager_->createAnimatedNode(
      moduloTag,
      folly::dynamic::object("type", "modulus")("input", valueTag)(
          "modulus", 3.1));
  nodesManager_->connectAnimatedNodes(valueTag, moduloTag);

  runAnimationFrame(0);

  nodesManager_->setAnimatedNodeValue(valueTag, 4.1);

  runAnimationFrame(0);

  EXPECT_EQ(nodesManager_->getValue(valueTag), 5.1);
  EXPECT_EQ(nodesManager_->getValue(moduloTag), std::fmod(5.1, 3.1));

  nodesManager_->setAnimatedNodeValue(valueTag, 7.6);

  runAnimationFrame(0);

  EXPECT_EQ(nodesManager_->getValue(valueTag), 8.6);
  EXPECT_EQ(nodesManager_->getValue(moduloTag), std::fmod(8.6, 3.1));
}

TEST_F(AnimatedNodeTests, DiffClampAnimatedNode) {
  initNodesManager();

  auto rootTag = getNextRootViewTag();

  auto valueTag = ++rootTag;
  auto diffClampTag = ++rootTag;

  nodesManager_->createAnimatedNode(
      valueTag,
      folly::dynamic::object("type", "value")("value", 4)("offset", 0));
  nodesManager_->createAnimatedNode(
      diffClampTag,
      folly::dynamic::object("type", "diffclamp")("input", valueTag)("min", 1)(
          "max", 2));
  nodesManager_->connectAnimatedNodes(valueTag, diffClampTag);

  runAnimationFrame(0);
  EXPECT_EQ(nodesManager_->getValue(diffClampTag), 2);

  nodesManager_->setAnimatedNodeValue(valueTag, 2);
  runAnimationFrame(0);
  EXPECT_EQ(nodesManager_->getValue(diffClampTag), 1);
}

TEST_F(AnimatedNodeTests, RoundAnimatedNodeUsesNearestConfigKey) {
  // This test verifies that RoundAnimatedNode reads the "nearest" config key
  // for the rounding factor, not the "input" key.
  initNodesManager();

  auto rootTag = getNextRootViewTag();

  auto valueTag = ++rootTag;
  auto roundTag = ++rootTag;

  nodesManager_->createAnimatedNode(
      valueTag,
      folly::dynamic::object("type", "value")("value", 7.3)("offset", 0));

  // The round node should read "nearest" for the rounding factor (5.0),
  // not "input" (which is the valueTag integer).
  nodesManager_->createAnimatedNode(
      roundTag,
      folly::dynamic::object("type", "round")("input", valueTag)(
          "nearest", 5.0));
  nodesManager_->connectAnimatedNodes(valueTag, roundTag);

  runAnimationFrame(0);

  // 7.3 rounded to nearest 5.0 should be 5.0 (since round(7.3/5) * 5 = 1 * 5)
  // If the bug existed (reading "input" instead of "nearest"), it would use
  // the valueTag as the rounding factor, giving incorrect results.
  EXPECT_DOUBLE_EQ(nodesManager_->getValue(roundTag).value(), 5.0);

  // Test another value to ensure rounding works correctly
  nodesManager_->setAnimatedNodeValue(valueTag, 12.6);
  runAnimationFrame(0);

  // 12.6 rounded to nearest 5.0 should be 15.0 (since round(12.6/5) * 5 = 3 *
  // 5)
  EXPECT_DOUBLE_EQ(nodesManager_->getValue(roundTag).value(), 15.0);
}

TEST_F(AnimatedNodeTests, SetOffsetReturnsFalseWhenUnchanged) {
  // This test verifies that setAnimatedNodeOffset doesn't trigger unnecessary
  // updates when the offset value hasn't changed.
  initNodesManager();

  auto rootTag = getNextRootViewTag();
  auto valueTag = ++rootTag;

  nodesManager_->createAnimatedNode(
      valueTag,
      folly::dynamic::object("type", "value")("value", 10)("offset", 0));

  runAnimationFrame(0);
  EXPECT_EQ(nodeNeedsUpdate(valueTag), false);

  // First setOffset should mark the node as needing update
  nodesManager_->setAnimatedNodeOffset(valueTag, 5);
  EXPECT_EQ(nodeNeedsUpdate(valueTag), true);
  EXPECT_EQ(nodesManager_->getValue(valueTag), 15); // 10 + 5

  runAnimationFrame(0);
  EXPECT_EQ(nodeNeedsUpdate(valueTag), false);

  // Setting the same offset again should NOT mark the node as needing update
  nodesManager_->setAnimatedNodeOffset(valueTag, 5);
  EXPECT_EQ(nodeNeedsUpdate(valueTag), false); // No change, no update needed
  EXPECT_EQ(nodesManager_->getValue(valueTag), 15); // Still 10 + 5
}

TEST_F(AnimatedNodeTests, ObjectAnimatedNode) {
  initNodesManager();

  auto rootTag = getNextRootViewTag();

  auto valueTag = ++rootTag;
  auto objectTag = ++rootTag;
  nodesManager_->createAnimatedNode(
      valueTag,
      folly::dynamic::object("type", "value")("value", 4)("offset", 0));

  nodesManager_->createAnimatedNode(
      objectTag,
      folly::dynamic::object("type", "object")(
          "value",
          folly::dynamic::array(
              folly::dynamic::object(
                  "translate3d",
                  folly::dynamic::object("x", 1)("y", 0)("z", 0)),
              folly::dynamic::object(
                  "rotate3d",
                  folly::dynamic::object("x", 1)("y", 0)("z", 0)(
                      "angle", "180deg")),
              folly::dynamic::object(
                  "scale3d", folly::dynamic::object("nodeTag", valueTag)))));

  nodesManager_->connectAnimatedNodes(valueTag, objectTag);

  const auto objectNode =
      nodesManager_->getAnimatedNode<ObjectAnimatedNode>(objectTag);
  folly::dynamic collectedProps = folly::dynamic::object();
  objectNode->collectViewUpdates("test", collectedProps);

  const auto expected = folly::dynamic::object(
      "test",
      folly::dynamic::array(
          folly::dynamic::object(
              "translate3d", folly::dynamic::object("x", 1)("y", 0)("z", 0)),
          folly::dynamic::object(
              "rotate3d",
              folly::dynamic::object("x", 1)("y", 0)("z", 0)(
                  "angle", "180deg")),
          folly::dynamic::object("scale3d", 4)));
  EXPECT_EQ(collectedProps["test"].size(), 3);
  EXPECT_EQ(collectedProps["test"][0]["translate3d"]["x"], 1);
  EXPECT_EQ(collectedProps["test"][1]["rotate3d"]["y"], 0);
  EXPECT_EQ(collectedProps["test"][1]["rotate3d"]["angle"], "180deg");
  EXPECT_EQ(collectedProps["test"][2]["scale3d"], 4);
}

// Styles that Animated supports and that do not participate in layout must be
// direct-manipulation eligible; anything absent from this set is treated as a
// layout update by StyleAnimatedNode and forced through a Fabric commit.
// Keep in sync with SUPPORTED_STYLES in
// packages/react-native/Libraries/Animated/NativeAnimatedAllowlist.js.
TEST_F(AnimatedNodeTests, directManipulationAllowlistCoversNonLayoutStyles) {
  const auto& allowlist = getDirectManipulationAllowlist();

  for (const auto& style :
       {"backgroundColor",
        "borderBottomColor",
        "borderColor",
        "borderEndColor",
        "borderLeftColor",
        "borderRightColor",
        "borderStartColor",
        "borderTopColor",
        "color",
        "tintColor",
        "borderBottomEndRadius",
        "borderBottomLeftRadius",
        "borderBottomRightRadius",
        "borderBottomStartRadius",
        "borderEndEndRadius",
        "borderEndStartRadius",
        "borderRadius",
        "borderTopEndRadius",
        "borderTopLeftRadius",
        "borderTopRightRadius",
        "borderTopStartRadius",
        "borderStartEndRadius",
        "borderStartStartRadius",
        "elevation",
        "opacity",
        "filter",
        "transform",
        "zIndex",
        "shadowOpacity",
        "shadowRadius",
        "scaleX",
        "scaleY",
        "translateX",
        "translateY"}) {
    EXPECT_EQ(allowlist.count(style), 1u)
        << style
        << " is animatable and does not affect layout, so it must be "
           "direct-manipulation eligible";
  }

  // Layout styles must stay out, so they keep going through Fabric.
  for (const auto& style :
       {"width", "height", "margin", "padding", "flex", "top", "gap"}) {
    EXPECT_EQ(allowlist.count(style), 0u)
        << style << " affects layout and must not be direct-manipulated";
  }
}

} // namespace facebook::react
