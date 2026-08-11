/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>

namespace facebook::react {

constexpr float kDefaultEpsilon = 0.005f;

template <typename T>
inline bool
floatEquality(T a, T b, T epsilon = static_cast<T>(kDefaultEpsilon)) {
  return (std::isnan(a) && std::isnan(b)) ||
      (!std::isnan(a) && !std::isnan(b) && std::abs(a - b) < epsilon);
}

} // namespace facebook::react
