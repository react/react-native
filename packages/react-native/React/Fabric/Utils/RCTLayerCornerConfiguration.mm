/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLayerCornerConfiguration.h"

using namespace facebook::react;

static CALayerCornerCurve CornerCurveFromBorderCurve(BorderCurve borderCurve)
{
  switch (borderCurve) {
    case BorderCurve::Continuous:
      return kCACornerCurveContinuous;
    case BorderCurve::Circular:
      return kCACornerCurveCircular;
  }
}

static bool RCTUpdateLayerCornerConfiguration(
    const CornerRadii &cornerRadii,
    BorderCurve cornerCurve,
    CACornerMask cornerMask,
    RCTLayerCornerConfiguration &cornerConfiguration)
{
  if (cornerRadii.horizontal != cornerRadii.vertical) {
    return false;
  }

  if (cornerRadii.horizontal == 0) {
    return true;
  }

  CGFloat cornerRadius = (CGFloat)cornerRadii.horizontal;
  if (cornerConfiguration.hasRoundedCorner) {
    if (cornerConfiguration.cornerRadius != cornerRadius) {
      return false;
    }

    if (cornerConfiguration.cornerCurve != cornerCurve) {
      return false;
    }
  } else {
    cornerConfiguration.cornerRadius = cornerRadius;
    cornerConfiguration.cornerCurve = cornerCurve;
    cornerConfiguration.hasRoundedCorner = true;
  }

  cornerConfiguration.maskedCorners |= cornerMask;
  return true;
}

std::optional<RCTLayerCornerConfiguration> RCTGetLayerCornerConfiguration(const BorderMetrics &borderMetrics)
{
  RCTLayerCornerConfiguration cornerConfiguration;

  const struct {
    const CornerRadii &radii;
    BorderCurve curve;
    CACornerMask mask;
  } corners[] = {
      {borderMetrics.borderRadii.topLeft, borderMetrics.borderCurves.topLeft, kCALayerMinXMinYCorner},
      {borderMetrics.borderRadii.topRight, borderMetrics.borderCurves.topRight, kCALayerMaxXMinYCorner},
      {borderMetrics.borderRadii.bottomLeft, borderMetrics.borderCurves.bottomLeft, kCALayerMinXMaxYCorner},
      {borderMetrics.borderRadii.bottomRight, borderMetrics.borderCurves.bottomRight, kCALayerMaxXMaxYCorner},
  };

  for (const auto &corner : corners) {
    bool isRepresentable =
        RCTUpdateLayerCornerConfiguration(corner.radii, corner.curve, corner.mask, cornerConfiguration);
    if (!isRepresentable) {
      return std::nullopt;
    }
  }

  if (!cornerConfiguration.hasRoundedCorner) {
    cornerConfiguration.maskedCorners =
        kCALayerMinXMinYCorner | kCALayerMaxXMinYCorner | kCALayerMinXMaxYCorner | kCALayerMaxXMaxYCorner;
  }

  return cornerConfiguration;
}

void RCTApplyLayerCornerConfiguration(CALayer *layer, const RCTLayerCornerConfiguration &cornerConfiguration)
{
  layer.cornerRadius = cornerConfiguration.cornerRadius;
  layer.maskedCorners = cornerConfiguration.maskedCorners;
  layer.cornerCurve = CornerCurveFromBorderCurve(cornerConfiguration.cornerCurve);
}
