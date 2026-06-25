/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/graphics/Size.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

/*
 * Unified layout constraints for measuring.
 */
struct LayoutConstraints {
  Size minimumSize{.width = 0, .height = 0};
  Size maximumSize{.width = std::numeric_limits<Float>::infinity(), .height = std::numeric_limits<Float>::infinity()};
  LayoutDirection layoutDirection{LayoutDirection::Undefined};

  /*
   * Clamps the provided `Size` between the `minimumSize` and `maximumSize`
   * bounds of this `LayoutConstraints`.
   */
  Size clamp(const Size &size) const;
};

inline bool operator==(const LayoutConstraints &lhs, const LayoutConstraints &rhs)
{
  return std::tie(lhs.minimumSize, lhs.maximumSize, lhs.layoutDirection) ==
      std::tie(rhs.minimumSize, rhs.maximumSize, rhs.layoutDirection);
}

} // namespace facebook::react

namespace std {
template <>
struct hash<facebook::react::LayoutConstraints> {
  size_t operator()(const facebook::react::LayoutConstraints &constraints) const
  {
    return facebook::react::hash_combine(constraints.minimumSize, constraints.maximumSize, constraints.layoutDirection);
  }
};
} // namespace std
