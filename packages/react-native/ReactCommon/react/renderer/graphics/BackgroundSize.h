/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ValueUnit.h>
#include <variant>

namespace facebook::react {

struct BackgroundSizeLengthPercentage {
  std::variant<std::monostate, ValueUnit> x;
  std::variant<std::monostate, ValueUnit> y;

  BackgroundSizeLengthPercentage() : x(std::monostate{}), y(std::monostate{}) {}

  bool isXAuto() const
  {
    return std::holds_alternative<std::monostate>(x);
  }
  bool isYAuto() const
  {
    return std::holds_alternative<std::monostate>(y);
  }

  bool operator==(const BackgroundSizeLengthPercentage &other) const = default;
};

enum class BackgroundSizeKeyword { Cover, Contain };

// https://www.w3.org/TR/css-backgrounds-3/#background-size
using BackgroundSize = std::variant<BackgroundSizeKeyword, BackgroundSizeLengthPercentage>;

} // namespace facebook::react
