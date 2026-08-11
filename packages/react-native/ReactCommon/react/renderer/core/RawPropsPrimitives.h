/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <limits>

namespace facebook::react {

/*
 * Type used to represent an index of some stored values in small arrays.
 */
using RawPropsValueIndex = uint16_t;
static_assert(
    sizeof(RawPropsValueIndex) == 2,
    "RawPropsValueIndex must be two byte size.");
using RawPropsPropNameLength = uint16_t;
using RawPropsPropNameHash = uint32_t;

/*
 * Special value of `RawPropsValueIndex` which is used to represent `no value`.
 */
constexpr static RawPropsValueIndex kRawPropsValueIndexEmpty =
    std::numeric_limits<RawPropsValueIndex>::max();

/*
 * The maximum length of the prop name.
 * To process prop names efficiently we have to allocate the memory statically,
 * therefore we have to have a hard limit.
 * Can be increased up to 254.
 */
constexpr static auto kPropNameLengthHardCap = 64;

} // namespace facebook::react
