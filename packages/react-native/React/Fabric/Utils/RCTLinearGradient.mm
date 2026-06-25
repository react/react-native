/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLinearGradient.h"

#import <React/RCTAnimationUtils.h>
#import <React/RCTConversions.h>
#include <react/renderer/graphics/ValueUnit.h>
#import <react/utils/FloatComparison.h>
#import "RCTGradientUtils.h"

using namespace facebook::react;

@implementation RCTLinearGradient

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const LinearGradient &)gradient
{
  const auto &direction = gradient.direction;
  CAGradientLayer *gradientLayer = [CAGradientLayer layer];
  CGPoint startPoint;
  CGPoint endPoint;

  if (std::holds_alternative<Float>(direction)) {
    CGFloat angle = std::get<Float>(direction);
    std::tie(startPoint, endPoint) = getPointsFromAngle(angle, size);
  } else {
    auto keyword = std::get<GradientKeyword>(direction);
    CGFloat angle = getAngleForKeyword(keyword, size);
    std::tie(startPoint, endPoint) = getPointsFromAngle(angle, size);
  }

  CGFloat dx = endPoint.x - startPoint.x;
  CGFloat dy = endPoint.y - startPoint.y;
  CGFloat gradientLineLength = sqrt(dx * dx + dy * dy);
  const auto colorStops = [RCTGradientUtils getFixedColorStops:gradient.colorStops
                                            gradientLineLength:gradientLineLength];
  NSMutableArray<id> *colors = [NSMutableArray array];
  NSMutableArray<NSNumber *> *locations = [NSMutableArray array];
  CGPoint relativeStartPoint = CGPointMake(startPoint.x / size.width, startPoint.y / size.height);
  CGPoint relativeEndPoint = CGPointMake(endPoint.x / size.width, endPoint.y / size.height);

  CGPoint fixedStartPoint;
  CGPoint fixedEndPoint;

  std::tie(fixedStartPoint, fixedEndPoint) = [RCTGradientUtils pointsForCAGradientLayerLinearGradient:relativeStartPoint
                                                                                             endPoint:relativeEndPoint
                                                                                               bounds:size];

  gradientLayer.startPoint = fixedStartPoint;
  gradientLayer.endPoint = fixedEndPoint;

  [RCTGradientUtils getColors:colors andLocations:locations fromColorStops:colorStops];

  gradientLayer.frame = CGRectMake(0.0f, 0.0f, size.width, size.height);
  gradientLayer.colors = colors;
  gradientLayer.locations = locations;

  return gradientLayer;
}

// Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
// Reference:
// https://github.com/chromium/chromium/blob/d32abbe13f5d52be7127fe25d5b778498165fab8/third_party/blink/renderer/core/css/css_gradient_value.cc#L1057
static std::pair<CGPoint, CGPoint> getPointsFromAngle(CGFloat angle, CGSize size)
{
  angle = fmod(angle, 360.0);
  if (angle < 0) {
    angle += 360.0;
  }

  if (angle == 0.0) {
    return {CGPointMake(0, size.height), CGPointMake(0, 0)};
  }
  if (angle == 90.0) {
    return {CGPointMake(0, 0), CGPointMake(size.width, 0)};
  }
  if (angle == 180.0) {
    return {CGPointMake(0, 0), CGPointMake(0, size.height)};
  }
  if (angle == 270.0) {
    return {CGPointMake(size.width, 0), CGPointMake(0, 0)};
  }

  CGFloat radians = (90 - angle) * M_PI / 180.0;
  CGFloat slope = tan(radians);
  CGFloat perpendicularSlope = -1 / slope;

  CGFloat halfHeight = size.height / 2;
  CGFloat halfWidth = size.width / 2;

  CGPoint endCorner;
  if (angle < 90) {
    endCorner = CGPointMake(halfWidth, halfHeight);
  } else if (angle < 180) {
    endCorner = CGPointMake(halfWidth, -halfHeight);
  } else if (angle < 270) {
    endCorner = CGPointMake(-halfWidth, -halfHeight);
  } else {
    endCorner = CGPointMake(-halfWidth, halfHeight);
  }

  CGFloat c = endCorner.y - perpendicularSlope * endCorner.x;
  CGFloat endX = c / (slope - perpendicularSlope);
  CGFloat endY = perpendicularSlope * endX + c;

  return {CGPointMake(halfWidth - endX, halfHeight + endY), CGPointMake(halfWidth + endX, halfHeight - endY)};
}

// Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
// Refer `using keywords` section
static CGFloat getAngleForKeyword(GradientKeyword keyword, CGSize size)
{
  switch (keyword) {
    case GradientKeyword::ToTopRight: {
      CGFloat angleDeg = atan(size.width / size.height) * 180.0 / M_PI;
      return 90.0 - angleDeg;
    }
    case GradientKeyword::ToBottomRight:
      return atan(size.width / size.height) * 180.0 / M_PI + 90.0;
    case GradientKeyword::ToTopLeft:
      return atan(size.width / size.height) * 180.0 / M_PI + 270.0;
    case GradientKeyword::ToBottomLeft:
      return atan(size.height / size.width) * 180.0 / M_PI + 180.0;
    default:
      return 180.0;
  }
}

@end
