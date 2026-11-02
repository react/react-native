/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <CoreGraphics/CoreGraphics.h>
#include <limits>

namespace facebook::react {

/*
 * Exact type of float numbers which ideally should match a type behing
 * platform- and chip-architecture-specific float type.
 */
using Float = CGFloat;

} // namespace facebook::react
