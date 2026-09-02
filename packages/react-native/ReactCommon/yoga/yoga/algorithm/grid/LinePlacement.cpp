/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/algorithm/grid/LinePlacement.h>

namespace facebook::yoga {

LinePlacement resolveLinePlacement(
    const GridLine& startLine,
    const GridLine& endLine,
    int32_t explicitLineCount) {
  LinePlacement placement;

  // Normalize invalid inputs per CSS Grid: line 0 is not a valid line (treated
  // as auto), and a span must be at least 1 (an invalid 0 or negative span
  // becomes 1).
  const auto normalize = [](const GridLine& line) -> GridLine {
    if (line.type == GridLineType::Integer && line.integer == 0) {
      return GridLine::auto_();
    }
    if (line.type == GridLineType::Span && line.integer < 1) {
      return GridLine::span(1);
    }
    return line;
  };
  const GridLine start = normalize(startLine);
  const GridLine end = normalize(endLine);

  const auto resolveNegativeLineValue = [](int32_t lineValue,
                                           int32_t lineCount) -> int32_t {
    // Negative lines count back from the last line, e.g. -1 is the last line.
    return lineValue < 0 ? lineCount + lineValue + 1 : lineValue;
  };

  // If the placement for a grid item contains two lines.
  if (start.type == GridLineType::Integer &&
      end.type == GridLineType::Integer) {
    const auto normalizedStartLine =
        resolveNegativeLineValue(start.integer, explicitLineCount);
    const auto normalizedEndLine =
        resolveNegativeLineValue(end.integer, explicitLineCount);
    // If the start line is further end-ward than the end line, swap the two.
    if (normalizedStartLine > normalizedEndLine) {
      placement.start = normalizedEndLine;
      placement.end = normalizedStartLine;
      placement.span = placement.end - placement.start;
    }
    // If the start line is equal to the end line, remove the end line.
    else if (normalizedStartLine == normalizedEndLine) {
      placement.start = normalizedStartLine;
      placement.end = normalizedStartLine + 1;
      placement.span = 1;
    } else {
      placement.start = normalizedStartLine;
      placement.end = normalizedEndLine;
      placement.span = placement.end - placement.start;
    }
  }
  // If the placement contains two spans, remove the one contributed by the end
  // grid-placement property.
  else if (start.type == GridLineType::Span && end.type == GridLineType::Span) {
    placement.start = 0;
    placement.end = 0;
    placement.span = start.integer;
  } else if (
      start.type == GridLineType::Integer && end.type == GridLineType::Span) {
    const auto normalizedStartLine =
        resolveNegativeLineValue(start.integer, explicitLineCount);
    placement.start = normalizedStartLine;
    placement.span = end.integer;
    placement.end = placement.start + placement.span;
  } else if (
      start.type == GridLineType::Span && end.type == GridLineType::Integer) {
    const auto normalizedEndLine =
        resolveNegativeLineValue(end.integer, explicitLineCount);
    placement.end = normalizedEndLine;
    placement.span = start.integer;
    placement.start = placement.end - placement.span;
  } else if (start.type == GridLineType::Integer) {
    const auto normalizedStartLine =
        resolveNegativeLineValue(start.integer, explicitLineCount);
    placement.start = normalizedStartLine;
    placement.span = 1;
    placement.end = placement.start + placement.span;
  } else if (start.type == GridLineType::Span) {
    placement.span = start.integer;
    placement.start = 0;
    placement.end = 0;
  } else if (end.type == GridLineType::Integer) {
    const auto normalizedEndLine =
        resolveNegativeLineValue(end.integer, explicitLineCount);
    placement.end = normalizedEndLine;
    placement.span = 1;
    placement.start = placement.end - placement.span;
  } else if (end.type == GridLineType::Span) {
    placement.span = end.integer;
    placement.start = 0;
    placement.end = 0;
  } else {
    placement.start = 0;
    placement.end = 0;
    placement.span = 1;
  }

  // Grid lines above are 1-based; convert to 0-based track indices. Negative
  // values imply implicit grid lines before the explicit grid.
  placement.start = placement.start - 1;
  placement.end = placement.end - 1;

  return placement;
}

} // namespace facebook::yoga
