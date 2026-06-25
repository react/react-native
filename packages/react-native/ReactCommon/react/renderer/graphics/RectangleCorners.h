/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <react/renderer/graphics/Float.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

/*
 * Generic data structure describes some values associated with *corners*
 * of a rectangle.
 */
template <typename T>
struct RectangleCorners {
  T topLeft{};
  T topRight{};
  T bottomLeft{};
  T bottomRight{};

  bool operator==(const RectangleCorners<T> &rhs) const noexcept = default;

  bool isUniform() const noexcept
  {
    return topLeft == topRight && topLeft == bottomLeft && topLeft == bottomRight;
  }
};

/*
 * CornerInsets
 */
using CornerInsets = RectangleCorners<Float>;

} // namespace facebook::react

namespace std {

template <typename T>
struct hash<facebook::react::RectangleCorners<T>> {
  size_t operator()(const facebook::react::RectangleCorners<T> &corners) const noexcept
  {
    return facebook::react::hash_combine(corners.topLeft, corners.bottomLeft, corners.topRight, corners.bottomRight);
  }
};

} // namespace std
