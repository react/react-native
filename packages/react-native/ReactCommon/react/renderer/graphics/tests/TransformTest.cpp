/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/Transform.h>

#include <gtest/gtest.h>
#include <array>
#include <cmath>
#include <limits>
#include <utility>

using namespace facebook::react;

namespace {

// BaseViewProps::resolveTransform mounts the matrix rebuilt from a transform's
// operations, not the transform's own matrix.
Transform rebuildFromOperations(const Transform& transform, const Size& size) {
  auto rebuilt = Transform{};
  for (const auto& operation : transform.operations) {
    rebuilt =
        rebuilt * Transform::FromTransformOperation(operation, size, transform);
  }
  return rebuilt;
}

} // namespace

TEST(TransformTest, transformingSize) {
  auto size = facebook::react::Size{100, 200};
  auto scaledSize = size * Transform::Scale(0.5, 0.5, 1);

  EXPECT_EQ(scaledSize.width, 50);
  EXPECT_EQ(scaledSize.height, 100);
}

TEST(TransformTest, transformingPoint) {
  auto point = facebook::react::Point{100, 200};
  auto translatedPoint = point * Transform::Translate(-50, -100, 0);

  EXPECT_EQ(translatedPoint.x, 50);
  EXPECT_EQ(translatedPoint.y, 100);
}

TEST(TransformTest, fromTransformOperationPercentage) {
  auto point = facebook::react::Point{0, 0};
  facebook::react::Size size = {120, 200};

  auto operation = TransformOperation{
      TransformOperationType::Translate,
      ValueUnit{50.0f, UnitType::Percent},
      ValueUnit{20.0f, UnitType::Percent},
      {}};
  auto translatedPoint =
      point * Transform::FromTransformOperation(operation, size);
  EXPECT_EQ(translatedPoint.x, 60);
  EXPECT_EQ(translatedPoint.y, 40);

  operation = TransformOperation{
      TransformOperationType::Translate,
      ValueUnit{40.0f, UnitType::Percent},
      ValueUnit{20.0f, UnitType::Point},
      {}};
  translatedPoint = point * Transform::FromTransformOperation(operation, size);
  EXPECT_EQ(translatedPoint.x, 48);
  EXPECT_EQ(translatedPoint.y, 20);
}

TEST(TransformTest, scalingRect) {
  auto point = facebook::react::Point{100, 200};
  auto size = facebook::react::Size{300, 400};
  auto rect = facebook::react::Rect{point, size};

  auto transformedRect = rect * Transform::Scale(0.5, 0.5, 1);

  EXPECT_EQ(transformedRect.origin.x, 175);
  EXPECT_EQ(transformedRect.origin.y, 300);
  EXPECT_EQ(transformedRect.size.width, 150);
  EXPECT_EQ(transformedRect.size.height, 200);
}

TEST(TransformTest, scalingRectWithDifferentCenter) {
  auto point = facebook::react::Point{100, 200};
  auto size = facebook::react::Size{300, 400};
  auto rect = facebook::react::Rect{point, size};

  auto center = facebook::react::Point{0, 0};

  auto transformedRect =
      Transform::Scale(0.5, 0.5, 1).applyWithCenter(rect, center);

  EXPECT_EQ(transformedRect.origin.x, 50);
  EXPECT_EQ(transformedRect.origin.y, 100);
  EXPECT_EQ(transformedRect.size.width, 150);
  EXPECT_EQ(transformedRect.size.height, 200);
}

TEST(TransformTest, invertingSize) {
  auto size = facebook::react::Size{300, 400};
  auto transformedSize = size * Transform::VerticalInversion();
  EXPECT_EQ(transformedSize.width, 300);
  EXPECT_EQ(transformedSize.height, 400);
}

TEST(TransformTest, rotatingRect) {
  auto point = facebook::react::Point{10, 10};
  auto size = facebook::react::Size{10, 10};
  auto rect = facebook::react::Rect{point, size};

  auto transformedRect = rect * Transform::RotateZ(M_PI_4);

  ASSERT_NEAR(transformedRect.origin.x, 7.9289, 0.0001);
  ASSERT_NEAR(transformedRect.origin.y, 7.9289, 0.0001);
  ASSERT_NEAR(transformedRect.size.width, 14.1421, 0.0001);
  ASSERT_NEAR(transformedRect.size.height, 14.1421, 0.0001);
}

TEST(TransformTest, rotate3dOverload) {
  auto point = facebook::react::Point{10, 10};
  auto size = facebook::react::Size{10, 10};
  auto rect = facebook::react::Rect{point, size};

  auto transform = Transform::Rotate(0, 0, M_PI_4);
  EXPECT_EQ(transform.operations.size(), 1);
  EXPECT_EQ(transform.operations[0].type, TransformOperationType::Rotate);
  EXPECT_EQ(transform.operations[0].x.resolve(0), 0);
  EXPECT_EQ(transform.operations[0].y.resolve(0), 0);
  ASSERT_NEAR(transform.operations[0].z.resolve(0), M_PI_4, 0.0001);

  auto transformedRect = rect * Transform::Rotate(0, 0, M_PI_4);

  ASSERT_NEAR(transformedRect.origin.x, 7.9289, 0.0001);
  ASSERT_NEAR(transformedRect.origin.y, 7.9289, 0.0001);
  ASSERT_NEAR(transformedRect.size.width, 14.1421, 0.0001);
  ASSERT_NEAR(transformedRect.size.height, 14.1421, 0.0001);
}

TEST(TransformTest, scalingAndTranslatingRect) {
  auto point = facebook::react::Point{100, 200};
  auto size = facebook::react::Size{300, 400};
  auto rect = facebook::react::Rect{point, size};

  auto transformedRect =
      rect * Transform::Scale(0.5, 0.5, 1) * Transform::Translate(1, 1, 0);

  EXPECT_EQ(transformedRect.origin.x, 176);
  EXPECT_EQ(transformedRect.origin.y, 301);
  EXPECT_EQ(transformedRect.size.width, 150);
  EXPECT_EQ(transformedRect.size.height, 200);
}

TEST(TransformTest, perspectiveBelowOnePixelRendersAsOnePixel) {
  for (auto depth : {0.0, -0.0, 0.5}) {
    auto transform = Transform::Perspective(depth);

    EXPECT_EQ(transform.matrix[11], -1) << "depth " << depth;
    EXPECT_EQ(transform.operations[0].x.value, depth) << "depth " << depth;
  }

  EXPECT_FLOAT_EQ(Transform::Perspective(1000).matrix[11], -1.0f / 1000);
}

// A perspective interpolates as its matrix, where m34 is -1 / depth and no
// perspective is 0:
// https://drafts.csswg.org/css-transforms-2/#interpolation-of-transform-functions
TEST(
    TransformTest,
    interpolatingPerspectiveTowardNoPerspectiveInterpolatesItsMatrix) {
  auto size = facebook::react::Size{100, 100};
  auto from = Transform::Perspective(100);
  auto to = Transform::Identity();

  for (auto [progress, m34] : std::array<std::pair<Float, Float>, 5>{
           {{0, -0.01},
            {0.5, -0.005},
            {0.99, -0.0001},
            {1, 0},
            {1.125, 0.00125}}}) {
    auto transform = Transform::Interpolate(progress, from, to, size);

    EXPECT_NEAR(transform.matrix[11], m34, 1e-7) << "progress " << progress;
    EXPECT_NEAR(rebuildFromOperations(transform, size).matrix[11], m34, 1e-7)
        << "progress " << progress;
  }

  auto backward = Transform::Interpolate(0.5, to, from, size);
  EXPECT_NEAR(backward.matrix[11], -0.005, 1e-7);
  EXPECT_NEAR(rebuildFromOperations(backward, size).matrix[11], -0.005, 1e-7);
}

TEST(TransformTest, interpolatingBetweenPerspectivesInterpolatesTheirMatrices) {
  auto size = facebook::react::Size{100, 100};
  auto transform = Transform::Interpolate(
      0.5, Transform::Perspective(100), Transform::Perspective(200), size);

  EXPECT_NEAR(transform.matrix[11], -0.0075, 1e-7);
  EXPECT_NEAR(rebuildFromOperations(transform, size).matrix[11], -0.0075, 1e-7);
}

TEST(TransformTest, interpolatingAPerspectiveAwayKeepsTheOperationsBesideIt) {
  auto size = facebook::react::Size{100, 100};
  auto rotation = Transform::RotateZ(M_PI / 4);
  auto transform = Transform::Interpolate(
      1, Transform::Perspective(100) * rotation, rotation, size);

  for (const auto& operation : transform.operations) {
    EXPECT_NE(operation.type, TransformOperationType::Perspective);
  }
  for (size_t index = 0; index < 16; index++) {
    EXPECT_NEAR(
        rebuildFromOperations(transform, size).matrix[index],
        rotation.matrix[index],
        1e-6)
        << "entry " << index;
  }
}

// A transform holding a non-finite number is an invalid declaration, so an
// animation toward or from one interpolates toward or from no transform.
TEST(
    TransformTest,
    interpolatingTowardATransformHoldingANonFiniteNumberInterpolatesTowardNoTransform) {
  auto size = facebook::react::Size{100, 100};
  constexpr auto infinity = std::numeric_limits<Float>::infinity();
  auto rotation = Transform::RotateY(M_PI / 4);
  auto rotated = Transform::Perspective(100) * rotation;
  auto halfwayToNoTransform = rebuildFromOperations(
      Transform::Interpolate(0.5, rotated, Transform::Identity(), size), size);
  const auto nonFiniteTransforms = std::array{
      Transform::Perspective(infinity) * rotation,
      Transform::Perspective(-infinity) * rotation,
      Transform::Perspective(100) *
          Transform::RotateY(std::numeric_limits<Float>::quiet_NaN())};

  for (size_t transformIndex = 0; transformIndex < nonFiniteTransforms.size();
       transformIndex++) {
    const auto& nonFinite = nonFiniteTransforms[transformIndex];
    auto forward = rebuildFromOperations(
        Transform::Interpolate(0.5, rotated, nonFinite, size), size);
    auto backward = rebuildFromOperations(
        Transform::Interpolate(0.5, nonFinite, rotated, size), size);

    for (size_t index = 0; index < 16; index++) {
      EXPECT_NEAR(
          forward.matrix[index], halfwayToNoTransform.matrix[index], 1e-6)
          << "toward transform " << transformIndex << ", entry " << index;
      EXPECT_NEAR(
          backward.matrix[index], halfwayToNoTransform.matrix[index], 1e-6)
          << "from transform " << transformIndex << ", entry " << index;
    }
  }
}

TEST(TransformTest, negativePerspectiveKeepsItsDepth) {
  auto transform = Transform::Perspective(-100);

  EXPECT_FLOAT_EQ(transform.matrix[11], 1.0f / 100);
  EXPECT_EQ(transform.operations[0].x.value, -100);
}

TEST(TransformTest, interpolatingATranslateInterpolatesItsDistance) {
  auto size = facebook::react::Size{100, 100};
  auto transform = Transform::Interpolate(
      0.5,
      Transform::Translate(20, 0, 0),
      Transform::Translate(100, 40, 0),
      size);

  EXPECT_FLOAT_EQ(transform.matrix[12], 60);
  EXPECT_FLOAT_EQ(transform.matrix[13], 20);
}
