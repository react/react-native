/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConicGradient.h"

#import "RCTGradientUtils.h"

#import <cmath>

using namespace facebook::react;

@implementation RCTConicGradient

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const ConicGradient &)gradient
{
  CAGradientLayer *gradientLayer = [CAGradientLayer layer];
  gradientLayer.type = kCAGradientLayerConic;

  CGPoint centerPoint = CGPointMake(size.width / 2.0, size.height / 2.0);
  if (gradient.position.top.has_value()) {
    centerPoint.y = gradient.position.top->resolve(static_cast<float>(size.height));
  } else if (gradient.position.bottom.has_value()) {
    centerPoint.y = size.height - gradient.position.bottom->resolve(static_cast<float>(size.height));
  }
  if (gradient.position.left.has_value()) {
    centerPoint.x = gradient.position.left->resolve(static_cast<float>(size.width));
  } else if (gradient.position.right.has_value()) {
    centerPoint.x = size.width - gradient.position.right->resolve(static_cast<float>(size.width));
  }

  CGPoint normalizedCenter = CGPointMake(centerPoint.x / size.width, centerPoint.y / size.height);
  CGFloat radians = gradient.from * M_PI / 180.0;
  gradientLayer.startPoint = normalizedCenter;
  gradientLayer.endPoint = CGPointMake(normalizedCenter.x + std::sin(radians), normalizedCenter.y - std::cos(radians));

  const auto colorStops = [RCTGradientUtils getFixedColorStops:gradient.colorStops gradientLineLength:1.0];
  NSMutableArray<id> *colors = [NSMutableArray array];
  NSMutableArray<NSNumber *> *locations = [NSMutableArray array];
  [RCTGradientUtils getColors:colors andLocations:locations fromColorStops:colorStops];

  gradientLayer.frame = CGRectMake(0.0f, 0.0f, size.width, size.height);
  gradientLayer.colors = colors;
  gradientLayer.locations = locations;
  return gradientLayer;
}

@end
