/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTBackgroundImageUtils.h>

#include <algorithm>
#include <cstdlib>
#include <optional>
#include <vector>

using namespace facebook::react;

static BackgroundSize RCTBackgroundSizeInPoints(std::optional<float> width, std::optional<float> height)
{
  BackgroundSizeLengthPercentage size;
  if (width) {
    size.x = ValueUnit(*width, UnitType::Point);
  }
  if (height) {
    size.y = ValueUnit(*height, UnitType::Point);
  }
  return size;
}

// A 60x40 image with four colored quadrants, so every rotation and mirror gives different pixels.
static CGImageRef RCTCreateQuadrantImage()
{
  CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
  CGContextRef context =
      CGBitmapContextCreate(nullptr, 60, 40, 8, 0, colorSpace, (CGBitmapInfo)kCGImageAlphaPremultipliedLast);
  const CGFloat colors[4][3] = {{1, 0, 0}, {0, 1, 0}, {0, 0, 1}, {1, 1, 0}};
  for (int i = 0; i < 4; i++) {
    CGContextSetRGBFillColor(context, colors[i][0], colors[i][1], colors[i][2], 1);
    CGContextFillRect(context, CGRectMake((i % 2) * 30, (i / 2) * 20, 30, 20));
  }
  CGImageRef image = CGBitmapContextCreateImage(context);
  CGContextRelease(context);
  CGColorSpaceRelease(colorSpace);
  return image;
}

static std::vector<uint8_t> RCTPixels(UIImage *image)
{
  CGImageRef cgImage = image.CGImage;
  size_t width = CGImageGetWidth(cgImage);
  size_t height = CGImageGetHeight(cgImage);
  std::vector<uint8_t> pixels(width * height * 4);
  CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
  CGContextRef context = CGBitmapContextCreate(
      pixels.data(), width, height, 8, width * 4, colorSpace, (CGBitmapInfo)kCGImageAlphaPremultipliedLast);
  CGContextDrawImage(context, CGRectMake(0, 0, width, height), cgImage);
  CGContextRelease(context);
  CGColorSpaceRelease(colorSpace);
  return pixels;
}

@interface RCTBackgroundImageUtilsTests : XCTestCase
@end

@implementation RCTBackgroundImageUtilsTests

- (void)testAutoHeightKeepsTheRatioOfAURLImage
{
  CGSize size = [RCTBackgroundImageUtils calculateBackgroundImageSize:CGRectMake(0, 0, 200, 200)
                                                    itemIntrinsicSize:CGSizeMake(300, 150)
                                                itemHasIntrinsicRatio:YES
                                                       backgroundSize:RCTBackgroundSizeInPoints(100, std::nullopt)
                                                     backgroundRepeat:BackgroundRepeat{}];
  XCTAssertEqualWithAccuracy(size.width, 100, 0.001);
  XCTAssertEqualWithAccuracy(size.height, 50, 0.001);
}

- (void)testAutoHeightOfAGradientStaysAtItsIntrinsicSize
{
  CGSize size = [RCTBackgroundImageUtils calculateBackgroundImageSize:CGRectMake(0, 0, 200, 200)
                                                    itemIntrinsicSize:CGSizeMake(200, 200)
                                                itemHasIntrinsicRatio:NO
                                                       backgroundSize:RCTBackgroundSizeInPoints(100, std::nullopt)
                                                     backgroundRepeat:BackgroundRepeat{}];
  XCTAssertEqualWithAccuracy(size.width, 100, 0.001);
  XCTAssertEqualWithAccuracy(size.height, 200, 0.001);
}

- (void)testRoundUsesAtLeastOneTile
{
  BackgroundRepeat repeat;
  repeat.x = BackgroundRepeatStyle::Round;
  repeat.y = BackgroundRepeatStyle::Round;
  CGSize size = [RCTBackgroundImageUtils calculateBackgroundImageSize:CGRectMake(0, 0, 100, 100)
                                                    itemIntrinsicSize:CGSizeMake(100, 100)
                                                itemHasIntrinsicRatio:NO
                                                       backgroundSize:RCTBackgroundSizeInPoints(250, 250)
                                                     backgroundRepeat:repeat];
  XCTAssertEqualWithAccuracy(size.width, 100, 0.001);
  XCTAssertEqualWithAccuracy(size.height, 100, 0.001);
}

- (void)testURLImageLayerDrawsEveryOrientationLikeUIImage
{
  CGImageRef cgImage = RCTCreateQuadrantImage();
  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
  format.scale = 1;

  for (NSInteger orientation = UIImageOrientationUp; orientation <= UIImageOrientationRightMirrored; orientation++) {
    UIImage *image = [UIImage imageWithCGImage:cgImage scale:1 orientation:(UIImageOrientation)orientation];
    CGSize size = image.size;
    UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size format:format];

    UIImage *expected = [renderer imageWithActions:^(__unused UIGraphicsImageRendererContext *context) {
      [image drawInRect:CGRectMake(0, 0, size.width, size.height)];
    }];
    CALayer *layer = [RCTBackgroundImageUtils createURLImageLayerWithImage:image size:size];
    UIImage *actual = [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
      [layer renderInContext:context.CGContext];
    }];

    std::vector<uint8_t> expectedPixels = RCTPixels(expected);
    std::vector<uint8_t> actualPixels = RCTPixels(actual);
    XCTAssertEqual(expectedPixels.size(), actualPixels.size(), @"orientation %ld", (long)orientation);
    size_t differentBytes = 0;
    for (size_t i = 0; i < std::min(expectedPixels.size(), actualPixels.size()); i++) {
      if (std::abs(expectedPixels[i] - actualPixels[i]) > 2) {
        differentBytes++;
      }
    }
    XCTAssertEqual(differentBytes, 0u, @"orientation %ld", (long)orientation);
  }

  CGImageRelease(cgImage);
}

@end
