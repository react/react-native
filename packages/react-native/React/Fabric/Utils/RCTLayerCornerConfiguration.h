/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <optional>

#import <QuartzCore/QuartzCore.h>
#import <react/renderer/components/view/primitives.h>

/*
 * Describes how a view's border radii can be rendered through CoreAnimation's
 * `cornerRadius` / `maskedCorners` fast path instead of a `CAShapeLayer` mask.
 */
struct RCTLayerCornerConfiguration {
  CGFloat cornerRadius{0};
  CACornerMask maskedCorners{0};
  facebook::react::BorderCurve cornerCurve{facebook::react::BorderCurve::Circular};
  bool hasRoundedCorner{false};
};

/*
 * Returns a corner configuration when `borderMetrics` can be represented with a
 * single `cornerRadius` + `maskedCorners`, i.e. every rounded corner shares the
 * same circular radius and curve. Returns `std::nullopt` when the radii require
 * a mask layer instead (an elliptical corner, or differing radii/curves between
 * rounded corners).
 */
std::optional<RCTLayerCornerConfiguration> RCTGetLayerCornerConfiguration(
    const facebook::react::BorderMetrics &borderMetrics);

/*
 * Applies a corner configuration to a layer's `cornerRadius`, `maskedCorners`
 * and `cornerCurve`.
 */
void RCTApplyLayerCornerConfiguration(CALayer *layer, const RCTLayerCornerConfiguration &cornerConfiguration);
