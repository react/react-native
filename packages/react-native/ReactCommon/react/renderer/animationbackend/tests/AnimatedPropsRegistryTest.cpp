/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/animationbackend/AnimatedProps.h>
#include <react/renderer/animationbackend/AnimatedPropsRegistry.h>

#include <thread>
#include <vector>

using namespace facebook::react;

class AnimatedPropsRegistryTest : public ::testing::Test {
 protected:
  void SetUp() override {
    registry_ = std::make_unique<AnimatedPropsRegistry>();
  }

  void TearDown() override {
    registry_.reset();
  }

  std::unordered_map<SurfaceId, SurfaceUpdates> createSurfaceUpdates(
      SurfaceId surfaceId,
      Tag tag,
      std::vector<std::unique_ptr<AnimatedPropBase>> props) {
    std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates;
    SurfaceUpdates updates;

    AnimatedProps animatedProps;
    animatedProps.props = std::move(props);
    updates.propsMap[tag] = std::move(animatedProps);

    surfaceUpdates[surfaceId] = std::move(updates);
    return surfaceUpdates;
  }

  std::unique_ptr<AnimatedPropsRegistry> registry_;
  SurfaceId surfaceId_{1};
  Tag testTag_{100};
};

// ============================================================================
// Update Flow - Pending Accumulation
// ============================================================================

TEST_F(AnimatedPropsRegistryTest, accumulatesUpdatesInPendingMap) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props1;
  props1.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates1 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props1));
  registry_->update(updates1);

  std::vector<std::unique_ptr<AnimatedPropBase>> props2;
  props2.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_OPACITY, 0.3f));
  auto updates2 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props2));
  registry_->update(updates2);

  auto [families, map] = registry_->getMap(surfaceId_);

  ASSERT_TRUE(map.contains(testTag_));
  auto& snapshot = map.at(testTag_);

  EXPECT_TRUE(snapshot->propNames.contains(OPACITY));
  EXPECT_TRUE(snapshot->propNames.contains(SHADOW_OPACITY));
  EXPECT_FLOAT_EQ(snapshot->props.opacity, 0.5f);
  EXPECT_FLOAT_EQ(snapshot->props.shadowOpacity, 0.3f);
}

TEST_F(AnimatedPropsRegistryTest, multipleTagsAccumulateIndependently) {
  Tag tag1 = 101;
  Tag tag2 = 102;

  std::vector<std::unique_ptr<AnimatedPropBase>> props1;
  props1.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates1 = createSurfaceUpdates(surfaceId_, tag1, std::move(props1));
  registry_->update(updates1);

  std::vector<std::unique_ptr<AnimatedPropBase>> props2;
  props2.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.8f));
  auto updates2 = createSurfaceUpdates(surfaceId_, tag2, std::move(props2));
  registry_->update(updates2);

  auto [families, map] = registry_->getMap(surfaceId_);

  ASSERT_TRUE(map.contains(tag1));
  ASSERT_TRUE(map.contains(tag2));
  EXPECT_FLOAT_EQ(map.at(tag1)->props.opacity, 0.5f);
  EXPECT_FLOAT_EQ(map.at(tag2)->props.opacity, 0.8f);
}

// ============================================================================
// GetMap Flow - Pending to Merged
// ============================================================================

TEST_F(AnimatedPropsRegistryTest, mergesPendingIntoMapOnGetMap) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props1;
  props1.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates1 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props1));
  registry_->update(updates1);

  auto [families1, map1] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map1.contains(testTag_));
  EXPECT_FLOAT_EQ(map1.at(testTag_)->props.opacity, 0.5f);

  std::vector<std::unique_ptr<AnimatedPropBase>> props2;
  props2.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_RADIUS, 10.0f));
  auto updates2 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props2));
  registry_->update(updates2);

  auto [families2, map2] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map2.contains(testTag_));
  EXPECT_FLOAT_EQ(map2.at(testTag_)->props.opacity, 0.5f);
  EXPECT_FLOAT_EQ(map2.at(testTag_)->props.shadowRadius, 10.0f);
}

TEST_F(AnimatedPropsRegistryTest, preservesAccumulatedMapAcrossGetMapCalls) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.7f));
  auto updates = createSurfaceUpdates(surfaceId_, testTag_, std::move(props));
  registry_->update(updates);

  auto [families1, map1] = registry_->getMap(surfaceId_);
  EXPECT_FLOAT_EQ(map1.at(testTag_)->props.opacity, 0.7f);

  auto [families2, map2] = registry_->getMap(surfaceId_);
  EXPECT_FLOAT_EQ(map2.at(testTag_)->props.opacity, 0.7f);

  auto [families3, map3] = registry_->getMap(surfaceId_);
  EXPECT_FLOAT_EQ(map3.at(testTag_)->props.opacity, 0.7f);
}

TEST_F(
    AnimatedPropsRegistryTest,
    getMapWithEmptyRegistryReturnsEmptyCollections) {
  auto [families, map] = registry_->getMap(surfaceId_);
  EXPECT_TRUE(families.empty());
  EXPECT_TRUE(map.empty());
}

// ============================================================================
// RawProps Merge Behavior
// ============================================================================

TEST_F(AnimatedPropsRegistryTest, mergesRawPropsWithPatchSemantics) {
  folly::dynamic rawDynamic1 =
      folly::dynamic::object("opacity", 0.5)("nativeID", "node1");
  auto rawProps1 = std::make_unique<RawProps>(rawDynamic1);

  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates1;
  SurfaceUpdates updates1;
  AnimatedProps animatedProps1;
  animatedProps1.rawProps = std::move(rawProps1);
  updates1.propsMap[testTag_] = std::move(animatedProps1);
  surfaceUpdates1[surfaceId_] = std::move(updates1);
  registry_->update(surfaceUpdates1);

  folly::dynamic rawDynamic2 = folly::dynamic::object("shadowRadius", 3.0);
  auto rawProps2 = std::make_unique<RawProps>(rawDynamic2);

  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates2;
  SurfaceUpdates updates2;
  AnimatedProps animatedProps2;
  animatedProps2.rawProps = std::move(rawProps2);
  updates2.propsMap[testTag_] = std::move(animatedProps2);
  surfaceUpdates2[surfaceId_] = std::move(updates2);
  registry_->update(surfaceUpdates2);

  auto [families, map] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map.contains(testTag_));
  ASSERT_NE(map.at(testTag_)->rawProps, nullptr);

  auto& mergedRawProps = *map.at(testTag_)->rawProps;
  EXPECT_DOUBLE_EQ(mergedRawProps["opacity"].getDouble(), 0.5);
  EXPECT_EQ(mergedRawProps["nativeID"].getString(), "node1");
  EXPECT_DOUBLE_EQ(mergedRawProps["shadowRadius"].getDouble(), 3.0);
}

TEST_F(AnimatedPropsRegistryTest, rawPropsOverwriteOnConflict) {
  folly::dynamic rawDynamic1 = folly::dynamic::object("opacity", 0.5);
  auto rawProps1 = std::make_unique<RawProps>(rawDynamic1);

  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates1;
  SurfaceUpdates updates1;
  AnimatedProps animatedProps1;
  animatedProps1.rawProps = std::move(rawProps1);
  updates1.propsMap[testTag_] = std::move(animatedProps1);
  surfaceUpdates1[surfaceId_] = std::move(updates1);
  registry_->update(surfaceUpdates1);

  folly::dynamic rawDynamic2 = folly::dynamic::object("opacity", 0.8);
  auto rawProps2 = std::make_unique<RawProps>(rawDynamic2);

  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates2;
  SurfaceUpdates updates2;
  AnimatedProps animatedProps2;
  animatedProps2.rawProps = std::move(rawProps2);
  updates2.propsMap[testTag_] = std::move(animatedProps2);
  surfaceUpdates2[surfaceId_] = std::move(updates2);
  registry_->update(surfaceUpdates2);

  auto [families, map] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map.contains(testTag_));
  ASSERT_NE(map.at(testTag_)->rawProps, nullptr);

  auto& mergedRawProps = *map.at(testTag_)->rawProps;
  EXPECT_DOUBLE_EQ(mergedRawProps["opacity"].getDouble(), 0.8);
}

TEST_F(AnimatedPropsRegistryTest, rawPropsHandlesNestedObjects) {
  folly::dynamic rawDynamic = folly::dynamic::object(
      "shadowOffset", folly::dynamic::object("width", 5.0)("height", 10.0));
  auto rawProps = std::make_unique<RawProps>(rawDynamic);

  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates;
  SurfaceUpdates updates;
  AnimatedProps animatedProps;
  animatedProps.rawProps = std::move(rawProps);
  updates.propsMap[testTag_] = std::move(animatedProps);
  surfaceUpdates[surfaceId_] = std::move(updates);
  registry_->update(surfaceUpdates);

  auto [families, map] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map.contains(testTag_));
  ASSERT_NE(map.at(testTag_)->rawProps, nullptr);

  auto& mergedRawProps = *map.at(testTag_)->rawProps;
  EXPECT_DOUBLE_EQ(mergedRawProps["shadowOffset"]["width"].getDouble(), 5.0);
  EXPECT_DOUBLE_EQ(mergedRawProps["shadowOffset"]["height"].getDouble(), 10.0);
}

// ============================================================================
// Typed Props Merge Behavior
// ============================================================================

TEST_F(AnimatedPropsRegistryTest, typedPropsOverwriteOnSameProp) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props1;
  props1.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates1 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props1));
  registry_->update(updates1);

  std::vector<std::unique_ptr<AnimatedPropBase>> props2;
  props2.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.8f));
  auto updates2 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props2));
  registry_->update(updates2);

  auto [families, map] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map.contains(testTag_));

  EXPECT_FLOAT_EQ(map.at(testTag_)->props.opacity, 0.8f);
}

TEST_F(AnimatedPropsRegistryTest, mixedTypedAndRawPropsAccumulate) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.6f));
  auto updates1 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props));
  registry_->update(updates1);

  folly::dynamic rawDynamic = folly::dynamic::object("nativeID", "test-node");
  auto rawProps = std::make_unique<RawProps>(rawDynamic);

  std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates2;
  SurfaceUpdates updates2;
  AnimatedProps animatedProps2;
  animatedProps2.rawProps = std::move(rawProps);
  updates2.propsMap[testTag_] = std::move(animatedProps2);
  surfaceUpdates2[surfaceId_] = std::move(updates2);
  registry_->update(surfaceUpdates2);

  auto [families, map] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map.contains(testTag_));

  EXPECT_FLOAT_EQ(map.at(testTag_)->props.opacity, 0.6f);
  ASSERT_NE(map.at(testTag_)->rawProps, nullptr);
  EXPECT_EQ((*map.at(testTag_)->rawProps)["nativeID"].getString(), "test-node");
}

// ============================================================================
// Clear Behavior
// ============================================================================

TEST_F(AnimatedPropsRegistryTest, clearRemovesSurfaceData) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates = createSurfaceUpdates(surfaceId_, testTag_, std::move(props));
  registry_->update(updates);

  auto [families1, map1] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map1.contains(testTag_));

  registry_->clear(surfaceId_);

  auto [families2, map2] = registry_->getMap(surfaceId_);
  EXPECT_TRUE(families2.empty());
  EXPECT_TRUE(map2.empty());
}

TEST_F(AnimatedPropsRegistryTest, clearDoesNotAffectOtherSurfaces) {
  SurfaceId surface1 = 1;
  SurfaceId surface2 = 2;

  std::vector<std::unique_ptr<AnimatedPropBase>> props1;
  props1.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates1 = createSurfaceUpdates(surface1, testTag_, std::move(props1));
  registry_->update(updates1);

  std::vector<std::unique_ptr<AnimatedPropBase>> props2;
  props2.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.8f));
  auto updates2 = createSurfaceUpdates(surface2, testTag_, std::move(props2));
  registry_->update(updates2);

  registry_->getMap(surface1);
  registry_->getMap(surface2);

  registry_->clear(surface1);

  auto [families1, map1] = registry_->getMap(surface1);
  EXPECT_TRUE(map1.empty());

  auto [families2, map2] = registry_->getMap(surface2);
  ASSERT_TRUE(map2.contains(testTag_));
  EXPECT_FLOAT_EQ(map2.at(testTag_)->props.opacity, 0.8f);
}

TEST_F(AnimatedPropsRegistryTest, updateAfterClearWorks) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props1;
  props1.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates1 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props1));
  registry_->update(updates1);

  registry_->getMap(surfaceId_);

  registry_->clear(surfaceId_);

  std::vector<std::unique_ptr<AnimatedPropBase>> props2;
  props2.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.9f));
  auto updates2 = createSurfaceUpdates(surfaceId_, testTag_, std::move(props2));
  registry_->update(updates2);

  auto [families, map] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map.contains(testTag_));
  EXPECT_FLOAT_EQ(map.at(testTag_)->props.opacity, 0.9f);
}

TEST_F(AnimatedPropsRegistryTest, clearDoesNotAffectPendingData) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates = createSurfaceUpdates(surfaceId_, testTag_, std::move(props));
  registry_->update(updates);

  registry_->clear(surfaceId_);

  auto [families, map] = registry_->getMap(surfaceId_);
  ASSERT_TRUE(map.contains(testTag_))
      << "Pending data should survive clear() since clear() only clears the merged map";
  EXPECT_FLOAT_EQ(map.at(testTag_)->props.opacity, 0.5f);
}

// ============================================================================
// Thread Safety Tests
// ============================================================================

TEST_F(AnimatedPropsRegistryTest, concurrentUpdateAndGetMapOperations) {
  constexpr int numIterations = 100;
  std::atomic<int> successfulUpdates{0};
  std::atomic<int> successfulReads{0};

  std::thread updateThread([this, &successfulUpdates]() {
    for (int i = 0; i < numIterations; i++) {
      std::vector<std::unique_ptr<AnimatedPropBase>> props;
      props.push_back(
          std::make_unique<AnimatedProp<Float>>(
              OPACITY, 0.01f * static_cast<float>(i)));
      auto updates =
          createSurfaceUpdates(surfaceId_, testTag_, std::move(props));
      registry_->update(updates);
      successfulUpdates++;
    }
  });

  std::thread readThread([this, &successfulReads]() {
    for (int i = 0; i < numIterations; i++) {
      [[maybe_unused]] auto [families, map] = registry_->getMap(surfaceId_);
      successfulReads++;
    }
  });

  updateThread.join();
  readThread.join();

  EXPECT_EQ(successfulUpdates.load(), numIterations);
  EXPECT_EQ(successfulReads.load(), numIterations);
}

// ============================================================================
// Other Tests
// ============================================================================

TEST_F(AnimatedPropsRegistryTest, handlesEmptyPropsVector) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  auto updates = createSurfaceUpdates(surfaceId_, testTag_, std::move(props));
  registry_->update(updates);

  auto [families, map] = registry_->getMap(surfaceId_);

  ASSERT_TRUE(map.contains(testTag_));
  EXPECT_TRUE(map.at(testTag_)->propNames.empty());
}

TEST_F(AnimatedPropsRegistryTest, handlesMultiplePropsInSingleUpdate) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  props.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_OPACITY, 0.3f));
  props.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_RADIUS, 5.0f));
  props.push_back(
      std::make_unique<AnimatedProp<std::optional<int>>>(Z_INDEX, 10));

  auto updates = createSurfaceUpdates(surfaceId_, testTag_, std::move(props));
  registry_->update(updates);

  auto [families, map] = registry_->getMap(surfaceId_);

  ASSERT_TRUE(map.contains(testTag_));
  EXPECT_FLOAT_EQ(map.at(testTag_)->props.opacity, 0.5f);
  EXPECT_FLOAT_EQ(map.at(testTag_)->props.shadowOpacity, 0.3f);
  EXPECT_FLOAT_EQ(map.at(testTag_)->props.shadowRadius, 5.0f);
  EXPECT_TRUE(map.at(testTag_)->props.zIndex.has_value());
  EXPECT_EQ(map.at(testTag_)->props.zIndex.value(), 10);
}

TEST_F(AnimatedPropsRegistryTest, handlesNullRawProps) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  auto updates = createSurfaceUpdates(surfaceId_, testTag_, std::move(props));
  registry_->update(updates);

  auto [families, map] = registry_->getMap(surfaceId_);

  ASSERT_TRUE(map.contains(testTag_));
  EXPECT_EQ(map.at(testTag_)->rawProps, nullptr);
}
