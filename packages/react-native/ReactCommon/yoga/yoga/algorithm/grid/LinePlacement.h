/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/style/GridLine.h>
#include <cstdint>

namespace facebook::yoga {

// A resolved grid-line placement: a half-open [start, end) track interval plus
// its span. Line number can be negative to denote an implicit line before the
// explicit grid.
struct LinePlacement {
  int32_t start = 0;
  int32_t end = 0;
  int32_t span = 1;
};

inline bool isDefiniteLine(const GridLine& line) {
  return line.type == GridLineType::Integer && line.integer != 0;
}

// Handles placement errors as defined in
// https://www.w3.org/TR/css-grid-1/#grid-placement-errors and returns 0 index
// based line positions from user added grid-columns and grid-rows.
LinePlacement resolveLinePlacement(
    const GridLine& startLine,
    const GridLine& endLine,
    int32_t explicitLineCount);

} // namespace facebook::yoga
