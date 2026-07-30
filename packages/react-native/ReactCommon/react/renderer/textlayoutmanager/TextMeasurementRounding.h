/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>

#include <react/renderer/graphics/Size.h>

namespace facebook::react {

/*
 * Rounds a raw text measurement up to the device pixel grid.
 *
 * A small epsilon is added to each dimension before ceil, so a value that sits
 * effectively on a physical-pixel boundary gains one extra physical pixel
 * instead of being rounded down. This works around precision loss when a
 * measurement is converted from double to float and then rounded to the pixel
 * grid in Yoga: without it, such a value can round down and clip the final line
 * (height) or trailing glyph (width) of text. Dimensions that already have
 * sub-pixel headroom are unaffected. See facebook/react-native issue #53450;
 * this mirrors the legacy architecture fix in D7074168, which applied the same
 * epsilon to both dimensions.
 *
 * This helper lives in its own header only so the unit test in
 * `textlayoutmanager:tests` can exercise it directly. In production it is used
 * only by RCTTextLayoutManager.mm, and the `internal_` prefix keeps it out of
 * the public C++ API snapshot.
 */
inline Size internal_roundTextMeasurementToPixelGrid(Size size, Float pointScaleFactor)
{
  constexpr auto kEpsilon = static_cast<Float>(0.001);
  return Size{
      .width = std::ceil((size.width + kEpsilon) * pointScaleFactor) / pointScaleFactor,
      .height = std::ceil((size.height + kEpsilon) * pointScaleFactor) / pointScaleFactor,
  };
}

} // namespace facebook::react
