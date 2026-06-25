/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/numeric/Comparison.h>
#include <limits>

namespace facebook::yoga {

struct FloatOptional {
 private:
  float value_ = std::numeric_limits<float>::quiet_NaN();

 public:
  explicit constexpr FloatOptional(float value) : value_(value) {}
  constexpr FloatOptional() = default;

  // returns the wrapped value, or a value x with YGIsUndefined(x) == true
  constexpr float unwrap() const {
    return value_;
  }

  constexpr float unwrapOrDefault(float defaultValue) const {
    return isUndefined() ? defaultValue : value_;
  }

  constexpr bool isUndefined() const {
    return yoga::isUndefined(value_);
  }

  constexpr bool isDefined() const {
    return yoga::isDefined(value_);
  }
};

// operators take FloatOptional by value, as it is a 32bit value

constexpr bool operator==(FloatOptional lhs, FloatOptional rhs) {
  return lhs.unwrap() == rhs.unwrap() ||
      (lhs.isUndefined() && rhs.isUndefined());
}

constexpr bool operator==(FloatOptional lhs, float rhs) {
  return lhs == FloatOptional{rhs};
}

constexpr bool operator==(float lhs, FloatOptional rhs) {
  return rhs == lhs;
}

constexpr FloatOptional operator+(FloatOptional lhs, FloatOptional rhs) {
  return FloatOptional{lhs.unwrap() + rhs.unwrap()};
}

constexpr bool operator>(FloatOptional lhs, FloatOptional rhs) {
  return lhs.unwrap() > rhs.unwrap();
}

constexpr bool operator<(FloatOptional lhs, FloatOptional rhs) {
  return lhs.unwrap() < rhs.unwrap();
}

constexpr bool operator>=(FloatOptional lhs, FloatOptional rhs) {
  return lhs > rhs || lhs == rhs;
}

constexpr bool operator<=(FloatOptional lhs, FloatOptional rhs) {
  return lhs < rhs || lhs == rhs;
}

constexpr FloatOptional maxOrDefined(FloatOptional lhs, FloatOptional rhs) {
  return FloatOptional{yoga::maxOrDefined(lhs.unwrap(), rhs.unwrap())};
}

inline bool inexactEquals(FloatOptional lhs, FloatOptional rhs) {
  return yoga::inexactEquals(lhs.unwrap(), rhs.unwrap());
}

} // namespace facebook::yoga
