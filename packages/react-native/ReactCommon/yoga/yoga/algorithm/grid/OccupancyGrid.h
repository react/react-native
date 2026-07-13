/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <vector>

namespace facebook::yoga {

// Occupancy of the grid used by CSS Grid auto-placement.
// TODO(optimisation): Better data structure can be used than a flat vector
struct OccupancyGrid {
  struct Rect {
    int32_t rowStart;
    int32_t rowEnd;
    int32_t columnStart;
    int32_t columnEnd;
  };

  std::vector<Rect> occupied;

  void markOccupied(
      int32_t rowStart,
      int32_t rowEnd,
      int32_t columnStart,
      int32_t columnEnd) {
    occupied.push_back({rowStart, rowEnd, columnStart, columnEnd});
  }

  const Rect* hasOverlap(
      int32_t rowStart,
      int32_t rowEnd,
      int32_t columnStart,
      int32_t columnEnd) const {
    for (const auto& rect : occupied) {
      if (rect.rowStart < rowEnd && rect.rowEnd > rowStart &&
          rect.columnStart < columnEnd && rect.columnEnd > columnStart) {
        return &rect;
      }
    }
    return nullptr;
  }
};

} // namespace facebook::yoga
