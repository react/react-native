/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <react/renderer/core/ReactPrimitives.h>

namespace facebook::react::animated {
// Indicates that the animated node identifier is not defined.
// It is safe to use 0 because JavaScript starts assigning identifiers from 1.
// https://github.com/facebook/react-native/blob/main/packages/react-native/src/private/animated/NativeAnimatedHelper.js#L35
constexpr static Tag undefinedAnimatedNodeIdentifier = 0;
} // namespace facebook::react::animated
