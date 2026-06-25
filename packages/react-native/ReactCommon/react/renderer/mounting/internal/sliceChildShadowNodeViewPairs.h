/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <deque>

#include "CullingContext.h"

namespace facebook::react {

struct ShadowViewNodePair;

/**
 * During differ, we need to keep some `ShadowViewNodePair`s in memory.
 * Some `ShadowViewNodePair`s are referenced from std::vectors returned
 * by `sliceChildShadowNodeViewPairs`; some are referenced in maps
 * for view (un)flattening especially; and it is not always clear which
 * std::vectors will outlive which maps, and vice-versa, so it doesn't
 * make sense for the std::vector or map to own any `ShadowViewNodePair`s.
 *
 * Thus, we introduce the concept of a scope.
 *
 * For the duration of some operation, we keep a ViewNodePairScope around, such
 * that: (1) the ViewNodePairScope keeps each
 * ShadowViewNodePair alive, (2) we have a stable pointer value that we can
 * use to reference each ShadowViewNodePair (not guaranteed with std::vector,
 * for example, which may have to resize and move values around).
 *
 * As long as we only manipulate the data-structure with push_back, std::deque
 * both (1) ensures that pointers into the data-structure are never invalidated,
 * and (2) tries to efficiently allocate storage such that as many objects as
 * possible are close in memory, but does not guarantee adjacency.
 */
using ViewNodePairScope = std::deque<ShadowViewNodePair>;

/**
 * Generates a list of `ShadowViewNodePair`s that represents a layer of a
 * flattened view hierarchy. The V2 version preserves nodes even if they do
 * not form views and their children are flattened.
 */
std::vector<ShadowViewNodePair *> sliceChildShadowNodeViewPairs(
    const ShadowViewNodePair &shadowNodePair,
    ViewNodePairScope &viewNodePairScope,
    bool allowFlattened,
    Point layoutOffset,
    const CullingContext &cullingContext);

} // namespace facebook::react
