/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

namespace facebook::react {

/*
 * Calculates a list of view mutations which describes how the old
 * `ShadowTree` can be transformed to the new one.
 * The list of mutations might be and might not be optimal.
 */
ShadowViewMutation::List calculateShadowViewMutations(
    const ShadowNode& oldRootShadowNode,
    const ShadowNode& newRootShadowNode);

} // namespace facebook::react
