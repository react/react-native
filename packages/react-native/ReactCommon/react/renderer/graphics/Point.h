/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

/*
 * Contains a point in a two-dimensional coordinate system.
 */
struct Point {
  Float x{0};
  Float y{0};

  inline Point &operator+=(const Point &point) noexcept
  {
    x += point.x;
    y += point.y;
    return *this;
  }

  inline Point &operator-=(const Point &point) noexcept
  {
    x -= point.x;
    y -= point.y;
    return *this;
  }

  inline Point &operator*=(const Point &point) noexcept
  {
    x *= point.x;
    y *= point.y;
    return *this;
  }

  inline Point operator+(const Point &rhs) const noexcept
  {
    return {
        .x = this->x + rhs.x,
        .y = this->y + rhs.y,
    };
  }
  inline Point operator-(const Point &rhs) const noexcept
  {
    return {
        .x = this->x - rhs.x,
        .y = this->y - rhs.y,
    };
  }

  inline Point operator-() const noexcept
  {
    return {
        .x = -x,
        .y = -y,
    };
  }

  inline bool operator==(const Point &rhs) const = default;
};

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::Point> {
  inline size_t operator()(const facebook::react::Point &point) const noexcept
  {
    return facebook::react::hash_combine(point.x, point.y);
  }
};

} // namespace std
