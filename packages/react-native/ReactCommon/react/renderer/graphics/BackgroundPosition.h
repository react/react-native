/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ValueUnit.h>
#include <optional>

namespace facebook::react {

struct BackgroundPosition {
  std::optional<ValueUnit> top;
  std::optional<ValueUnit> left;
  std::optional<ValueUnit> right;
  std::optional<ValueUnit> bottom;

  BackgroundPosition() : top(ValueUnit{0.0f, UnitType::Point}), left(ValueUnit{0.0f, UnitType::Point}) {}

  bool operator==(const BackgroundPosition &other) const = default;
};

} // namespace facebook::react
