/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/animationbackend/AnimatedProps.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <vector>

namespace facebook::react::animationbackend {

/**
 * Packs an AnimatedProps object for a single view directly into the buffer
 * protocol used by the synchronous batched update path on Android.
 */
void packDynamicPropsToBuffers(
    Tag tag,
    const AnimatedProps &animatedProps,
    std::vector<int> &intBuffer,
    std::vector<double> &doubleBuffer);

} // namespace facebook::react::animationbackend
