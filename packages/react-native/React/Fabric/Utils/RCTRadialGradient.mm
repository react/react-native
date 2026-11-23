/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRadialGradient.h"
#import <React/RCTAnimationUtils.h>
#import <React/RCTConversions.h>
#include <react/renderer/graphics/ValueUnit.h>
#import <react/utils/FloatComparison.h>
#include <cmath>
#import "RCTGradientUtils.h"

using namespace facebook::react;

namespace {
using RadiusVector = std::pair<CGFloat, CGFloat>;

RadiusVector RadiusToSide(
    CGFloat centerX,
    CGFloat centerY,
    CGFloat width,
    CGFloat height,
    bool isCircle,
    RadialGradientSize::SizeKeyword size)
{
  CGFloat radiusXFromLeftSide = centerX;
  CGFloat radiusYFromTopSide = centerY;
  CGFloat radiusXFromRightSide = width - centerX;
  CGFloat radiusYFromBottomSide = height - centerY;
  CGFloat radiusX = NAN;
  CGFloat radiusY = NAN;

  if (size == RadialGradientSize::SizeKeyword::ClosestSide) {
    radiusX = std::min(radiusXFromLeftSide, radiusXFromRightSide);
    radiusY = std::min(radiusYFromTopSide, radiusYFromBottomSide);
  } else {
    radiusX = std::max(radiusXFromLeftSide, radiusXFromRightSide);
    radiusY = std::max(radiusYFromTopSide, radiusYFromBottomSide);
  }

  if (isCircle) {
    CGFloat radius = NAN;
    if (size == RadialGradientSize::SizeKeyword::ClosestSide) {
      radius = std::min(radiusX, radiusY);
    } else {
      radius = std::max(radiusX, radiusY);
    }
    return {radius, radius};
  }

  return {radiusX, radiusY};
}

RadiusVector EllipseRadius(CGFloat offsetX, CGFloat offsetY, CGFloat aspectRatio)
{
  if (aspectRatio == 0 || std::isinf(aspectRatio) || std::isnan(aspectRatio)) {
    return {0, 0};
  }
  // Ellipse that passes through a point formula: (x-h)^2/a^2 + (y-k)^2/b^2 = 1
  // a = semi major axis length
  // b = semi minor axis length = a / aspectRatio
  // x - h = offsetX
  // y - k = offsetY
  CGFloat a = std::sqrt(offsetX * offsetX + offsetY * offsetY * aspectRatio * aspectRatio);
  return {a, a / aspectRatio};
}

RadiusVector RadiusToCorner(
    CGFloat centerX,
    CGFloat centerY,
    CGFloat width,
    CGFloat height,
    bool isCircle,
    RadialGradientSize::SizeKeyword keyword)
{
  std::array<CGPoint, 4> corners = {
      {{.x = 0, .y = 0}, {.x = width, .y = 0}, {.x = width, .y = height}, {.x = 0, .y = height}}};

  size_t cornerIndex = 0;
  CGFloat distance = hypot(centerX - corners[cornerIndex].x, centerY - corners[cornerIndex].y);
  bool isClosestCorner = keyword == RadialGradientSize::SizeKeyword::ClosestCorner;

  for (size_t i = 1; i < corners.size(); ++i) {
    CGFloat newDistance = hypot(centerX - corners[i].x, centerY - corners[i].y);
    if (isClosestCorner) {
      if (newDistance < distance) {
        distance = newDistance;
        cornerIndex = i;
      }
    } else {
      if (newDistance > distance) {
        distance = newDistance;
        cornerIndex = i;
      }
    }
  }

  if (isCircle) {
    return {distance, distance};
  }

  // https://www.w3.org/TR/css-images-3/#typedef-radial-size
  // Aspect ratio of corner size ellipse is same as the respective side size ellipse
  const RadiusVector sideRadius = RadiusToSide(
      centerX,
      centerY,
      width,
      height,
      false,
      isClosestCorner ? RadialGradientSize::SizeKeyword::ClosestSide : RadialGradientSize::SizeKeyword::FarthestSide);
  return EllipseRadius(
      corners[cornerIndex].x - centerX, corners[cornerIndex].y - centerY, sideRadius.first / sideRadius.second);
}

RadiusVector GetRadialGradientRadius(
    bool isCircle,
    const RadialGradientSize &size,
    CGFloat centerX,
    CGFloat centerY,
    CGFloat width,
    CGFloat height)
{
  if (std::holds_alternative<RadialGradientSize::Dimensions>(size.value)) {
    const auto &dimensions = std::get<RadialGradientSize::Dimensions>(size.value);
    CGFloat radiusX = dimensions.x.resolve(static_cast<float>(width));
    CGFloat radiusY = dimensions.y.resolve(static_cast<float>(height));
    if (isCircle) {
      CGFloat radius = std::max(radiusX, radiusY);
      return {radius, radius};
    }
    return {radiusX, radiusY};
  }

  if (std::holds_alternative<RadialGradientSize::SizeKeyword>(size.value)) {
    const auto &keyword = std::get<RadialGradientSize::SizeKeyword>(size.value);
    if (keyword == RadialGradientSize::SizeKeyword::ClosestSide ||
        keyword == RadialGradientSize::SizeKeyword::FarthestSide) {
      return RadiusToSide(centerX, centerY, width, height, isCircle, keyword);
    }

    if (keyword == RadialGradientSize::SizeKeyword::ClosestCorner) {
      return RadiusToCorner(centerX, centerY, width, height, isCircle, keyword);
    }
  }

  // defaults to farthest corner
  return RadiusToCorner(centerX, centerY, width, height, isCircle, RadialGradientSize::SizeKeyword::FarthestCorner);
}
} // namespace

@implementation RCTRadialGradient

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const RadialGradient &)gradient
{
  CAGradientLayer *gradientLayer = [CAGradientLayer layer];
  gradientLayer.type = kCAGradientLayerRadial;
  CGPoint centerPoint = CGPointMake(size.width / 2.0, size.height / 2.0);

  if (gradient.position.top) {
    centerPoint.y = gradient.position.top->resolve(static_cast<float>(size.height));
  } else if (gradient.position.bottom) {
    centerPoint.y = size.height - gradient.position.bottom->resolve(static_cast<float>(size.height));
  }

  if (gradient.position.left) {
    centerPoint.x = gradient.position.left->resolve(static_cast<float>(size.width));
  } else if (gradient.position.right) {
    centerPoint.x = size.width - gradient.position.right->resolve(static_cast<float>(size.width));
  }

  bool isCircle = (gradient.shape == RadialGradientShape::Circle);
  auto [radiusX, radiusY] =
      GetRadialGradientRadius(isCircle, gradient.size, centerPoint.x, centerPoint.y, size.width, size.height);
  const auto gradientLineLength = std::max(radiusX, radiusY);
  auto colorStops = [RCTGradientUtils getFixedColorStops:gradient.colorStops gradientLineLength:gradientLineLength];
  // Unlike negative stops, stops past the ending shape stay visible outside it, so the radius grows to fit them.
  const Float radiusScale = colorStops.empty() ? 1 : std::max<Float>(colorStops.back().position.value_or(1), 1);
  colorStops = [RCTGradientUtils clipColorStops:colorStops end:radiusScale];
  for (auto &colorStop : colorStops) {
    colorStop.position = colorStop.position.value_or(0) / radiusScale;
  }
  radiusX *= radiusScale;
  radiusY *= radiusScale;
  gradientLayer.startPoint = CGPointMake(centerPoint.x / size.width, centerPoint.y / size.height);
  // endpoint.x is horizontal length and endpoint.y is vertical length
  gradientLayer.endPoint = CGPointMake(
      gradientLayer.startPoint.x + radiusX / size.width, gradientLayer.startPoint.y + radiusY / size.height);

  NSMutableArray<id> *colors = [NSMutableArray array];
  NSMutableArray<NSNumber *> *locations = [NSMutableArray array];

  [RCTGradientUtils getColors:colors andLocations:locations fromColorStops:colorStops];

  gradientLayer.frame = CGRectMake(0.0f, 0.0f, size.width, size.height);
  gradientLayer.colors = colors;
  gradientLayer.locations = locations;

  return gradientLayer;
}

@end
