/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>

#include <yoga/debug/AssertFatal.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/Direction.h>
#include <yoga/enums/Edge.h>
#include <yoga/enums/PhysicalEdge.h>
#include <yoga/node/CachedMeasurement.h>
#include <yoga/numeric/FloatOptional.h>

namespace facebook::yoga {

struct LayoutResults {
  // This value was chosen based on empirical data:
  // 98% of analyzed layouts require less than 8 entries.
  static constexpr int32_t MaxCachedMeasurements = 8;

  uint32_t computedFlexBasisGeneration = 0;
  FloatOptional computedFlexBasis = {};

  // Per-flex-item floor along the main axis derived from CSS Flexbox §4.5
  // automatic minimum sizing. Set by `resolveFlexibleLength` when the parent's
  // config does NOT carry the `MinSizeUndefinedInsteadOfAuto` errata and the
  // item has no explicit main-axis `min-{width,height}`. Read by the
  // shrink/bound machinery to keep items at least this large. `Undefined`
  // means "no auto-min applies."
  FloatOptional computedAutoMinMainSize = {};

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  uint32_t generationCount = 0;
  uint32_t configVersion = 0;
  Direction lastOwnerDirection = Direction::Inherit;

  uint32_t nextCachedMeasurementsIndex = 0;
  std::array<CachedMeasurement, MaxCachedMeasurements> cachedMeasurements = {};

  CachedMeasurement cachedLayout{};

  Direction direction() const {
    return direction_;
  }

  void setDirection(Direction direction) {
    direction_ = direction;
  }

  bool hadOverflow() const {
    return hadOverflow_;
  }

  void setHadOverflow(bool hadOverflow) {
    hadOverflow_ = hadOverflow;
  }

  float dimension(Dimension axis) const {
    return dimensions_[yoga::to_underlying(axis)];
  }

  void setDimension(Dimension axis, float dimension) {
    dimensions_[yoga::to_underlying(axis)] = dimension;
  }

  float measuredDimension(Dimension axis) const {
    return measuredDimensions_[yoga::to_underlying(axis)];
  }

  float rawDimension(Dimension axis) const {
    return rawDimensions_[yoga::to_underlying(axis)];
  }

  void setMeasuredDimension(Dimension axis, float dimension) {
    measuredDimensions_[yoga::to_underlying(axis)] = dimension;
  }

  void setRawDimension(Dimension axis, float dimension) {
    rawDimensions_[yoga::to_underlying(axis)] = dimension;
  }

  float position(PhysicalEdge physicalEdge) const {
    return position_[yoga::to_underlying(physicalEdge)];
  }

  void setPosition(PhysicalEdge physicalEdge, float dimension) {
    position_[yoga::to_underlying(physicalEdge)] = dimension;
  }

  float margin(PhysicalEdge physicalEdge) const {
    return margin_[yoga::to_underlying(physicalEdge)];
  }

  void setMargin(PhysicalEdge physicalEdge, float dimension) {
    margin_[yoga::to_underlying(physicalEdge)] = dimension;
  }

  float border(PhysicalEdge physicalEdge) const {
    return border_[yoga::to_underlying(physicalEdge)];
  }

  void setBorder(PhysicalEdge physicalEdge, float dimension) {
    border_[yoga::to_underlying(physicalEdge)] = dimension;
  }

  float padding(PhysicalEdge physicalEdge) const {
    return padding_[yoga::to_underlying(physicalEdge)];
  }

  void setPadding(PhysicalEdge physicalEdge, float dimension) {
    padding_[yoga::to_underlying(physicalEdge)] = dimension;
  }

  bool operator==(LayoutResults layout) const;

 private:
  Direction direction_ : bitCount<Direction>() = Direction::Inherit;
  bool hadOverflow_ : 1 = false;

  std::array<float, 2> dimensions_ = {{YGUndefined, YGUndefined}};
  std::array<float, 2> measuredDimensions_ = {{YGUndefined, YGUndefined}};
  std::array<float, 2> rawDimensions_ = {{YGUndefined, YGUndefined}};
  std::array<float, 4> position_ = {};
  std::array<float, 4> margin_ = {};
  std::array<float, 4> border_ = {};
  std::array<float, 4> padding_ = {};
};

} // namespace facebook::yoga
