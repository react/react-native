/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <vector>

#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <react/renderer/graphics/Size.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <react/renderer/graphics/Vector.h>
#include <react/utils/hash_combine.h>

#include <folly/dynamic.h>

namespace facebook::react {

inline bool isZero(Float n)
{
  // We use this ternary expression instead of abs, fabsf, etc, because
  // Float can be double or float depending on compilation target.
  return (n < 0 ? n * (-1) : n) < 0.00001;
}

/**
 * Defines operations used to construct a transform matrix.
 * An "Arbitrary" operation means that the transform was seeded with some
 * arbitrary initial result.
 */
enum class TransformOperationType : uint8_t { Arbitrary, Identity, Perspective, Scale, Translate, Rotate, Skew };

struct TransformOperation {
  TransformOperationType type;
  ValueUnit x;
  ValueUnit y;
  ValueUnit z;
  bool operator==(const TransformOperation &other) const = default;
};

struct TransformOrigin {
  std::array<ValueUnit, 2> xy = {ValueUnit(0.0f, UnitType::Undefined), ValueUnit(0.0f, UnitType::Undefined)};
  float z = 0.0f;

  bool operator==(const TransformOrigin &other) const = default;
  bool isSet() const
  {
    return xy[0].value != 0.0f || xy[0].unit != UnitType::Undefined || xy[1].value != 0.0f ||
        xy[1].unit != UnitType::Undefined || z != 0.0f;
  }

#ifdef RN_SERIALIZABLE_STATE
  /**
   * Convert to folly::dynamic.
   */
  operator folly::dynamic() const
  {
    return folly::dynamic::array(xy[0].toDynamic(), xy[1].toDynamic(), z);
  }

#endif
};

/*
 * Defines transform matrix to apply affine transformations.
 */
struct Transform {
  std::vector<TransformOperation> operations{};

  std::array<Float, 16> matrix{{1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1}};

  /*
   * Given a TransformOperation, return the proper transform.
   */
  static Transform FromTransformOperation(
      TransformOperation transformOperation,
      const Size &size,
      const Transform &transform = Transform::Identity());
  static TransformOperation DefaultTransformOperation(TransformOperationType type);

  /*
   * Returns the identity transform (`[1 0 0 0; 0 1 0 0; 0 0 1 0; 0 0 0 1]`).
   */
  static Transform Identity() noexcept;

  /*
   * Returns the vertival inversion transform (`[1 0 0 0; 0 -1 0 0; 0 0 1 0; 0 0
   * 0 1]`).
   */
  static Transform VerticalInversion() noexcept;

  /*
   * Returns the horizontal inversion transform (`[-1 0 0 0; 0 1 0 0; 0 0 1 0; 0
   * 0 0 1]`).
   */
  static Transform HorizontalInversion() noexcept;

  /*
   * Returns a Perspective transform.
   */
  static Transform Perspective(Float perspective) noexcept;

  /*
   * Returns a Scale transform.
   */
  static Transform Scale(Float factorX, Float factorY, Float factorZ) noexcept;

  /*
   * Returns a Translate transform.
   */
  static Transform Translate(Float x, Float y, Float z) noexcept;

  /*
   * Returns a Skew transform.
   */
  static Transform Skew(Float x, Float y) noexcept;

  /*
   * Returns a transform that rotates by `angle` radians along the given axis.
   */
  static Transform RotateX(Float radians) noexcept;
  static Transform RotateY(Float radians) noexcept;
  static Transform RotateZ(Float radians) noexcept;
  static Transform Rotate(Float angleX, Float angleY, Float angleZ) noexcept;

  /**
   * Perform an interpolation between lhs and rhs, given progress.
   * This first decomposes the matrices into translation, scale, and rotation,
   * performs slerp between the two rotations, and a linear interpolation
   * of scale and translation.
   *
   * @param animationProgress of the animation
   * @param lhs start of the interpolation
   * @param rhs end of the interpolation
   * @return the Transformation
   */
  static Transform Interpolate(Float animationProgress, const Transform &lhs, const Transform &rhs, const Size &size);

  static bool isVerticalInversion(const Transform &transform) noexcept;
  static bool isHorizontalInversion(const Transform &transform) noexcept;

  /*
   * Equality operators.
   */
  bool operator==(const Transform &rhs) const noexcept;

  /*
   * Matrix subscript.
   */
  Float &at(int i, int j) noexcept;
  const Float &at(int i, int j) const noexcept;

  /*
   * Concatenates (multiplies) transform matrices.
   */
  Transform operator*(const Transform &rhs) const;

  Rect applyWithCenter(const Rect &rect, const Point &center) const;

  /**
   * Convert to folly::dynamic.
   */
  operator folly::dynamic() const
  {
    return folly::dynamic::array(
        matrix[0],
        matrix[1],
        matrix[2],
        matrix[3],
        matrix[4],
        matrix[5],
        matrix[6],
        matrix[7],
        matrix[8],
        matrix[9],
        matrix[10],
        matrix[11],
        matrix[12],
        matrix[13],
        matrix[14],
        matrix[15]);
  }
};

/*
 * Applies transformation to the given point.
 */
Point operator*(const Point &point, const Transform &transform);

/*
 * Applies transformation to the given size.
 */
Size operator*(const Size &size, const Transform &transform);

/*
 * Applies transformation to the given rect.
 * ONLY SUPPORTS scale and translation transformation.
 */
Rect operator*(const Rect &rect, const Transform &transform);

/*
 * Applies transformation to the given EdgeInsets.
 * ONLY SUPPORTS scale transformation.
 */
EdgeInsets operator*(const EdgeInsets &edgeInsets, const Transform &transform);

Vector operator*(const Transform &transform, const Vector &vector);

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::Transform> {
  size_t operator()(const facebook::react::Transform &transform) const
  {
    return facebook::react::hash_combine(
        transform.matrix[0],
        transform.matrix[1],
        transform.matrix[2],
        transform.matrix[3],
        transform.matrix[4],
        transform.matrix[5],
        transform.matrix[6],
        transform.matrix[7],
        transform.matrix[8],
        transform.matrix[9],
        transform.matrix[10],
        transform.matrix[11],
        transform.matrix[12],
        transform.matrix[13],
        transform.matrix[14],
        transform.matrix[15]);
  }
};

} // namespace std
