/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <vector>

namespace facebook::react {

enum class ColorScheme : uint8_t {
  Light,
  Dark,
};

enum class Orientation : uint8_t {
  Portrait,
  Landscape,
};

/*
 * Indices of the matching conditions for each conditional prop (aligned with
 * `StyleConditionData::styleConditionProps`); `kNoMatchingCondition` means no
 * condition matches and the property's inline default applies.
 */
using StyleConditionResolution = std::vector<int32_t>;

constexpr int32_t kNoMatchingCondition = -1;

} // namespace facebook::react
