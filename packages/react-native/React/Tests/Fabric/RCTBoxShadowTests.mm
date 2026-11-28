/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTBoxShadow.h>

using namespace facebook::react;

static BoxShadow outsetShadow(Float offsetX, Float offsetY, Float blurRadius, Float spreadDistance)
{
  return {
      .offsetX = offsetX,
      .offsetY = offsetY,
      .blurRadius = blurRadius,
      .spreadDistance = spreadDistance,
      .color = colorFromRGBA(0, 0, 0, 255),
      .inset = false,
  };
}

static RCTCornerRadii uniformCornerRadii(CGFloat radius)
{
  return {radius, radius, radius, radius, radius, radius, radius, radius};
}

static CGRect shadowPathBounds(CALayer *shadowLayer)
{
  return CGPathGetBoundingBox(shadowLayer.shadowPath);
}

static CGRect maskPathBounds(CALayer *shadowLayer)
{
  return CGPathGetBoundingBox(((CAShapeLayer *)shadowLayer.mask).path);
}

#define RCTAssertRectEqual(actual, expected)   \
  XCTAssertTrue(                               \
      CGRectEqualToRect((actual), (expected)), \
      @"%@ is not equal to %@",                \
      NSStringFromCGRect(actual),              \
      NSStringFromCGRect(expected))

@interface RCTBoxShadowTests : XCTestCase

@end

@implementation RCTBoxShadowTests

- (void)testOutsetShadowWithNegativeSpreadOnZeroSizedLayerIsEmpty
{
  CALayer *shadowLayer =
      RCTGetBoxShadowLayer(outsetShadow(0, 1, 2, -1), uniformCornerRadii(8), UIEdgeInsetsZero, CGSizeZero);

  RCTAssertRectEqual(shadowPathBounds(shadowLayer), CGRectMake(0, 1, 0, 0));
  // Mask = layer rect (empty, at the origin) + shadow rect padded by 2 * (blur + 1).
  RCTAssertRectEqual(maskPathBounds(shadowLayer), CGRectMake(-6, -5, 12, 12));
}

- (void)testOutsetShadowWithNegativeSpreadClampsEachAxisIndependently
{
  CALayer *shadowLayer =
      RCTGetBoxShadowLayer(outsetShadow(0, 0, 0, -1), uniformCornerRadii(0), UIEdgeInsetsZero, CGSizeMake(100, 1));

  // The width shrinks by the spread on each side; the height cannot go below zero, so it collapses onto the centre.
  RCTAssertRectEqual(shadowPathBounds(shadowLayer), CGRectMake(1, 0.5, 98, 0));
}

- (void)testOutsetShadowWithNegativeSpreadSmallerThanLayer
{
  CALayer *shadowLayer =
      RCTGetBoxShadowLayer(outsetShadow(2, 3, 0, -5), uniformCornerRadii(0), UIEdgeInsetsZero, CGSizeMake(100, 50));

  RCTAssertRectEqual(shadowPathBounds(shadowLayer), CGRectMake(7, 8, 90, 40));
}

- (void)testOutsetShadowWithZeroSpread
{
  CALayer *shadowLayer =
      RCTGetBoxShadowLayer(outsetShadow(2, 3, 0, 0), uniformCornerRadii(0), UIEdgeInsetsZero, CGSizeMake(100, 50));

  RCTAssertRectEqual(shadowPathBounds(shadowLayer), CGRectMake(2, 3, 100, 50));
}

- (void)testOutsetShadowWithPositiveSpread
{
  CALayer *shadowLayer =
      RCTGetBoxShadowLayer(outsetShadow(2, 3, 0, 5), uniformCornerRadii(0), UIEdgeInsetsZero, CGSizeMake(100, 50));

  RCTAssertRectEqual(shadowPathBounds(shadowLayer), CGRectMake(-3, -2, 110, 60));
}

@end
