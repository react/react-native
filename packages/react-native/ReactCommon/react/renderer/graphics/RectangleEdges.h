/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Rect.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

/*
 * Generic data structure describes some values associated with *edges*
 * of a rectangle.
 */
template <typename T>
struct RectangleEdges {
  T left{};
  T top{};
  T right{};
  T bottom{};

  bool operator==(const RectangleEdges<T> &rhs) const noexcept = default;

  bool isUniform() const noexcept
  {
    return left == top && left == right && left == bottom;
  }

  static const RectangleEdges<T> ZERO;
};

template <typename T>
const RectangleEdges<T> RectangleEdges<T>::ZERO = {};

template <typename T>
RectangleEdges<T> operator+(const RectangleEdges<T> &lhs, const RectangleEdges<T> &rhs) noexcept
{
  return RectangleEdges<T>{lhs.left + rhs.left, lhs.top + rhs.top, lhs.right + rhs.right, lhs.bottom + rhs.bottom};
}

template <typename T>
RectangleEdges<T> operator-(const RectangleEdges<T> &lhs, const RectangleEdges<T> &rhs) noexcept
{
  return RectangleEdges<T>{lhs.left - rhs.left, lhs.top - rhs.top, lhs.right - rhs.right, lhs.bottom - rhs.bottom};
}

/*
 * EdgeInsets
 */
using EdgeInsets = RectangleEdges<Float>;

/*
 * Adjusts a rectangle by the given edge insets.
 */
inline Rect insetBy(const Rect &rect, const EdgeInsets &insets) noexcept
{
  return Rect{
      .origin = {.x = rect.origin.x + insets.left, .y = rect.origin.y + insets.top},
      .size = {
          .width = rect.size.width - insets.left - insets.right,
          .height = rect.size.height - insets.top - insets.bottom}};
}

/*
 * Adjusts a rectangle by the given edge outsets.
 */
inline Rect outsetBy(const Rect &rect, const EdgeInsets &outsets) noexcept
{
  return Rect{
      .origin = {.x = rect.origin.x - outsets.left, .y = rect.origin.y - outsets.top},
      .size = {
          .width = rect.size.width + outsets.left + outsets.right,
          .height = rect.size.height + outsets.top + outsets.bottom}};
}

} // namespace facebook::react

namespace std {

template <typename T>
struct hash<facebook::react::RectangleEdges<T>> {
  size_t operator()(const facebook::react::RectangleEdges<T> &edges) const noexcept
  {
    return facebook::react::hash_combine(edges.left, edges.right, edges.top, edges.bottom);
  }
};

} // namespace std
