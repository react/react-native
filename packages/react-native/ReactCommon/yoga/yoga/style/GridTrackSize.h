/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/style/StyleSizeLength.h>
#include <vector>

namespace facebook::yoga {
// Represents a track size as defined in
// https://www.w3.org/TR/css-grid-1/#typedef-track-size
// and helper functions for creating common track sizes.
struct GridTrackSize {
  StyleSizeLength minSizingFunction;
  StyleSizeLength maxSizingFunction;

  // Static factory methods for common cases
  constexpr static GridTrackSize auto_() {
    return GridTrackSize{
        .minSizingFunction = StyleSizeLength::ofAuto(),
        .maxSizingFunction = StyleSizeLength::ofAuto()};
  }

  constexpr static GridTrackSize length(float points) {
    auto len = StyleSizeLength::points(points);
    return GridTrackSize{.minSizingFunction = len, .maxSizingFunction = len};
  }

  constexpr static GridTrackSize fr(float fraction) {
    // Flex sizing function is always a max sizing function
    return GridTrackSize{
        .minSizingFunction = StyleSizeLength::ofAuto(),
        .maxSizingFunction = StyleSizeLength::stretch(fraction)};
  }

  constexpr static GridTrackSize percent(float percentage) {
    return GridTrackSize{
        .minSizingFunction = StyleSizeLength::percent(percentage),
        .maxSizingFunction = StyleSizeLength::percent(percentage)};
  }

  constexpr static GridTrackSize minmax(
      StyleSizeLength min,
      StyleSizeLength max) {
    return GridTrackSize{.minSizingFunction = min, .maxSizingFunction = max};
  }

  bool operator==(const GridTrackSize& other) const = default;
};

// Grid track list for grid-template-rows/columns properties
using GridTrackList = std::vector<GridTrackSize>;

} // namespace facebook::yoga
