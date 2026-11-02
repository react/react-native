/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>

#include <yoga/Yoga.h>

#include <yoga/algorithm/SizingMode.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

struct CachedMeasurement {
  float availableWidth{-1};
  float availableHeight{-1};
  SizingMode widthSizingMode{SizingMode::MaxContent};
  SizingMode heightSizingMode{SizingMode::MaxContent};

  float computedWidth{-1};
  float computedHeight{-1};

  float ownerWidth{-1};
  float ownerHeight{-1};

  bool operator==(CachedMeasurement measurement) const {
    bool isEqual = widthSizingMode == measurement.widthSizingMode &&
        heightSizingMode == measurement.heightSizingMode;

    if (!yoga::isUndefined(availableWidth) ||
        !yoga::isUndefined(measurement.availableWidth)) {
      isEqual = isEqual && availableWidth == measurement.availableWidth;
    }
    if (!yoga::isUndefined(availableHeight) ||
        !yoga::isUndefined(measurement.availableHeight)) {
      isEqual = isEqual && availableHeight == measurement.availableHeight;
    }
    if (!yoga::isUndefined(computedWidth) ||
        !yoga::isUndefined(measurement.computedWidth)) {
      isEqual = isEqual && computedWidth == measurement.computedWidth;
    }
    if (!yoga::isUndefined(computedHeight) ||
        !yoga::isUndefined(measurement.computedHeight)) {
      isEqual = isEqual && computedHeight == measurement.computedHeight;
    }
    if (!yoga::isUndefined(ownerWidth) ||
        !yoga::isUndefined(measurement.ownerWidth)) {
      isEqual = isEqual && ownerWidth == measurement.ownerWidth;
    }
    if (!yoga::isUndefined(ownerHeight) ||
        !yoga::isUndefined(measurement.ownerHeight)) {
      isEqual = isEqual && ownerHeight == measurement.ownerHeight;
    }

    return isEqual;
  }
};

} // namespace facebook::yoga
