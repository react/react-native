/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <array>
#include <limits>
#include <vector>

#include <gtest/gtest.h>

#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/components/view/conversions.h>

namespace facebook::react {

namespace {

// For transforms involving rotations, use this helper to fix floating point
// accuracies
void expectTransformsEqual(const Transform& t1, const Transform& t2) {
  for (int i = 0; i < 16; i++) {
    EXPECT_NEAR(t1.matrix[i], t2.matrix[i], 0.0001);
  }
}

} // namespace

class ResolveTransformTest : public ::testing::Test {
 protected:
  TransformOrigin createTransformOriginPoints(float x, float y, float z = 0) {
    TransformOrigin origin;
    origin.xy[0] = ValueUnit(x, UnitType::Point);
    origin.xy[1] = ValueUnit(y, UnitType::Point);
    origin.z = z;
    return origin;
  }

  TransformOrigin createTransformOriginPercent(float x, float y, float z = 0) {
    TransformOrigin origin;
    origin.xy[0] = ValueUnit(x, UnitType::Percent);
    origin.xy[1] = ValueUnit(y, UnitType::Percent);
    origin.z = z;
    return origin;
  }
};

TEST_F(ResolveTransformTest, EmptyFrameNoTransformOrigin) {
  Size frameSize{.width = 0, .height = 0};
  Transform transform = Transform::Translate(10.0, 20.0, 0.0);
  TransformOrigin transformOrigin; // Default (not set)

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // With empty frame size and no transform origin, should just apply the
  // transform directly
  EXPECT_EQ(result.matrix, transform.matrix);
}

TEST_F(ResolveTransformTest, EmptyFrameTransformOriginPoints) {
  Size frameSize{.width = 0, .height = 0};
  Transform transform = Transform::Translate(10.0, 20.0, 0.0);
  TransformOrigin transformOrigin = createTransformOriginPoints(5, 8);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Should handle transform origin even with empty frame size
  EXPECT_EQ(result.matrix, Transform::Translate(10.0, 20.0, 0.0).matrix);
}

TEST_F(ResolveTransformTest, EmptyFrameTransformOriginPercent) {
  Size frameSize{.width = 0, .height = 0};
  Transform transform = Transform::Translate(10.0, 20.0, 0.0);
  TransformOrigin transformOrigin = createTransformOriginPercent(50, 50);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Transform origin does not affect translate transform
  EXPECT_EQ(result.matrix, Transform::Translate(10.0, 20.0, 0.0).matrix);
}

TEST_F(ResolveTransformTest, NonEmptyFrameNoTransformOrigin) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::Translate(10.0, 20.0, 0.0);
  TransformOrigin transformOrigin; // Default (not set)

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Transform origin does not affect translate transform
  EXPECT_EQ(result.matrix, Transform::Translate(10.0, 20.0, 0.0).matrix);
}

TEST_F(ResolveTransformTest, NonEmptyFrameTransformOriginPoints) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::Scale(2.0, 1.5, 0.);
  TransformOrigin transformOrigin = createTransformOriginPoints(25, 50);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  auto expected = Transform::Translate(25.0, 25.0, 0.0) * transform;
  EXPECT_EQ(result.matrix, expected.matrix);
}

TEST_F(ResolveTransformTest, NonEmptyFrameTransformOriginPercent) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::Scale(2.0, 1.5, 0.);
  TransformOrigin transformOrigin =
      createTransformOriginPercent(25, 75); // 25% width, 75% height

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Should resolve percentages: 25% of 100 = 25, 75% of 200 = 150
  auto expected = Transform::Translate(25.0, -25.0, 0.0) * transform;
  EXPECT_EQ(result.matrix, expected.matrix);
}

TEST_F(ResolveTransformTest, IdentityTransformWithOrigin) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::Identity();
  TransformOrigin transformOrigin = createTransformOriginPoints(25, 50);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Even with identity transform, transform origin should still apply
  // translations but they should cancel out, resulting in identity
  EXPECT_EQ(result.matrix, transform.matrix);
}

TEST_F(ResolveTransformTest, MultipleTransformOperations) {
  Size frameSize{.width = 100, .height = 200};

  Transform transform = Transform::Identity();
  transform = transform * Transform::Translate(10.0, 20.0, 0.0);
  transform = transform * Transform::Scale(2.0, 1.5, 0.0);

  TransformOrigin transformOrigin = createTransformOriginPercent(50, 50);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  EXPECT_EQ(result.matrix, transform.matrix);
}

TEST_F(ResolveTransformTest, VariousTransformOriginPositions) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::Scale(2.0, 2.0, 0.);

  // Test origin at top-left (0, 0)
  TransformOrigin topLeft = createTransformOriginPoints(0, 0);
  auto resultTopLeft =
      BaseViewProps::resolveTransform(frameSize, transform, topLeft);
  auto expected = Transform::Translate(50.0, 100.0, 0.0) * transform;
  EXPECT_EQ(resultTopLeft.matrix, expected.matrix);

  // Test origin at center (50%, 50%)
  TransformOrigin center = createTransformOriginPercent(50, 50);
  auto resultCenter =
      BaseViewProps::resolveTransform(frameSize, transform, center);
  EXPECT_EQ(resultCenter.matrix, transform.matrix);

  // Test origin at bottom-right (100%, 100%)
  TransformOrigin bottomRight = createTransformOriginPercent(100, 100);
  auto resultBottomRight =
      BaseViewProps::resolveTransform(frameSize, transform, bottomRight);
  expected = Transform::Translate(-50.0, -100.0, 0.0) * transform;
  EXPECT_EQ(resultBottomRight.matrix, expected.matrix);
}

// Test with z-component in transform origin
TEST_F(ResolveTransformTest, TransformOriginWithZComponent) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::Scale(1.5, 1.5, 0.);

  TransformOrigin transformOrigin;
  transformOrigin.xy[0] = ValueUnit(50, UnitType::Point);
  transformOrigin.xy[1] = ValueUnit(100, UnitType::Point);
  transformOrigin.z = 10.0f;

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);
  auto expected = Transform::Translate(0.0, 0.0, 10.0) * transform;
  EXPECT_EQ(result.matrix, expected.matrix);
}

TEST_F(ResolveTransformTest, ArbitraryTransformMatrix) {
  Size frameSize{.width = 100, .height = 200};

  Transform transform;
  transform.operations.push_back({
      .type = TransformOperationType::Arbitrary,
      .x = ValueUnit(0, UnitType::Point),
      .y = ValueUnit(0, UnitType::Point),
      .z = ValueUnit(0, UnitType::Point),
  });
  // Set custom matrix
  transform.matrix = {{2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 10, 20, 0, 1}};

  TransformOrigin transformOrigin = createTransformOriginPoints(25, 50);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  auto expected = Transform::Translate(25.0, 50.0, 0.0) * transform;
  EXPECT_EQ(result.matrix, expected.matrix);
}

// Test rotation with empty frame size and no transform origin
TEST_F(ResolveTransformTest, RotationEmptyFrameNoTransformOrigin) {
  Size frameSize{.width = 0, .height = 0};
  Transform transform = Transform::RotateZ(M_PI / 4.0); // 45 degrees
  TransformOrigin transformOrigin; // Default (not set)

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // With empty frame size and no transform origin, should just apply the
  // rotation directly
  expectTransformsEqual(result, transform);
}

// Test rotation with empty frame size and transform origin in points
TEST_F(ResolveTransformTest, RotationEmptyFrameTransformOriginPoints) {
  Size frameSize{.width = 0, .height = 0};
  Transform transform = Transform::RotateZ(M_PI / 4.0); // 45 degrees
  TransformOrigin transformOrigin = createTransformOriginPoints(10, 20);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // With empty frame size, center is (0, 0), so origin offset is (10, 20)
  auto expected = Transform::Translate(10.0, 20.0, 0.0) * transform *
      Transform::Translate(-10.0, -20.0, 0.0);
  expectTransformsEqual(result, expected);
}

// Test rotation with empty frame size and transform origin in percentages
TEST_F(ResolveTransformTest, RotationEmptyFrameTransformOriginPercent) {
  Size frameSize{.width = 0, .height = 0};
  Transform transform = Transform::RotateZ(M_PI / 6.0); // 30 degrees
  TransformOrigin transformOrigin = createTransformOriginPercent(50, 50);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // With 0 frame size, percentages resolve to 0, so no origin offset
  expectTransformsEqual(result, transform);
}

// Test rotation with non-empty frame size and no transform origin
TEST_F(ResolveTransformTest, RotationNonEmptyFrameNoTransformOrigin) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::RotateZ(M_PI / 3.0); // 60 degrees
  TransformOrigin transformOrigin; // Default (not set)

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Without transform origin, rotation should happen around default center
  expectTransformsEqual(result, transform);
}

// Test rotation with non-empty frame size and transform origin in points
TEST_F(ResolveTransformTest, RotationNonEmptyFrameTransformOriginPoints) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::RotateZ(M_PI / 4.0); // 45 degrees
  TransformOrigin transformOrigin = createTransformOriginPoints(25, 50);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Center of 100x200 frame is (50, 100), origin at (25, 50) means offset of
  // (-25, -50)
  auto expected = Transform::Translate(-25.0, -50.0, 0.0) * transform *
      Transform::Translate(25.0, 50.0, 0.0);
  expectTransformsEqual(result, expected);
}

// Test rotation with non-empty frame size and transform origin in percentages
TEST_F(ResolveTransformTest, RotationNonEmptyFrameTransformOriginPercent) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::RotateZ(M_PI / 2.0); // 90 degrees
  TransformOrigin transformOrigin =
      createTransformOriginPercent(25, 75); // 25% width, 75% height

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Should resolve percentages: 25% of 100 = 25, 75% of 200 = 150
  // Center is (50, 100), so origin offset is (25-50, 150-100) = (-25, 50)
  auto expected = Transform::Translate(-25.0, 50.0, 0.0) * transform *
      Transform::Translate(25.0, -50.0, 0.0);
  expectTransformsEqual(result, expected);
}

// Test rotation with mixed transform origin units
TEST_F(ResolveTransformTest, RotationMixedTransformOriginUnits) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::RotateZ(M_PI); // 180 degrees

  TransformOrigin transformOrigin;
  transformOrigin.xy[0] = ValueUnit(30, UnitType::Point); // 30 points
  transformOrigin.xy[1] = ValueUnit(25, UnitType::Percent); // 25% of 200 = 50
  transformOrigin.z = 0;

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Center is (50, 100), origin is (30, 50), so offset is (-20, -50)
  auto expected = Transform::Translate(-20.0, -50.0, 0.0) * transform *
      Transform::Translate(20.0, 50.0, 0.0);
  expectTransformsEqual(result, expected);
}

// Test multiple rotations (RotateX, RotateY, RotateZ)
TEST_F(ResolveTransformTest, MultipleRotationsWithTransformOrigin) {
  Size frameSize{.width = 100, .height = 100};

  Transform transform = Transform::Rotate(M_PI / 6.0, M_PI / 4.0, M_PI / 3.0);
  TransformOrigin transformOrigin = createTransformOriginPercent(50, 50);

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);
  expectTransformsEqual(result, transform);
}

// Test rotation with z-component in transform origin
TEST_F(ResolveTransformTest, RotationWithZTransformOrigin) {
  Size frameSize{.width = 100, .height = 200};
  Transform transform = Transform::RotateZ(M_PI / 4.0); // 45 degrees

  TransformOrigin transformOrigin;
  transformOrigin.xy[0] = ValueUnit(50, UnitType::Point);
  transformOrigin.xy[1] = ValueUnit(100, UnitType::Point);
  transformOrigin.z = 15.0f;

  auto result =
      BaseViewProps::resolveTransform(frameSize, transform, transformOrigin);

  // Center is (50, 100), origin is (50, 100, 15), so offset is (0, 0, 15)
  auto expected = Transform::Translate(0.0, 0.0, 15.0) * transform *
      Transform::Translate(0.0, 0.0, -15.0);
  expectTransformsEqual(result, expected);
}

// Test rotation at different origin positions (corners vs center)
TEST_F(ResolveTransformTest, RotationDifferentOriginPositions) {
  Size frameSize{.width = 100, .height = 100};
  Transform transform = Transform::RotateZ(M_PI / 2.0); // 90 degrees

  // Test rotation around top-left corner (0, 0)
  TransformOrigin topLeft = createTransformOriginPoints(0, 0);
  auto resultTopLeft =
      BaseViewProps::resolveTransform(frameSize, transform, topLeft);
  auto expectedTopLeft = Transform::Translate(-50.0, -50.0, 0.0) * transform *
      Transform::Translate(50.0, 50.0, 0.0);
  expectTransformsEqual(resultTopLeft, expectedTopLeft);

  // Test rotation around center (50%, 50%)
  TransformOrigin center = createTransformOriginPercent(50, 50);
  auto resultCenter =
      BaseViewProps::resolveTransform(frameSize, transform, center);
  expectTransformsEqual(resultCenter, transform);

  // Test rotation around bottom-right corner (100%, 100%)
  TransformOrigin bottomRight = createTransformOriginPercent(100, 100);
  auto resultBottomRight =
      BaseViewProps::resolveTransform(frameSize, transform, bottomRight);
  auto expectedBottomRight = Transform::Translate(50.0, 50.0, 0.0) * transform *
      Transform::Translate(-50.0, -50.0, 0.0);
  expectTransformsEqual(resultBottomRight, expectedBottomRight);
}

namespace {

Transform parseTransform(const folly::dynamic& value) {
  Transform result;
  fromRawValue(
      PropsParserContext{-1, ContextContainer{}}, RawValue{value}, result);
  return result;
}

TransformOrigin parseTransformOrigin(const folly::dynamic& value) {
  TransformOrigin result;
  fromRawValue(
      PropsParserContext{-1, ContextContainer{}}, RawValue{value}, result);
  return result;
}

} // namespace

TEST_F(ResolveTransformTest, TransformHoldingANonFiniteNumberIsUntransformed) {
  Size frameSize{.width = 100, .height = 100};
  constexpr std::array nonFiniteNumbers{
      std::numeric_limits<double>::quiet_NaN(),
      std::numeric_limits<double>::infinity(),
      -std::numeric_limits<double>::infinity()};
  constexpr std::array operations{
      "perspective",
      "rotate",
      "rotateX",
      "rotateY",
      "rotateZ",
      "scale",
      "scaleX",
      "scaleY",
      "scaleZ",
      "skewX",
      "skewY",
      "translateX",
      "translateY"};

  for (auto nonFiniteNumber : nonFiniteNumbers) {
    auto transforms = std::vector<folly::dynamic>{
        folly::dynamic::object(
            "translate", folly::dynamic::array(nonFiniteNumber, 0)),
        folly::dynamic::object(
            "translate", folly::dynamic::array(0, nonFiniteNumber))};
    for (const auto* operation : operations) {
      transforms.push_back(folly::dynamic::object(operation, nonFiniteNumber));
    }

    for (const auto& transform : transforms) {
      auto result = BaseViewProps::resolveTransform(
          frameSize,
          parseTransform(
              folly::dynamic::array(
                  folly::dynamic::object("translateX", 10), transform)),
          TransformOrigin{});

      EXPECT_EQ(result, Transform::Identity())
          << transform.keys().begin()->asString() << " holding "
          << nonFiniteNumber;
    }
  }
}

TEST_F(ResolveTransformTest, MatrixHoldingANonFiniteNumberIsUntransformed) {
  Size frameSize{.width = 100, .height = 100};
  const auto matrices = std::array{
      folly::dynamic::array(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
      folly::dynamic::array(1, 0, 0, 0, 1, 0, 0, 0, 1)};

  for (const auto& matrix : matrices) {
    for (size_t index = 0; index < matrix.size(); index++) {
      auto nonFiniteMatrix = matrix;
      nonFiniteMatrix[index] = std::numeric_limits<double>::quiet_NaN();
      auto result = BaseViewProps::resolveTransform(
          frameSize,
          parseTransform(
              folly::dynamic::array(
                  folly::dynamic::object("matrix", nonFiniteMatrix))),
          TransformOrigin{});

      EXPECT_EQ(result, Transform::Identity())
          << matrix.size() << " entries, entry " << index;
    }
  }
}

TEST_F(ResolveTransformTest, StringThatParsesToInfinityIsUntransformed) {
  Size frameSize{.width = 100, .height = 100};
  const auto transforms = std::vector<folly::dynamic>{
      folly::dynamic::object("rotate", "1e1000deg"),
      folly::dynamic::object("rotate", "1e37rad"),
      folly::dynamic::object("skewX", "1e1000deg"),
      folly::dynamic::object("translateX", "1e1000%")};

  for (const auto& transform : transforms) {
    auto result = BaseViewProps::resolveTransform(
        frameSize,
        parseTransform(
            folly::dynamic::array(
                folly::dynamic::object("translateX", 10), transform)),
        TransformOrigin{});

    EXPECT_EQ(result, Transform::Identity())
        << transform.keys().begin()->asString();
  }
}

TEST_F(ResolveTransformTest, FinitePerspectiveIsKept) {
  Size frameSize{.width = 100, .height = 100};
  auto result = BaseViewProps::resolveTransform(
      frameSize,
      parseTransform(
          folly::dynamic::array(
              folly::dynamic::object("perspective", 100),
              folly::dynamic::object("rotateY", "45deg"))),
      TransformOrigin{});

  expectTransformsEqual(
      result, Transform::Perspective(100) * Transform::RotateY(M_PI / 4));
}

TEST_F(ResolveTransformTest, CompositionThatOverflowsIsUntransformed) {
  Size frameSize{.width = 100, .height = 100};
  auto result = BaseViewProps::resolveTransform(
      frameSize,
      parseTransform(
          folly::dynamic::array(
              folly::dynamic::object("scale", 1e20),
              folly::dynamic::object("scale", 1e20))),
      TransformOrigin{});

  EXPECT_EQ(result, Transform::Identity());
}

TEST_F(
    ResolveTransformTest,
    PercentageThatResolvesPastTheLargestFloatIsUntransformed) {
  Size frameSize{.width = 100, .height = 100};
  auto translated = BaseViewProps::resolveTransform(
      frameSize,
      parseTransform(
          folly::dynamic::array(folly::dynamic::object("translateX", "1e37%"))),
      TransformOrigin{});
  auto aboutAFarOrigin = BaseViewProps::resolveTransform(
      frameSize,
      parseTransform(
          folly::dynamic::array(folly::dynamic::object("scaleX", 2))),
      parseTransformOrigin(folly::dynamic::array("1e37%", "50%", 0)));

  EXPECT_EQ(translated, Transform::Identity());
  EXPECT_EQ(aboutAFarOrigin, Transform::Identity());
}

// A valid transform animates toward its value however large its matrix grows,
// as the browsers animate it, and a frame whose matrix overflows is drawn
// untransformed.
TEST_F(
    ResolveTransformTest,
    AnimationTowardACompositionThatOverflowsDrawsTheFramesItCan) {
  Size frameSize{.width = 100, .height = 100};
  auto overflowing = parseTransform(
      folly::dynamic::array(
          folly::dynamic::object("scale", 1e20),
          folly::dynamic::object("scale", 1e20)));
  auto early = BaseViewProps::resolveTransform(
      frameSize,
      Transform::Interpolate(0.1, Transform{}, overflowing, frameSize),
      TransformOrigin{});
  auto late = BaseViewProps::resolveTransform(
      frameSize,
      Transform::Interpolate(0.5, Transform{}, overflowing, frameSize),
      TransformOrigin{});

  EXPECT_GT(early.matrix[0], 1e37);
  EXPECT_EQ(late, Transform::Identity());
}

TEST_F(ResolveTransformTest, NonFiniteTransformOriginTurnsAboutTheCenter) {
  Size frameSize{.width = 100, .height = 100};
  auto transform = parseTransform(
      folly::dynamic::array(folly::dynamic::object("scaleX", 2)));
  auto aboutTheCenter =
      BaseViewProps::resolveTransform(frameSize, transform, TransformOrigin{});
  constexpr auto notANumber = std::numeric_limits<double>::quiet_NaN();
  constexpr auto infinity = std::numeric_limits<double>::infinity();
  const auto origins = std::array{
      folly::dynamic::array(notANumber, 0, 0),
      folly::dynamic::array(0, infinity, 0),
      folly::dynamic::array(0, 0, notANumber)};

  for (size_t index = 0; index < origins.size(); index++) {
    auto result = BaseViewProps::resolveTransform(
        frameSize, transform, parseTransformOrigin(origins[index]));

    EXPECT_EQ(result.matrix, aboutTheCenter.matrix) << "origin " << index;
  }

  EXPECT_NE(
      BaseViewProps::resolveTransform(
          frameSize,
          transform,
          parseTransformOrigin(folly::dynamic::array(0, 0, 0)))
          .matrix,
      aboutTheCenter.matrix);
}

} // namespace facebook::react
