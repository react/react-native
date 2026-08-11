/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include <string_view>

namespace facebook::react {

static constexpr std::string_view ExtrapolateTypeIdentity = "identity";
static constexpr std::string_view ExtrapolateTypeClamp = "clamp";
static constexpr std::string_view ExtrapolateTypeExtend = "extend";

static constexpr double SingleFrameIntervalMs = 1000.0 / 60.0;

static constexpr double TicksPerMs = 10000.0; // ticks are 100 nanoseconds

inline double interpolate(
    double inputValue,
    double inputMin,
    double inputMax,
    double outputMin,
    double outputMax,
    std::string_view extrapolateLeft,
    std::string_view extrapolateRight) {
  auto result = inputValue;

  // Extrapolate
  if (result < inputMin) {
    if (extrapolateLeft == ExtrapolateTypeIdentity) {
      return result;
    } else if (extrapolateLeft == ExtrapolateTypeClamp) {
      result = inputMin;
    }
  }

  if (result > inputMax) {
    if (extrapolateRight == ExtrapolateTypeIdentity) {
      return result;
    } else if (extrapolateRight == ExtrapolateTypeClamp) {
      result = inputMax;
    }
  }

  if (inputMin == inputMax) {
    if (inputValue <= inputMin) {
      return outputMin;
    }
    return outputMax;
  }

  return outputMin +
      (outputMax - outputMin) * (result - inputMin) / (inputMax - inputMin);
}

} // namespace facebook::react
