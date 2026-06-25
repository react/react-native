/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Transform.h"

#include <cmath>

#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <react/utils/FloatComparison.h>

namespace facebook::react {

/* static */ Transform Transform::Identity() noexcept {
  return {};
}

/* static */ Transform Transform::VerticalInversion() noexcept {
  return Transform::Scale(1, -1, 1);
}

/* static */ Transform Transform::HorizontalInversion() noexcept {
  return Transform::Scale(-1, 1, 1);
}

/* static */ Transform Transform::Perspective(Float perspective) noexcept {
  auto transform = Transform{};
  auto Zero = ValueUnit(0, UnitType::Point);
  transform.operations.push_back(
      TransformOperation{
          .type = TransformOperationType::Perspective,
          .x = ValueUnit(perspective, UnitType::Point),
          .y = Zero,
          .z = Zero});
  transform.matrix[11] = -1 / perspective;
  return transform;
}

/* static */ Transform Transform::Scale(Float x, Float y, Float z) noexcept {
  auto transform = Transform{};
  Float xprime = isZero(x) ? 0 : x;
  Float yprime = isZero(y) ? 0 : y;
  Float zprime = isZero(z) ? 0 : z;
  if (xprime != 1 || yprime != 1 || zprime != 1) {
    transform.operations.push_back(
        TransformOperation{
            .type = TransformOperationType::Scale,
            .x = ValueUnit(xprime, UnitType::Point),
            .y = ValueUnit(yprime, UnitType::Point),
            .z = ValueUnit(zprime, UnitType::Point)});
    transform.matrix[0] = xprime;
    transform.matrix[5] = yprime;
    transform.matrix[10] = zprime;
  }
  return transform;
}

/* static */ Transform
Transform::Translate(Float x, Float y, Float z) noexcept {
  auto transform = Transform{};
  Float xprime = isZero(x) ? 0 : x;
  Float yprime = isZero(y) ? 0 : y;
  Float zprime = isZero(z) ? 0 : z;
  if (xprime != 0 || yprime != 0 || zprime != 0) {
    transform.operations.push_back(
        TransformOperation{
            .type = TransformOperationType::Translate,
            .x = ValueUnit(xprime, UnitType::Point),
            .y = ValueUnit(yprime, UnitType::Point),
            .z = ValueUnit(zprime, UnitType::Point)});
    transform.matrix[12] = xprime;
    transform.matrix[13] = yprime;
    transform.matrix[14] = zprime;
  }
  return transform;
}

/* static */ Transform Transform::Skew(Float x, Float y) noexcept {
  auto transform = Transform{};
  Float xprime = isZero(x) ? 0 : x;
  Float yprime = isZero(y) ? 0 : y;
  transform.operations.push_back(
      TransformOperation{
          .type = TransformOperationType::Skew,
          .x = ValueUnit(xprime, UnitType::Point),
          .y = ValueUnit(yprime, UnitType::Point),
          .z = ValueUnit(0, UnitType::Point)});
  transform.matrix[4] = std::tan(xprime);
  transform.matrix[1] = std::tan(yprime);
  return transform;
}

/* static */ Transform Transform::RotateX(Float radians) noexcept {
  auto transform = Transform{};
  if (!isZero(radians)) {
    auto Zero = ValueUnit(0, UnitType::Point);
    transform.operations.push_back(
        TransformOperation{
            .type = TransformOperationType::Rotate,
            .x = ValueUnit(radians, UnitType::Point),
            .y = Zero,
            .z = Zero});
    transform.matrix[5] = std::cos(radians);
    transform.matrix[6] = std::sin(radians);
    transform.matrix[9] = -std::sin(radians);
    transform.matrix[10] = std::cos(radians);
  }
  return transform;
}

/* static */ Transform Transform::RotateY(Float radians) noexcept {
  auto transform = Transform{};
  if (!isZero(radians)) {
    auto Zero = ValueUnit(0, UnitType::Point);
    transform.operations.push_back(
        TransformOperation{
            .type = TransformOperationType::Rotate,
            .x = Zero,
            .y = ValueUnit(radians, UnitType::Point),
            .z = Zero});
    transform.matrix[0] = std::cos(radians);
    transform.matrix[2] = -std::sin(radians);
    transform.matrix[8] = std::sin(radians);
    transform.matrix[10] = std::cos(radians);
  }
  return transform;
}

/* static */ Transform Transform::RotateZ(Float radians) noexcept {
  auto transform = Transform{};
  if (!isZero(radians)) {
    auto Zero = ValueUnit(0, UnitType::Point);
    transform.operations.push_back(
        TransformOperation{
            .type = TransformOperationType::Rotate,
            .x = Zero,
            .y = Zero,
            .z = ValueUnit(radians, UnitType::Point)});
    transform.matrix[0] = std::cos(radians);
    transform.matrix[1] = std::sin(radians);
    transform.matrix[4] = -std::sin(radians);
    transform.matrix[5] = std::cos(radians);
  }
  return transform;
}

/* static */ Transform Transform::Rotate(Float x, Float y, Float z) noexcept {
  auto transform = Transform{};
  if (!isZero(x)) {
    transform = transform * Transform::RotateX(x);
  }
  if (!isZero(y)) {
    transform = transform * Transform::RotateY(y);
  }
  if (!isZero(z)) {
    transform = transform * Transform::RotateZ(z);
  }
  return transform;
}

/* static */ Transform Transform::FromTransformOperation(
    TransformOperation transformOperation,
    const Size& size,
    const Transform& transform) {
  if (transformOperation.type == TransformOperationType::Perspective) {
    return Transform::Perspective(transformOperation.x.resolve(0));
  }
  if (transformOperation.type == TransformOperationType::Scale) {
    return Transform::Scale(
        transformOperation.x.resolve(0),
        transformOperation.y.resolve(0),
        transformOperation.z.resolve(0));
  }
  if (transformOperation.type == TransformOperationType::Translate) {
    auto translateX = transformOperation.x.resolve(size.width);
    auto translateY = transformOperation.y.resolve(size.height);

    return Transform::Translate(
        translateX, translateY, transformOperation.z.resolve(0));
  }
  if (transformOperation.type == TransformOperationType::Skew) {
    return Transform::Skew(
        transformOperation.x.resolve(0), transformOperation.y.resolve(0));
  }
  if (transformOperation.type == TransformOperationType::Rotate) {
    return Transform::Rotate(
        transformOperation.x.resolve(0),
        transformOperation.y.resolve(0),
        transformOperation.z.resolve(0));
  }
  // when using arbitrary transform, the caller is responsible for applying the
  // value
  if (transformOperation.type == TransformOperationType::Arbitrary) {
    auto arbitraryTransform = Transform{};
    arbitraryTransform.operations.push_back(transformOperation);
    arbitraryTransform.matrix = transform.matrix;
    return arbitraryTransform;
  }

  // Identity
  return Transform::Identity();
}

/* static */ TransformOperation Transform::DefaultTransformOperation(
    TransformOperationType type) {
  auto Zero = ValueUnit{0, UnitType::Point};
  auto One = ValueUnit{1, UnitType::Point};
  switch (type) {
    case TransformOperationType::Arbitrary:
      return TransformOperation{
          .type = TransformOperationType::Arbitrary,
          .x = Zero,
          .y = Zero,
          .z = Zero};
    case TransformOperationType::Perspective:
      return TransformOperation{
          .type = TransformOperationType::Perspective,
          .x = Zero,
          .y = Zero,
          .z = Zero};
    case TransformOperationType::Scale:
      return TransformOperation{
          .type = TransformOperationType::Scale, .x = One, .y = One, .z = One};
    case TransformOperationType::Translate:
      return TransformOperation{
          .type = TransformOperationType::Translate,
          .x = Zero,
          .y = Zero,
          .z = Zero};
    case TransformOperationType::Rotate:
      return TransformOperation{
          .type = TransformOperationType::Rotate,
          .x = Zero,
          .y = Zero,
          .z = Zero};
    case TransformOperationType::Skew:
      return TransformOperation{
          .type = TransformOperationType::Skew,
          .x = Zero,
          .y = Zero,
          .z = Zero};
    default:
    case TransformOperationType::Identity:
      return TransformOperation{
          .type = TransformOperationType::Identity,
          .x = Zero,
          .y = Zero,
          .z = Zero};
  }
}

/* static */ Transform Transform::Interpolate(
    Float animationProgress,
    const Transform& lhs,
    const Transform& rhs,
    const Size& size) {
  // Iterate through operations and reconstruct an interpolated resulting
  // transform If at any point we hit an "Arbitrary" Transform, return at that
  // point
  Transform result = Transform::Identity();
  for (size_t i = 0, j = 0;
       i < lhs.operations.size() || j < rhs.operations.size();) {
    bool haveLHS = i < lhs.operations.size();
    bool haveRHS = j < rhs.operations.size();

    if ((haveLHS &&
         lhs.operations[i].type == TransformOperationType::Arbitrary) ||
        (haveRHS &&
         rhs.operations[j].type == TransformOperationType::Arbitrary)) {
      return result;
    }
    if (haveLHS && lhs.operations[i].type == TransformOperationType::Identity) {
      i++;
      continue;
    }
    if (haveRHS && rhs.operations[j].type == TransformOperationType::Identity) {
      j++;
      continue;
    }

    // Here we either set:
    // 1. lhs = next left op, rhs = next right op (when types are identical and
    // both exist)
    // 2. lhs = next left op, rhs = default of type (if types unequal, or rhs
    // doesn't exist)
    // 3. lhs = default of type, rhs = next right op (if types unequal, or rhs
    // doesn't exist) This guarantees that the types of both sides are equal,
    // and that one or both indices moves forward.
    TransformOperationType type =
        (haveLHS ? lhs.operations[i] : rhs.operations[j]).type;
    TransformOperation lhsOp =
        (haveLHS ? lhs.operations[i++]
                 : Transform::DefaultTransformOperation(type));
    TransformOperation rhsOp =
        (haveRHS && rhs.operations[j].type == type
             ? rhs.operations[j++]
             : Transform::DefaultTransformOperation(type));
    react_native_assert(type == lhsOp.type);
    react_native_assert(type == rhsOp.type);

    result = result *
        Transform::FromTransformOperation(
                 TransformOperation{
                     .type = type,
                     .x = ValueUnit(
                         lhsOp.x.resolve(size.width) +
                             (rhsOp.x.resolve(size.width) -
                              lhsOp.x.resolve(size.width)) *
                                 animationProgress,
                         UnitType::Point),
                     .y = ValueUnit(
                         lhsOp.y.resolve(size.height) +
                             (rhsOp.y.resolve(size.height) -
                              lhsOp.y.resolve(size.height)) *
                                 animationProgress,
                         UnitType::Point),
                     .z = ValueUnit(
                         lhsOp.z.resolve(0) +
                             (rhsOp.z.resolve(0) - lhsOp.z.resolve(0)) *
                                 animationProgress,
                         UnitType::Point)},
                 size);
  }

  return result;
}

/* static */ bool Transform::isVerticalInversion(
    const Transform& transform) noexcept {
  return floatEquality(transform.at(1, 1), static_cast<Float>(-1.0f));
}

/* static */ bool Transform::isHorizontalInversion(
    const Transform& transform) noexcept {
  return floatEquality(transform.at(0, 0), static_cast<Float>(-1.0f));
}

bool Transform::operator==(const Transform& rhs) const noexcept {
  for (auto i = 0; i < 16; i++) {
    if (matrix[i] != rhs.matrix[i]) {
      return false;
    }
  }
  if (this->operations.size() != rhs.operations.size()) {
    return false;
  }
  for (size_t i = 0; i < this->operations.size(); i++) {
    if (this->operations[i] != rhs.operations[i]) {
      return false;
    }
  }
  return true;
}

Transform Transform::operator*(const Transform& rhs) const {
  if (*this == Transform::Identity()) {
    return rhs;
  }

  const auto& lhs = *this;
  auto result = Transform{};
  for (const auto& op : this->operations) {
    if (op.type == TransformOperationType::Identity &&
        !result.operations.empty()) {
      continue;
    }
    result.operations.push_back(op);
  }
  for (const auto& op : rhs.operations) {
    if (op.type == TransformOperationType::Identity &&
        !result.operations.empty()) {
      continue;
    }
    result.operations.push_back(op);
  }

  auto lhs00 = lhs.matrix[0];
  auto lhs01 = lhs.matrix[1];
  auto lhs02 = lhs.matrix[2];
  auto lhs03 = lhs.matrix[3];
  auto lhs10 = lhs.matrix[4];
  auto lhs11 = lhs.matrix[5];
  auto lhs12 = lhs.matrix[6];
  auto lhs13 = lhs.matrix[7];
  auto lhs20 = lhs.matrix[8];
  auto lhs21 = lhs.matrix[9];
  auto lhs22 = lhs.matrix[10];
  auto lhs23 = lhs.matrix[11];
  auto lhs30 = lhs.matrix[12];
  auto lhs31 = lhs.matrix[13];
  auto lhs32 = lhs.matrix[14];
  auto lhs33 = lhs.matrix[15];

  auto rhs0 = rhs.matrix[0];
  auto rhs1 = rhs.matrix[1];
  auto rhs2 = rhs.matrix[2];
  auto rhs3 = rhs.matrix[3];
  result.matrix[0] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[1] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[2] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[3] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[4];
  rhs1 = rhs.matrix[5];
  rhs2 = rhs.matrix[6];
  rhs3 = rhs.matrix[7];
  result.matrix[4] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[5] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[6] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[7] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[8];
  rhs1 = rhs.matrix[9];
  rhs2 = rhs.matrix[10];
  rhs3 = rhs.matrix[11];
  result.matrix[8] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[9] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[10] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[11] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[12];
  rhs1 = rhs.matrix[13];
  rhs2 = rhs.matrix[14];
  rhs3 = rhs.matrix[15];
  result.matrix[12] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[13] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[14] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[15] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  return result;
}

Float& Transform::at(int i, int j) noexcept {
  return matrix[(i * 4) + j];
}

const Float& Transform::at(int i, int j) const noexcept {
  return matrix[(i * 4) + j];
}

Point operator*(const Point& point, const Transform& transform) {
  if (transform == Transform::Identity()) {
    return point;
  }

  auto result = transform * Vector{.x = point.x, .y = point.y, .z = 0, .w = 1};

  return {.x = result.x, .y = result.y};
}

Rect operator*(const Rect& rect, const Transform& transform) {
  auto center = rect.getCenter();
  return transform.applyWithCenter(rect, center);
}

Rect Transform::applyWithCenter(const Rect& rect, const Point& center) const {
  auto a = Point{.x = rect.origin.x, .y = rect.origin.y} - center;
  auto b = Point{.x = rect.getMaxX(), .y = rect.origin.y} - center;
  auto c = Point{.x = rect.getMaxX(), .y = rect.getMaxY()} - center;
  auto d = Point{.x = rect.origin.x, .y = rect.getMaxY()} - center;

  auto vectorA = *this * Vector{.x = a.x, .y = a.y, .z = 0, .w = 1};
  auto vectorB = *this * Vector{.x = b.x, .y = b.y, .z = 0, .w = 1};
  auto vectorC = *this * Vector{.x = c.x, .y = c.y, .z = 0, .w = 1};
  auto vectorD = *this * Vector{.x = d.x, .y = d.y, .z = 0, .w = 1};

  Point transformedA{.x = vectorA.x + center.x, .y = vectorA.y + center.y};
  Point transformedB{.x = vectorB.x + center.x, .y = vectorB.y + center.y};
  Point transformedC{.x = vectorC.x + center.x, .y = vectorC.y + center.y};
  Point transformedD{.x = vectorD.x + center.x, .y = vectorD.y + center.y};

  return Rect::boundingRect(
      transformedA, transformedB, transformedC, transformedD);
}

EdgeInsets operator*(const EdgeInsets& edgeInsets, const Transform& transform) {
  return EdgeInsets{
      edgeInsets.left * transform.matrix[0],
      edgeInsets.top * transform.matrix[5],
      edgeInsets.right * transform.matrix[0],
      edgeInsets.bottom * transform.matrix[5]};
}

Vector operator*(const Transform& transform, const Vector& vector) {
  return {
      .x = vector.x * transform.at(0, 0) + vector.y * transform.at(1, 0) +
          vector.z * transform.at(2, 0) + vector.w * transform.at(3, 0),
      .y = vector.x * transform.at(0, 1) + vector.y * transform.at(1, 1) +
          vector.z * transform.at(2, 1) + vector.w * transform.at(3, 1),
      .z = vector.x * transform.at(0, 2) + vector.y * transform.at(1, 2) +
          vector.z * transform.at(2, 2) + vector.w * transform.at(3, 2),
      .w = vector.x * transform.at(0, 3) + vector.y * transform.at(1, 3) +
          vector.z * transform.at(2, 3) + vector.w * transform.at(3, 3),
  };
}

Size operator*(const Size& size, const Transform& transform) {
  if (transform == Transform::Identity()) {
    return size;
  }

  auto result = Size{};
  result.width = std::abs(transform.at(0, 0) * size.width);
  result.height = std::abs(transform.at(1, 1) * size.height);

  return result;
}

} // namespace facebook::react
