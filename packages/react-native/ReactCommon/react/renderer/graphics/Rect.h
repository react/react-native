/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <tuple>

#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/Size.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

/*
 * Contains the location and dimensions of a rectangle.
 */
struct Rect {
  Point origin{.x = 0, .y = 0};
  Size size{.width = 0, .height = 0};

  bool operator==(const Rect &rhs) const noexcept = default;

  Float getMaxX() const noexcept
  {
    return size.width > 0 ? origin.x + size.width : origin.x;
  }
  Float getMaxY() const noexcept
  {
    return size.height > 0 ? origin.y + size.height : origin.y;
  }
  Float getMinX() const noexcept
  {
    return size.width >= 0 ? origin.x : origin.x + size.width;
  }
  Float getMinY() const noexcept
  {
    return size.height >= 0 ? origin.y : origin.y + size.height;
  }
  Float getMidX() const noexcept
  {
    return origin.x + size.width / 2;
  }
  Float getMidY() const noexcept
  {
    return origin.y + size.height / 2;
  }
  Point getCenter() const noexcept
  {
    return {.x = getMidX(), .y = getMidY()};
  }

  void unionInPlace(const Rect &rect) noexcept
  {
    auto x1 = std::min(getMinX(), rect.getMinX());
    auto y1 = std::min(getMinY(), rect.getMinY());
    auto x2 = std::max(getMaxX(), rect.getMaxX());
    auto y2 = std::max(getMaxY(), rect.getMaxY());
    origin = {.x = x1, .y = y1};
    size = {.width = x2 - x1, .height = y2 - y1};
  }

  bool containsPoint(Point point) noexcept
  {
    return point.x >= origin.x && point.y >= origin.y && point.x <= (origin.x + size.width) &&
        point.y <= (origin.y + size.height);
  }

  static Rect intersect(const Rect &rect1, const Rect &rect2)
  {
    Float x1 = std::max(rect1.origin.x, rect2.origin.x);
    Float y1 = std::max(rect1.origin.y, rect2.origin.y);
    Float x2 = std::min(rect1.origin.x + rect1.size.width, rect2.origin.x + rect2.size.width);
    Float y2 = std::min(rect1.origin.y + rect1.size.height, rect2.origin.y + rect2.size.height);

    Float intersectionWidth = x2 - x1;
    Float intersectionHeight = y2 - y1;

    if (intersectionWidth < 0 || intersectionHeight < 0) {
      return {};
    }

    return {.origin = {.x = x1, .y = y1}, .size = {.width = intersectionWidth, .height = intersectionHeight}};
  }

  static Rect boundingRect(const Point &a, const Point &b, const Point &c, const Point &d) noexcept
  {
    auto leftTopPoint = a;
    auto rightBottomPoint = a;

    leftTopPoint.x = std::min(leftTopPoint.x, b.x);
    leftTopPoint.x = std::min(leftTopPoint.x, c.x);
    leftTopPoint.x = std::min(leftTopPoint.x, d.x);

    leftTopPoint.y = std::min(leftTopPoint.y, b.y);
    leftTopPoint.y = std::min(leftTopPoint.y, c.y);
    leftTopPoint.y = std::min(leftTopPoint.y, d.y);

    rightBottomPoint.x = std::max(rightBottomPoint.x, b.x);
    rightBottomPoint.x = std::max(rightBottomPoint.x, c.x);
    rightBottomPoint.x = std::max(rightBottomPoint.x, d.x);

    rightBottomPoint.y = std::max(rightBottomPoint.y, b.y);
    rightBottomPoint.y = std::max(rightBottomPoint.y, c.y);
    rightBottomPoint.y = std::max(rightBottomPoint.y, d.y);

    return {
        .origin = leftTopPoint,
        .size = {.width = rightBottomPoint.x - leftTopPoint.x, .height = rightBottomPoint.y - leftTopPoint.y}};
  }
};

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::Rect> {
  size_t operator()(const facebook::react::Rect &rect) const noexcept
  {
    return facebook::react::hash_combine(rect.origin, rect.size);
  }
};

} // namespace std
