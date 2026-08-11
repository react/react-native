/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>

namespace facebook::react {

/*
 * Convenience functions for rounding float values to be aligned with a device
 * pixel grid.
 *
 * Usage example:
 *   auto scaleFactor = Float{3};
 *   auto value = Float{42.9001};
 *   auto crispValue = roundToPixel<&std::ceil>(value, scaleFactor);
 *   auto size = Size{value, value + 42.0};
 *   auto crispSize = roundToPixel<&std::ceil>(size, scaleFactor);
 */
template <Float (*RoundingFunction)(Float)>
Float roundToPixel(Float value, Float scaleFactor) {
  return RoundingFunction(value * scaleFactor) / scaleFactor;
}

template <Float (*RoundingFunction)(Float)>
Point roundToPixel(Point value, Float scaleFactor) {
  return Point{
      roundToPixel<RoundingFunction>(value.x, scaleFactor),
      roundToPixel<RoundingFunction>(value.y, scaleFactor)};
}

template <Float (*RoundingFunction)(Float)>
Size roundToPixel(Size value, Float scaleFactor) {
  return Size{
      roundToPixel<RoundingFunction>(value.width, scaleFactor),
      roundToPixel<RoundingFunction>(value.height, scaleFactor)};
}

template <Float (*RoundingFunction)(Float)>
Rect roundToPixel(Rect value, Float scaleFactor) {
  return Rect{
      roundToPixel<RoundingFunction>(value.origin),
      roundToPixel<RoundingFunction>(value.size)};
}

/*
 * GCC-based Android NDK does not have rounding functions as part of STL.
 */

inline float round(float value) noexcept {
  return ::roundf(value);
}
inline double round(double value) noexcept {
  return ::round(value);
}
inline long double round(long double value) noexcept {
  return ::roundl(value);
}
inline float ceil(float value) noexcept {
  return ::ceilf(value);
}
inline double ceil(double value) noexcept {
  return ::ceil(value);
}
inline long double ceil(long double value) noexcept {
  return ::ceill(value);
}
inline float floor(float value) noexcept {
  return ::floorf(value);
}
inline double floor(double value) noexcept {
  return ::floor(value);
}
inline long double floor(long double value) noexcept {
  return ::floorl(value);
}

} // namespace facebook::react
