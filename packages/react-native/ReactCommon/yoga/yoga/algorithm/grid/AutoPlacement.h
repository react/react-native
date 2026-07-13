/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/algorithm/grid/GridItem.h>
#include <cstdint>
#include <vector>

namespace facebook::yoga {

class Node;

struct AutoPlacement {
  // A grid item's placement in the algorithm's signed coordinate space.
  struct AutoPlacementItem {
    int32_t columnStart;
    int32_t columnEnd;
    int32_t rowStart;
    int32_t rowEnd;
    Node* node;
  };

  std::vector<AutoPlacementItem> gridItems;
  int32_t minColumnStart;
  int32_t minRowStart;
  int32_t maxColumnEnd;
  int32_t maxRowEnd;

  // Runs the four-step auto-placement algorithm
  // (https://www.w3.org/TR/css-grid-1/#auto-placement-algo) over node's in-flow
  // children. Children that are display: none or absolutely positioned are
  // ignored.
  static AutoPlacement performAutoPlacement(Node* node);
};

// 1. Runs the grid placement algorithm and normalizes the output into the
// 0-based coordinate space.
// 2. Builds the baseline sharing groups for each row.
struct ResolvedAutoPlacement {
  // Items with resolved 0-based positions, in child order.
  std::vector<GridItem> gridItems;

  // Baseline-aligned items grouped by starting row.
  BaselineItemGroups baselineItemGroups;

  int32_t minColumnStart = 0;
  int32_t minRowStart = 0;
  int32_t maxColumnEnd = 0;
  int32_t maxRowEnd = 0;

  ResolvedAutoPlacement() = default;
  ResolvedAutoPlacement(ResolvedAutoPlacement&&) = default;
  ResolvedAutoPlacement& operator=(ResolvedAutoPlacement&&) = default;
  ResolvedAutoPlacement(const ResolvedAutoPlacement&) = delete;
  ResolvedAutoPlacement& operator=(const ResolvedAutoPlacement&) = delete;

  // Normalizes performAutoPlacement's output to 0-based size_t coordinates and
  // builds the baseline sharing groups.
  static ResolvedAutoPlacement resolveGridItemPlacements(Node* node);
};

} // namespace facebook::yoga
