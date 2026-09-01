/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationTestsBase.h"

#include <react/renderer/core/ReactRootViewTagGenerator.h>
#include <react/renderer/graphics/HostPlatformColor.h>

#include <utility>

namespace facebook::react {

class InterpolationAnimatedNodeTest : public AnimationTestsBase {
 protected:
  void SetUp() override {
    initNodesManager();
    nextTag_ = getNextRootViewTag();
  }

  Tag createValueNode(double value) {
    const auto tag = ++nextTag_;
    nodesManager_->createAnimatedNode(
        tag,
        folly::dynamic::object("type", "value")("value", value)("offset", 0));
    return tag;
  }

  Tag createInterpolationNode(
      Tag parentTag,
      folly::dynamic outputRange,
      folly::dynamic inputRange = folly::dynamic::array(0, 10),
      folly::dynamic extraConfig = folly::dynamic::object()) {
    const auto tag = ++nextTag_;
    folly::dynamic config = folly::dynamic::object("type", "interpolation")(
        "inputRange", std::move(inputRange))(
        "outputRange", std::move(outputRange))("extrapolateLeft", "extend")(
        "extrapolateRight", "extend")("outputType", "");
    for (const auto& item : extraConfig.items()) {
      config[item.first] = item.second;
    }
    nodesManager_->createAnimatedNode(tag, config);
    nodesManager_->connectAnimatedNodes(parentTag, tag);
    return tag;
  }

  double valueFor(Tag tag) {
    auto value = nodesManager_->getValue(tag);
    EXPECT_TRUE(value.has_value());
    return value.value_or(0);
  }

 private:
  Tag nextTag_{};
};

TEST_F(InterpolationAnimatedNodeTest, testUpdateAppliesPiecewiseNumericRange) {
  const auto inputTag = createValueNode(15);
  const auto interpolationTag = createInterpolationNode(
      inputTag,
      folly::dynamic::array(0, 100, 120),
      folly::dynamic::array(0, 10, 20));

  runAnimationFrame(0);

  EXPECT_DOUBLE_EQ(valueFor(interpolationTag), 110);

  nodesManager_->setAnimatedNodeValue(inputTag, 5);
  runAnimationFrame(0);

  EXPECT_DOUBLE_EQ(valueFor(interpolationTag), 50);
}

TEST_F(
    InterpolationAnimatedNodeTest,
    testUpdateAppliesEasingStopsOnlyWithinInputRange) {
  const auto inputTag = createValueNode(5);
  const auto interpolationTag = createInterpolationNode(
      inputTag,
      folly::dynamic::array(0, 100),
      folly::dynamic::array(0, 10),
      folly::dynamic::object(
          "easingStops",
          folly::dynamic::array(
              folly::dynamic::array(0, 0),
              folly::dynamic::array(0.5, 0.8),
              folly::dynamic::array(1, 1))));

  runAnimationFrame(0);

  EXPECT_DOUBLE_EQ(valueFor(interpolationTag), 80);

  nodesManager_->setAnimatedNodeValue(inputTag, 15);
  runAnimationFrame(0);

  EXPECT_DOUBLE_EQ(valueFor(interpolationTag), 150);
}

TEST_F(InterpolationAnimatedNodeTest, testUpdateInterpolatesColorChannels) {
  const int32_t startColor = hostPlatformColorFromRGBA(10, 20, 30, 40);
  const int32_t endColor = hostPlatformColorFromRGBA(110, 220, 130, 140);
  const auto expectedColor = hostPlatformColorFromRGBA(60, 120, 80, 90);
  const auto inputTag = createValueNode(5);
  const auto interpolationTag = createInterpolationNode(
      inputTag,
      folly::dynamic::array(
          static_cast<int64_t>(startColor), static_cast<int64_t>(endColor)),
      folly::dynamic::array(0, 10),
      folly::dynamic::object("outputType", "color"));

  runAnimationFrame(0);

  EXPECT_EQ(
      static_cast<int32_t>(valueFor(interpolationTag)),
      static_cast<int32_t>(expectedColor));
}

TEST_F(InterpolationAnimatedNodeTest, testDisconnectStopsParentValueUpdates) {
  const auto inputTag = createValueNode(5);
  const auto interpolationTag =
      createInterpolationNode(inputTag, folly::dynamic::array(0, 100));

  runAnimationFrame(0);
  EXPECT_DOUBLE_EQ(valueFor(interpolationTag), 50);

  nodesManager_->disconnectAnimatedNodes(inputTag, interpolationTag);
  nodesManager_->setAnimatedNodeValue(inputTag, 9);
  runAnimationFrame(0);

  EXPECT_DOUBLE_EQ(valueFor(interpolationTag), 50);
}

} // namespace facebook::react
