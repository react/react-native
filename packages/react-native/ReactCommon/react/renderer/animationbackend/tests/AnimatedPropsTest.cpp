/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/animationbackend/AnimatedProps.h>
#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/graphics/Transform.h>

using namespace facebook::react;

// ============================================================================
// cloneProp Tests - Simple Float Props
// ============================================================================

TEST(AnimatedPropsTest, clonePropAppliesOpacity) {
  BaseViewProps viewProps;
  AnimatedProp<Float> prop{OPACITY, 0.5f};
  cloneProp(viewProps, prop);
  EXPECT_FLOAT_EQ(viewProps.opacity, 0.5f);
}

TEST(AnimatedPropsTest, clonePropAppliesShadowOpacity) {
  BaseViewProps viewProps;
  AnimatedProp<Float> prop{SHADOW_OPACITY, 0.8f};
  cloneProp(viewProps, prop);
  EXPECT_FLOAT_EQ(viewProps.shadowOpacity, 0.8f);
}

TEST(AnimatedPropsTest, clonePropAppliesShadowRadius) {
  BaseViewProps viewProps;
  AnimatedProp<Float> prop{SHADOW_RADIUS, 5.0f};
  cloneProp(viewProps, prop);
  EXPECT_FLOAT_EQ(viewProps.shadowRadius, 5.0f);
}

TEST(AnimatedPropsTest, clonePropAppliesOutlineWidth) {
  BaseViewProps viewProps;
  AnimatedProp<Float> prop{OUTLINE_WIDTH, 2.0f};
  cloneProp(viewProps, prop);
  EXPECT_FLOAT_EQ(viewProps.outlineWidth, 2.0f);
}

TEST(AnimatedPropsTest, clonePropAppliesOutlineOffset) {
  BaseViewProps viewProps;
  AnimatedProp<Float> prop{OUTLINE_OFFSET, 3.0f};
  cloneProp(viewProps, prop);
  EXPECT_FLOAT_EQ(viewProps.outlineOffset, 3.0f);
}

// ============================================================================
// cloneProp Tests - Transform Props
// ============================================================================

TEST(AnimatedPropsTest, clonePropAppliesTransform) {
  BaseViewProps viewProps;
  Transform transform = Transform::Identity();
  transform = transform * Transform::Translate(10.0f, 20.0f, 0.0f);
  AnimatedProp<Transform> prop{TRANSFORM, transform};
  cloneProp(viewProps, prop);
  EXPECT_EQ(viewProps.transform, transform);
}

TEST(AnimatedPropsTest, clonePropAppliesTransformOrigin) {
  BaseViewProps viewProps;
  TransformOrigin origin{
      .xy =
          {ValueUnit(50.0f, UnitType::Percent),
           ValueUnit(25.0f, UnitType::Percent)},
      .z = 10.0f};
  AnimatedProp<TransformOrigin> prop{TRANSFORM_ORIGIN, origin};
  cloneProp(viewProps, prop);
  EXPECT_EQ(viewProps.transformOrigin, origin);
}

// ============================================================================
// cloneProp Tests - Color Props
// ============================================================================

TEST(AnimatedPropsTest, clonePropAppliesBackgroundColor) {
  BaseViewProps viewProps;
  auto color =
      colorFromComponents({.red = 255, .green = 0, .blue = 0, .alpha = 255});
  AnimatedProp<SharedColor> prop{BACKGROUND_COLOR, color};
  cloneProp(viewProps, prop);
  EXPECT_EQ(viewProps.backgroundColor, color);
}

TEST(AnimatedPropsTest, clonePropAppliesShadowColor) {
  BaseViewProps viewProps;
  auto color =
      colorFromComponents({.red = 0, .green = 0, .blue = 0, .alpha = 128});
  AnimatedProp<SharedColor> prop{SHADOW_COLOR, color};
  cloneProp(viewProps, prop);
  EXPECT_EQ(viewProps.shadowColor, color);
}

TEST(AnimatedPropsTest, clonePropAppliesOutlineColor) {
  BaseViewProps viewProps;
  auto color =
      colorFromComponents({.red = 0, .green = 255, .blue = 0, .alpha = 255});
  AnimatedProp<SharedColor> prop{OUTLINE_COLOR, color};
  cloneProp(viewProps, prop);
  EXPECT_EQ(viewProps.outlineColor, color);
}

// ============================================================================
// cloneProp Tests - Z-Index and Optional Props
// ============================================================================

TEST(AnimatedPropsTest, clonePropAppliesZIndex) {
  BaseViewProps viewProps;
  AnimatedProp<std::optional<int>> prop{Z_INDEX, 5};
  cloneProp(viewProps, prop);
  EXPECT_TRUE(viewProps.zIndex.has_value());
  EXPECT_EQ(viewProps.zIndex.value(), 5);
}

TEST(AnimatedPropsTest, clonePropAppliesNulloptZIndex) {
  BaseViewProps viewProps;
  viewProps.zIndex = 10;
  AnimatedProp<std::optional<int>> prop{Z_INDEX, std::nullopt};
  cloneProp(viewProps, prop);
  EXPECT_FALSE(viewProps.zIndex.has_value());
}

// ============================================================================
// cloneProp Tests - Shadow Props
// ============================================================================

TEST(AnimatedPropsTest, clonePropAppliesShadowOffset) {
  BaseViewProps viewProps;
  facebook::react::Size offset{.width = 5.0f, .height = 10.0f};
  AnimatedProp<facebook::react::Size> prop{SHADOW_OFFSET, offset};
  cloneProp(viewProps, prop);
  EXPECT_FLOAT_EQ(viewProps.shadowOffset.width, 5.0f);
  EXPECT_FLOAT_EQ(viewProps.shadowOffset.height, 10.0f);
}
// ============================================================================
// Multiple cloneProp Applications
// ============================================================================

TEST(AnimatedPropsTest, multipleClonePropCallsAccumulate) {
  BaseViewProps viewProps;

  AnimatedProp<Float> opacityProp{OPACITY, 0.5f};
  cloneProp(viewProps, opacityProp);

  AnimatedProp<Float> shadowProp{SHADOW_OPACITY, 0.8f};
  cloneProp(viewProps, shadowProp);

  AnimatedProp<std::optional<int>> zIndexProp{Z_INDEX, 99};
  cloneProp(viewProps, zIndexProp);

  EXPECT_FLOAT_EQ(viewProps.opacity, 0.5f);
  EXPECT_FLOAT_EQ(viewProps.shadowOpacity, 0.8f);
  EXPECT_TRUE(viewProps.zIndex.has_value());
  EXPECT_EQ(viewProps.zIndex.value(), 99);
}

TEST(AnimatedPropsTest, clonePropOverwritesPreviousValue) {
  BaseViewProps viewProps;

  AnimatedProp<Float> prop1{OPACITY, 0.5f};
  cloneProp(viewProps, prop1);
  EXPECT_FLOAT_EQ(viewProps.opacity, 0.5f);

  AnimatedProp<Float> prop2{OPACITY, 0.9f};
  cloneProp(viewProps, prop2);
  EXPECT_FLOAT_EQ(viewProps.opacity, 0.9f);
}
