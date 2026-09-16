/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <yoga/style/GridLine.h>
#include <yoga/style/GridTrack.h>

namespace facebook::yoga {

/**
 * The CSS Grid properties of a single node.
 */
struct GridStyle {
  // Grid container properties
  GridTrackList templateColumns{};
  GridTrackList templateRows{};
  GridTrackList autoColumns{};
  GridTrackList autoRows{};

  // Grid item properties
  GridLine columnStart{};
  GridLine columnEnd{};
  GridLine rowStart{};
  GridLine rowEnd{};

  bool operator==(const GridStyle& other) const = default;
};

/**
 * Storage for a GridStyle which stays empty until the first grid property is
 * set.
 */
class GridStyleStorage {
 public:
  GridStyleStorage() = default;
  GridStyleStorage(GridStyleStorage&&) noexcept = default;
  GridStyleStorage& operator=(GridStyleStorage&&) noexcept = default;

  GridStyleStorage(const GridStyleStorage& other) {
    *this = other;
  }

  GridStyleStorage& operator=(const GridStyleStorage& other) {
    grid_ = other.grid_ == nullptr ? nullptr
                                   : std::make_unique<GridStyle>(*other.grid_);
    return *this;
  }

  const GridStyle& get() const {
    return grid_ == nullptr ? defaults() : *grid_;
  }

  GridStyle& ensure() {
    if (grid_ == nullptr) {
      grid_ = std::make_unique<GridStyle>();
    }
    return *grid_;
  }

  bool operator==(const GridStyleStorage& other) const {
    return grid_ == other.grid_ || get() == other.get();
  }

 private:
  static const GridStyle& defaults() {
    static const GridStyle kDefaults{};
    return kDefaults;
  }

  std::unique_ptr<GridStyle> grid_{};
};

} // namespace facebook::yoga
