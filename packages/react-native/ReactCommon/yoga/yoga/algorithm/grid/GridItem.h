/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/enums/Dimension.h>
#include <yoga/node/Node.h>
#include <cstddef>
#include <map>
#include <vector>

namespace facebook::yoga {

// A grid item with its resolved position in the grid. Positions are set by the
// auto-placement algorithm and consumed by the track sizing algorithm.
struct GridItem {
  size_t columnStart;
  size_t columnEnd;
  size_t rowStart;
  size_t rowEnd;
  yoga::Node* node;

  // Additional offset added to item to align baselines
  // https://www.w3.org/TR/css-grid-1/#algo-baseline-shims
  float baselineShim = 0.0f;

  // Flags used for optimizations in track sizing algorithm.
  bool crossesIntrinsicRow = false;
  bool crossesIntrinsicColumn = false;
  bool crossesFlexibleRow = false;
  bool crossesFlexibleColumn = false;

  GridItem(
      size_t columnStart,
      size_t columnEnd,
      size_t rowStart,
      size_t rowEnd,
      yoga::Node* node,
      float baselineShim = 0.0f)
      : columnStart(columnStart),
        columnEnd(columnEnd),
        rowStart(rowStart),
        rowEnd(rowEnd),
        node(node),
        baselineShim(baselineShim) {}

  // Helper functions used by the track sizing algorithm
  bool crossesIntrinsicTrack(Dimension dimension) const {
    return dimension == Dimension::Width ? crossesIntrinsicColumn
                                         : crossesIntrinsicRow;
  }
  bool crossesFlexibleTrack(Dimension dimension) const {
    return dimension == Dimension::Width ? crossesFlexibleColumn
                                         : crossesFlexibleRow;
  }
};

// Baseline sharing groups - items grouped by their starting row for the
// resolve intrinsic size step in track sizing algorithm.
// https://www.w3.org/TR/css-grid-1/#algo-baseline-shims
using BaselineItemGroups = std::map<size_t, std::vector<GridItem*>>;

} // namespace facebook::yoga
