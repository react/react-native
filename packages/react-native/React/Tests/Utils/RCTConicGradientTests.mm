/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBackgroundImageUtils.h>
#import <React/RCTConicGradient.h>
#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

using namespace facebook::react;

namespace {
ConicGradient hardStopGradient()
{
  const auto red = colorFromRGBA(255, 0, 0, 255);
  const auto blue = colorFromRGBA(0, 0, 255, 255);
  const auto green = colorFromRGBA(0, 255, 0, 255);
  return {
      .colorStops = {
          {red, {0, UnitType::Percent}},
          {red, {12.5, UnitType::Percent}},
          {blue, {12.5, UnitType::Percent}},
          {blue, {50, UnitType::Percent}},
          {green, {50, UnitType::Percent}},
          {green, {100, UnitType::Percent}}}};
}

UIImage *renderLayer(CALayer *layer, CGSize size)
{
  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat defaultFormat];
  format.scale = 1;
  format.opaque = NO;
  format.preferredRange = UIGraphicsImageRendererFormatRangeStandard;
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size format:format];
  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
    [layer renderInContext:context.CGContext];
  }];
}
} // namespace

@interface RCTConicGradientTests : XCTestCase
@end

@implementation RCTConicGradientTests

- (void)assertImage:(UIImage *)image atPoint:(CGPoint)point hasColor:(UIColor *)expected
{
  CGImageRef pixel = CGImageCreateWithImageInRect(image.CGImage, CGRectMake(point.x, point.y, 1, 1));
  XCTAssertNotEqual(pixel, nullptr);
  if (pixel == nullptr) {
    return;
  }
  uint8_t rgba[4] = {};
  CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
  CGContextRef context = CGBitmapContextCreate(
      rgba,
      1,
      1,
      8,
      4,
      colorSpace,
      static_cast<CGBitmapInfo>(kCGImageAlphaPremultipliedLast) | kCGBitmapByteOrder32Big);
  XCTAssertNotEqual(context, nullptr);
  if (context != nullptr) {
    CGContextDrawImage(context, CGRectMake(0, 0, 1, 1), pixel);
    CGFloat red, green, blue, alpha;
    [expected getRed:&red green:&green blue:&blue alpha:&alpha];
    // Compare sectors, allowing Core Animation color-space conversion.
    XCTAssertEqualWithAccuracy(rgba[0] / 255.0, red * alpha, 0.25, @"red at %@", NSStringFromCGPoint(point));
    XCTAssertEqualWithAccuracy(rgba[1] / 255.0, green * alpha, 0.25, @"green at %@", NSStringFromCGPoint(point));
    XCTAssertEqualWithAccuracy(rgba[2] / 255.0, blue * alpha, 0.25, @"blue at %@", NSStringFromCGPoint(point));
    XCTAssertEqualWithAccuracy(rgba[3] / 255.0, alpha, 0.04, @"alpha at %@", NSStringFromCGPoint(point));
    CGContextRelease(context);
  }
  CGColorSpaceRelease(colorSpace);
  CGImageRelease(pixel);
}

- (void)assertUnrotatedSectors:(UIImage *)image center:(CGPoint)center
{
  // Samples straddle the 45-degree hard stop, away from antialiased edges.
  // Cardinal-only samples would not detect the rectangular-layer distortion.
  [self assertImage:image atPoint:CGPointMake(center.x + 4, center.y - 7) hasColor:UIColor.redColor];
  [self assertImage:image atPoint:CGPointMake(center.x + 7, center.y - 4) hasColor:UIColor.blueColor];
  [self assertImage:image atPoint:CGPointMake(center.x + 6, center.y + 6) hasColor:UIColor.blueColor];
  [self assertImage:image atPoint:CGPointMake(center.x - 6, center.y + 6) hasColor:UIColor.greenColor];
  [self assertImage:image atPoint:CGPointMake(center.x - 6, center.y - 6) hasColor:UIColor.greenColor];
}

- (void)testSquareGradientProvidesRenderingControl
{
  const CGSize size = CGSizeMake(120, 120);
  CALayer *layer = [RCTConicGradient gradientLayerWithSize:size gradient:hardStopGradient()];
  [self assertUnrotatedSectors:renderLayer(layer, size) center:CGPointMake(60, 60)];
}

- (void)testWideGradientPreservesAnglesAndTileSize
{
  const CGSize size = CGSizeMake(240, 120);
  CALayer *layer = [RCTConicGradient gradientLayerWithSize:size gradient:hardStopGradient()];
  XCTAssertTrue(CGSizeEqualToSize(layer.bounds.size, size));
  [self assertUnrotatedSectors:renderLayer(layer, size) center:CGPointMake(120, 60)];
}

- (void)testTallGradientPreservesAnglesAndTileSize
{
  const CGSize size = CGSizeMake(120, 240);
  CALayer *layer = [RCTConicGradient gradientLayerWithSize:size gradient:hardStopGradient()];
  XCTAssertTrue(CGSizeEqualToSize(layer.bounds.size, size));
  [self assertUnrotatedSectors:renderLayer(layer, size) center:CGPointMake(60, 120)];
}

- (void)testExtremeAspectRatios
{
  const CGSize wide = CGSizeMake(600, 30);
  const CGSize tall = CGSizeMake(30, 600);
  [self assertUnrotatedSectors:renderLayer(
                                   [RCTConicGradient gradientLayerWithSize:wide gradient:hardStopGradient()], wide)
                        center:CGPointMake(300, 15)];
  [self assertUnrotatedSectors:renderLayer(
                                   [RCTConicGradient gradientLayerWithSize:tall gradient:hardStopGradient()], tall)
                        center:CGPointMake(15, 300)];
}

- (void)testEmptyTilesDoNotPaint
{
  for (const auto size : {CGSizeZero, CGSizeMake(0, 100), CGSizeMake(100, 0)}) {
    CALayer *layer = [RCTConicGradient gradientLayerWithSize:size gradient:hardStopGradient()];
    XCTAssertTrue(CGSizeEqualToSize(layer.bounds.size, size));
    [self assertImage:renderLayer(layer, CGSizeMake(20, 20)) atPoint:CGPointMake(10, 10) hasColor:UIColor.clearColor];
  }
}

- (void)testRotationOnRectangularGradient
{
  auto gradient = hardStopGradient();
  gradient.from = 90;
  const CGSize size = CGSizeMake(240, 120);
  UIImage *image = renderLayer([RCTConicGradient gradientLayerWithSize:size gradient:gradient], size);
  [self assertImage:image atPoint:CGPointMake(127, 64) hasColor:UIColor.redColor];
  [self assertImage:image atPoint:CGPointMake(124, 67) hasColor:UIColor.blueColor];
  [self assertImage:image atPoint:CGPointMake(114, 54) hasColor:UIColor.greenColor];
}

- (void)testRightAndBottomPixelOffsets
{
  auto gradient = hardStopGradient();
  gradient.position.right = {10, UnitType::Point};
  gradient.position.bottom = {20, UnitType::Point};
  const CGSize size = CGSizeMake(240, 120);
  [self assertUnrotatedSectors:renderLayer([RCTConicGradient gradientLayerWithSize:size gradient:gradient], size)
                        center:CGPointMake(230, 100)];
}

- (void)testPercentageOffsetsResolveAgainstOriginalRectangle
{
  auto gradient = hardStopGradient();
  gradient.position.right = {25, UnitType::Percent};
  gradient.position.bottom = {25, UnitType::Percent};
  const CGSize size = CGSizeMake(240, 120);
  [self assertUnrotatedSectors:renderLayer([RCTConicGradient gradientLayerWithSize:size gradient:gradient], size)
                        center:CGPointMake(180, 90)];
}

- (void)testResizingRecalculatesCenter
{
  auto gradient = hardStopGradient();
  gradient.position.left = {25, UnitType::Percent};
  gradient.position.top = {75, UnitType::Percent};
  const CGSize wide = CGSizeMake(240, 120);
  const CGSize tall = CGSizeMake(120, 240);
  [self assertUnrotatedSectors:renderLayer([RCTConicGradient gradientLayerWithSize:wide gradient:gradient], wide)
                        center:CGPointMake(60, 90)];
  [self assertUnrotatedSectors:renderLayer([RCTConicGradient gradientLayerWithSize:tall gradient:gradient], tall)
                        center:CGPointMake(30, 180)];
}

- (void)testOversizedGradientDoesNotPaintOutsideItsTile
{
  const CGSize size = CGSizeMake(240, 120);
  CALayer *parent = [CALayer layer];
  parent.frame = CGRectMake(0, 0, 260, 260);
  [parent addSublayer:[RCTConicGradient gradientLayerWithSize:size gradient:hardStopGradient()]];
  UIImage *image = renderLayer(parent, parent.bounds.size);
  [self assertImage:image atPoint:CGPointMake(100, 140) hasColor:UIColor.clearColor];
  [self assertImage:image atPoint:CGPointMake(250, 60) hasColor:UIColor.clearColor];
  [self assertUnrotatedSectors:image center:CGPointMake(120, 60)];
}

- (void)testRepeatedRectangularTilesKeepIndependentCenters
{
  const CGSize tileSize = CGSizeMake(120, 60);
  const CGRect area = CGRectMake(0, 0, 240, 120);
  CALayer *tile = [RCTConicGradient gradientLayerWithSize:tileSize gradient:hardStopGradient()];
  CALayer *layer = [RCTBackgroundImageUtils createBackgroundImageLayerWithSize:area
      paintingArea:area
      itemSize:tileSize
      backgroundPosition:BackgroundPosition {}
      backgroundRepeat:BackgroundRepeat {}
      itemLayer:tile];
  UIImage *image = renderLayer(layer, area.size);
  [self assertUnrotatedSectors:image center:CGPointMake(60, 30)];
  [self assertUnrotatedSectors:image center:CGPointMake(180, 30)];
  [self assertUnrotatedSectors:image center:CGPointMake(60, 90)];
  [self assertUnrotatedSectors:image center:CGPointMake(180, 90)];
}

@end
