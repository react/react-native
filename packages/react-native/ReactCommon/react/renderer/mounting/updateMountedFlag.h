/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/ShadowTree.h>

namespace facebook::react {
/*
 * Traverses the shadow tree and updates the `mounted` flag on all nodes.
 */
void updateMountedFlag(
    const std::vector<std::shared_ptr<const ShadowNode>>& oldChildren,
    const std::vector<std::shared_ptr<const ShadowNode>>& newChildren,
    ShadowTreeCommitSource commitSource);
} // namespace facebook::react
