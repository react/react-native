/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

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

/*
 * A margin value that is either an absolute length in points or a percentage
 * of the size it is resolved against.
 */
struct MarginValue {
  Float value{};
  bool isPercentage{false};

  bool operator==(const MarginValue &rhs) const noexcept = default;
};

/*
 * EdgeMargins
 */
using EdgeMargins = RectangleEdges<MarginValue>;

/*
 * Resolves margins into absolute insets against the given size.
 * Percentages on the vertical edges resolve against the height, and those on
 * the horizontal edges resolve against the width.
 *
 * This intentionally matches Chrome, Firefox, and Safari's rootMargin behavior
 * rather than the spec, which says "Percentages are resolved relative to the
 * width of the undilated rectangle." Chrome and Safari also use height for
 * vertical scrollMargin percentages. A width-only change is unlikely to be
 * web-compatible, so preserve browser parity here.
 * https://w3c.github.io/IntersectionObserver/#root-intersection-rectangle
 * https://issues.chromium.org/issues/40725112
 * Chromium's ResolveMargin uses height for top/bottom and width for left/right:
 * https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/intersection_observer/intersection_geometry.cc
 */
inline EdgeInsets resolveEdgeMargins(const EdgeMargins &margins, const Size &size) noexcept
{
  const auto resolve = [](const MarginValue &margin, Float basis) {
    return margin.isPercentage ? margin.value / 100.0f * basis : margin.value;
  };

  return EdgeInsets{
      resolve(margins.left, size.width),
      resolve(margins.top, size.height),
      resolve(margins.right, size.width),
      resolve(margins.bottom, size.height)};
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
