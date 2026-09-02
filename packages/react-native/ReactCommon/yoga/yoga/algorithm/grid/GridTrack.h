/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/style/GridTrackSize.h>

namespace facebook::yoga {

// https://www.w3.org/TR/css-grid-1/#algo-track-sizing
struct GridTrack {
  // Mutable state used by the track sizing algorithm
  // https://www.w3.org/TR/css-grid-1/#base-size
  float baseSize = 0.0f;
  // https://www.w3.org/TR/css-grid-1/#growth-limit
  float growthLimit = 0.0f;
  // https://www.w3.org/TR/css-grid-1/#infinitely-growable
  bool infinitelyGrowable = false;

  explicit GridTrack(const GridTrackSize& ts) : trackSize_(ts) {}

  const GridTrackSize& trackSize() const {
    return trackSize_;
  }

 private:
  // Sizing functions for this track, immutable after construction
  GridTrackSize trackSize_;
};

} // namespace facebook::yoga
