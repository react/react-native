/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/algorithm/grid/AutoPlacement.h>

#include <yoga/algorithm/grid/LinePlacement.h>
#include <yoga/algorithm/grid/OccupancyGrid.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/node/Node.h>
#include <yoga/style/GridLine.h>

#include <algorithm>
#include <array>
#include <cstddef>
#include <cstdint>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

namespace facebook::yoga {

namespace {

bool isPlaceable(const Node* child) {
  return child->style().positionType() != PositionType::Absolute &&
      child->style().display() != Display::None;
}

} // namespace

// 8.5. Grid Item Placement Algorithm
// https://www.w3.org/TR/css-grid-1/#auto-placement-algo
AutoPlacement AutoPlacement::performAutoPlacement(Node* node) {
  std::vector<AutoPlacementItem> items;
  items.reserve(node->getChildCount());
  std::unordered_set<Node*> placedItems;
  placedItems.reserve(node->getChildCount());

  int32_t minColumnStart = 0;
  int32_t minRowStart = 0;
  int32_t maxColumnEnd =
      static_cast<int32_t>(node->style().gridTemplateColumns().size());
  int32_t maxRowEnd =
      static_cast<int32_t>(node->style().gridTemplateRows().size());
  OccupancyGrid occupancy;
  occupancy.occupied.reserve(node->getChildCount());

  // Records a placed grid area and updates the running grid bounds.
  const auto recordGridArea = [&](const AutoPlacementItem& area) {
    yoga::assertFatal(
        area.columnEnd > area.columnStart,
        "Grid item column end must be greater than column start");
    yoga::assertFatal(
        area.rowEnd > area.rowStart,
        "Grid item row end must be greater than row start");
    items.push_back(area);
    placedItems.insert(area.node);
    occupancy.markOccupied(
        area.rowStart, area.rowEnd, area.columnStart, area.columnEnd);
    minColumnStart = std::min(minColumnStart, area.columnStart);
    minRowStart = std::min(minRowStart, area.rowStart);
    maxColumnEnd = std::max(maxColumnEnd, area.columnEnd);
    maxRowEnd = std::max(maxRowEnd, area.rowEnd);
  };

  const auto explicitColumnLineCount =
      static_cast<int32_t>(node->style().gridTemplateColumns().size() + 1);
  const auto explicitRowLineCount =
      static_cast<int32_t>(node->style().gridTemplateRows().size() + 1);

  // Step 1: Position anything that is not auto-positioned. In level 1 a span is
  // always definite (default 1), so an item is definitely positioned when both
  // its row and column have at least one integer line.
  for (Node* child : node->getLayoutChildren()) {
    if (!isPlaceable(child)) {
      continue;
    }

    const auto& gridItemColumnStart = child->style().gridColumnStart();
    const auto& gridItemColumnEnd = child->style().gridColumnEnd();
    const auto& gridItemRowStart = child->style().gridRowStart();
    const auto& gridItemRowEnd = child->style().gridRowEnd();
    const bool hasDefiniteColumn = isDefiniteLine(gridItemColumnStart) ||
        isDefiniteLine(gridItemColumnEnd);
    const bool hasDefiniteRow =
        isDefiniteLine(gridItemRowStart) || isDefiniteLine(gridItemRowEnd);

    if (hasDefiniteColumn && hasDefiniteRow) {
      const auto columnPlacement = resolveLinePlacement(
          gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount);
      const auto rowPlacement = resolveLinePlacement(
          gridItemRowStart, gridItemRowEnd, explicitRowLineCount);

      recordGridArea(
          AutoPlacementItem{
              .columnStart = columnPlacement.start,
              .columnEnd = columnPlacement.end,
              .rowStart = rowPlacement.start,
              .rowEnd = rowPlacement.end,
              .node = child});
    }
  }

  // Step 2: Process the items locked to a given row (definite row, no definite
  // column), placing each into the first non-overlapping slot to its right.
  std::unordered_map<int32_t, int32_t> rowStartToColumnStartCache;
  for (Node* child : node->getLayoutChildren()) {
    if (!isPlaceable(child)) {
      continue;
    }

    const auto& gridItemColumnStart = child->style().gridColumnStart();
    const auto& gridItemColumnEnd = child->style().gridColumnEnd();
    const auto& gridItemRowStart = child->style().gridRowStart();
    const auto& gridItemRowEnd = child->style().gridRowEnd();
    const bool hasDefiniteColumn = isDefiniteLine(gridItemColumnStart) ||
        isDefiniteLine(gridItemColumnEnd);
    const bool hasDefiniteRow =
        isDefiniteLine(gridItemRowStart) || isDefiniteLine(gridItemRowEnd);

    if (hasDefiniteRow && !hasDefiniteColumn) {
      const auto rowPlacement = resolveLinePlacement(
          gridItemRowStart, gridItemRowEnd, explicitRowLineCount);
      const auto rowStart = rowPlacement.start;
      const auto rowEnd = rowPlacement.end;

      const auto columnSpan =
          resolveLinePlacement(
              gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount)
              .span;

      auto columnStart = rowStartToColumnStartCache.contains(rowStart)
          ? rowStartToColumnStartCache[rowStart]
          : minColumnStart;
      auto columnEnd = columnStart + columnSpan;

      while (const auto* overlap = occupancy.hasOverlap(
                 rowStart, rowEnd, columnStart, columnEnd)) {
        columnStart = overlap->columnEnd;
        columnEnd = columnStart + columnSpan;
      }

      recordGridArea(
          AutoPlacementItem{
              .columnStart = columnStart,
              .columnEnd = columnEnd,
              .rowStart = rowStart,
              .rowEnd = rowEnd,
              .node = child});
      rowStartToColumnStartCache[rowStart] = columnEnd;
    }
  }

  // Step 3: Determine the columns of the implicit grid, accounting for definite
  // columns that extend the grid and for the largest auto-placed column span.
  auto largestColumnSpan = 1;
  for (Node* child : node->getLayoutChildren()) {
    if (!isPlaceable(child)) {
      continue;
    }

    const auto& gridItemColumnStart = child->style().gridColumnStart();
    const auto& gridItemColumnEnd = child->style().gridColumnEnd();
    const bool hasDefiniteColumn = isDefiniteLine(gridItemColumnStart) ||
        isDefiniteLine(gridItemColumnEnd);

    const auto columnPlacement = resolveLinePlacement(
        gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount);
    if (hasDefiniteColumn) {
      minColumnStart = std::min(minColumnStart, columnPlacement.start);
      maxColumnEnd = std::max(maxColumnEnd, columnPlacement.end);
    } else {
      largestColumnSpan = std::max(largestColumnSpan, columnPlacement.span);
    }
  }

  // If the largest span is wider than the current grid, extend the end.
  const auto currentGridWidth = maxColumnEnd - minColumnStart;
  if (largestColumnSpan > currentGridWidth) {
    maxColumnEnd = minColumnStart + largestColumnSpan;
  }

  // Step 4: Position the remaining grid items using the auto-placement cursor.
  std::array<int32_t, 2> autoPlacementCursor = {minColumnStart, minRowStart};
  for (Node* child : node->getLayoutChildren()) {
    if (!isPlaceable(child) || placedItems.contains(child)) {
      continue;
    }

    const auto& gridItemColumnStart = child->style().gridColumnStart();
    const auto& gridItemColumnEnd = child->style().gridColumnEnd();
    const auto& gridItemRowStart = child->style().gridRowStart();
    const auto& gridItemRowEnd = child->style().gridRowEnd();
    const bool hasDefiniteColumn = isDefiniteLine(gridItemColumnStart) ||
        isDefiniteLine(gridItemColumnEnd);
    const bool hasDefiniteRow =
        isDefiniteLine(gridItemRowStart) || isDefiniteLine(gridItemRowEnd);

    const auto columnPlacement = resolveLinePlacement(
        gridItemColumnStart, gridItemColumnEnd, explicitColumnLineCount);
    const auto rowPlacement = resolveLinePlacement(
        gridItemRowStart, gridItemRowEnd, explicitRowLineCount);

    // If the item has a definite column position, keep it and search downward
    // for a row where it does not overlap an occupied cell.
    if (hasDefiniteColumn) {
      const auto columnStart = columnPlacement.start;
      const auto columnEnd = columnPlacement.end;

      // Set the cursor to the item's column-start line; if that moves the
      // cursor backwards, advance to the next row.
      const auto previousColumnPosition = autoPlacementCursor[0];
      autoPlacementCursor[0] = columnStart;
      if (autoPlacementCursor[0] < previousColumnPosition) {
        autoPlacementCursor[1]++;
      }

      const auto rowSpan = rowPlacement.span;
      while (const auto* overlap = occupancy.hasOverlap(
                 autoPlacementCursor[1],
                 autoPlacementCursor[1] + rowSpan,
                 columnStart,
                 columnEnd)) {
        autoPlacementCursor[1] = overlap->rowEnd;
      }

      recordGridArea(
          AutoPlacementItem{
              .columnStart = columnStart,
              .columnEnd = columnEnd,
              .rowStart = autoPlacementCursor[1],
              .rowEnd = autoPlacementCursor[1] + rowSpan,
              .node = child});
    }
    // If the item has an automatic position in both axes, sweep the cursor
    // left-to-right then top-to-bottom until it fits.
    else if (!hasDefiniteRow) {
      const auto itemColumnSpan = columnPlacement.span;
      const auto itemRowSpan = rowPlacement.span;

      bool foundPosition = false;
      while (!foundPosition) {
        while (autoPlacementCursor[0] + itemColumnSpan <= maxColumnEnd) {
          const auto columnStart = autoPlacementCursor[0];
          const auto columnEnd = columnStart + itemColumnSpan;
          const auto rowStart = autoPlacementCursor[1];
          const auto rowEnd = rowStart + itemRowSpan;

          if (const auto* overlap = occupancy.hasOverlap(
                  rowStart, rowEnd, columnStart, columnEnd)) {
            autoPlacementCursor[0] = overlap->columnEnd;
          } else {
            recordGridArea(
                AutoPlacementItem{
                    .columnStart = columnStart,
                    .columnEnd = columnEnd,
                    .rowStart = rowStart,
                    .rowEnd = rowEnd,
                    .node = child});
            foundPosition = true;
            break;
          }
        }

        if (!foundPosition) {
          // Cursor overflowed the grid width; move to the next row.
          autoPlacementCursor[1]++;
          autoPlacementCursor[0] = minColumnStart;
        }
      }
    }
  }

  return AutoPlacement{
      .gridItems = std::move(items),
      .minColumnStart = minColumnStart,
      .minRowStart = minRowStart,
      .maxColumnEnd = maxColumnEnd,
      .maxRowEnd = maxRowEnd};
}

// 1. Runs the grid placement algorithm and normalizes the output into the
// 0-based coordinate space.
// 2. Builds the baseline sharing groups for each row.
ResolvedAutoPlacement ResolvedAutoPlacement::resolveGridItemPlacements(
    Node* node) {
  const AutoPlacement autoPlacement = AutoPlacement::performAutoPlacement(node);

  const int32_t minColumnStart = autoPlacement.minColumnStart;
  const int32_t minRowStart = autoPlacement.minRowStart;

  ResolvedAutoPlacement resolved;
  resolved.minColumnStart = minColumnStart;
  resolved.minRowStart = minRowStart;
  resolved.maxColumnEnd = autoPlacement.maxColumnEnd;
  resolved.maxRowEnd = autoPlacement.maxRowEnd;

  resolved.gridItems.reserve(autoPlacement.gridItems.size());

  const Align alignItems = node->style().alignItems();

  for (const auto& placement : autoPlacement.gridItems) {
    resolved.gridItems.emplace_back(
        static_cast<size_t>(placement.columnStart - minColumnStart),
        static_cast<size_t>(placement.columnEnd - minColumnStart),
        static_cast<size_t>(placement.rowStart - minRowStart),
        static_cast<size_t>(placement.rowEnd - minRowStart),
        placement.node);

    GridItem& item = resolved.gridItems.back();
    Align alignSelf = item.node->style().alignSelf();
    if (alignSelf == Align::Auto) {
      alignSelf = alignItems;
    }
    // https://www.w3.org/TR/css-grid-1/#algo-baseline-shims - only items that
    // span a single row participate in a row's baseline sharing group.
    const bool spansOneRow = (item.rowEnd - item.rowStart) == 1;
    if (alignSelf == Align::Baseline && spansOneRow) {
      resolved.baselineItemGroups[item.rowStart].push_back(&item);
    }
  }

  return resolved;
}

} // namespace facebook::yoga
