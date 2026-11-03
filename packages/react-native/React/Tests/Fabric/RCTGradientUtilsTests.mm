/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTGradientUtils.h>

#import <vector>

using namespace facebook::react;

static SharedColor rgba(uint8_t red, uint8_t green, uint8_t blue, uint8_t alpha = 255)
{
  return colorFromRGBA(red, green, blue, alpha);
}

static NSString *describeColor(const SharedColor &color)
{
  if (!color) {
    return @"null";
  }
  return [NSString stringWithFormat:@"rgba(%d, %d, %d, %d)",
                                    redFromColor(color),
                                    greenFromColor(color),
                                    blueFromColor(color),
                                    alphaFromColor(color)];
}

static NSString *describeStops(const std::vector<ProcessedColorStop> &colorStops)
{
  NSMutableArray<NSString *> *descriptions = [NSMutableArray new];
  for (const auto &colorStop : colorStops) {
    [descriptions addObject:[NSString stringWithFormat:@"%@ %@",
                                                       describeColor(colorStop.color),
                                                       colorStop.position ? (id) @(*colorStop.position) : @"null"]];
  }
  return [descriptions componentsJoinedByString:@", "];
}

#define RCTAssertColorStop(colorStop, expectedColor, expectedPosition)                       \
  do {                                                                                       \
    XCTAssertEqualObjects(describeColor((colorStop).color), describeColor(expectedColor));   \
    XCTAssertTrue((colorStop).position.has_value());                                         \
    XCTAssertEqualWithAccuracy((colorStop).position.value_or(-1), (expectedPosition), 1e-4); \
  } while (0)

@interface RCTGradientUtilsTests : XCTestCase

@end

@implementation RCTGradientUtilsTests {
  SharedColor _red;
  SharedColor _green;
  SharedColor _blue;
  SharedColor _yellow;
  SharedColor _transparent;
}

- (void)setUp
{
  [super setUp];
  _red = rgba(255, 0, 0);
  _green = rgba(0, 255, 0);
  _blue = rgba(0, 0, 255);
  _yellow = rgba(255, 255, 0);
  _transparent = rgba(0, 0, 0, 0);
}

- (std::vector<ProcessedColorStop>)clip:(const std::vector<ProcessedColorStop> &)colorStops
{
  return [RCTGradientUtils clipColorStops:colorStops end:1];
}

- (void)testClipColorStopsKeepsStopsInsideRange
{
  std::vector<ProcessedColorStop> colorStops = {{_red, 0.1}, {_blue, 0.9}};

  XCTAssertTrue([self clip:colorStops] == colorStops);
}

- (void)testClipColorStopsInterpolatesAtBothEnds
{
  auto clipped = [self clip:{{_red, -0.5}, {_blue, 1.5}}];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], rgba(191, 0, 64), 0);
  RCTAssertColorStop(clipped[1], rgba(64, 0, 191), 1);
}

- (void)testClipColorStopsKeepsStopsBetweenClippedEnds
{
  auto clipped = [self clip:{{_red, -0.5}, {_yellow, 0.25}, {_blue, 1.5}}];

  XCTAssertEqual(clipped.size(), 3, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], rgba(255, 170, 0), 0);
  RCTAssertColorStop(clipped[1], _yellow, 0.25);
  RCTAssertColorStop(clipped[2], rgba(102, 102, 153), 1);
}

- (void)testClipColorStopsOutsideRangeBecomeSolidColor
{
  auto below = [self clip:{{_red, -0.8}, {_blue, -0.2}}];
  XCTAssertEqual(below.size(), 2, @"%@", describeStops(below));
  RCTAssertColorStop(below[0], _blue, 0);
  RCTAssertColorStop(below[1], _blue, 1);

  auto above = [self clip:{{_red, 1.2}, {_blue, 1.8}}];
  XCTAssertEqual(above.size(), 2, @"%@", describeStops(above));
  RCTAssertColorStop(above[0], _red, 0);
  RCTAssertColorStop(above[1], _red, 1);
}

- (void)testClipColorStopsAddsSecondStopWhenOnlyOneRemains
{
  auto clipped = [self clip:{{_red, -0.1}, {_blue, 0}}];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], _blue, 0);
  RCTAssertColorStop(clipped[1], _blue, 1);
}

- (void)testClipColorStopsWithCustomEndOnlyClipsBelowZero
{
  auto clipped = [RCTGradientUtils clipColorStops:{{_red, -0.5}, {_blue, 1.5}} end:1.5];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], rgba(191, 0, 64), 0);
  RCTAssertColorStop(clipped[1], _blue, 1.5);
}

- (void)testClipColorStopsInterpolatesWithPremultipliedAlpha
{
  auto clipped = [self clip:{{_red, -0.5}, {_transparent, 1.5}}];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], rgba(255, 0, 0, 191), 0);
  RCTAssertColorStop(clipped[1], rgba(255, 0, 0, 64), 1);
}

- (void)testClipColorStopsKeepsStopsOnRangeBoundaries
{
  auto clipped = [self clip:{{_red, -0.5}, {_green, 0}, {_blue, 1}, {_yellow, 1.5}}];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], _green, 0);
  RCTAssertColorStop(clipped[1], _blue, 1);
}

- (void)testClipColorStopsInterpolatesBetweenStopsAroundBoundary
{
  auto clipped = [self clip:{{_red, -1}, {_green, -0.5}, {_blue, 0.5}}];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], rgba(0, 128, 128), 0);
  RCTAssertColorStop(clipped[1], _blue, 0.5);
}

- (void)testClipColorStopsWithNoStopInsideRange
{
  auto clipped = [self clip:{{_red, -1}, {_green, -0.5}, {_blue, 2}}];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], rgba(0, 204, 51), 0);
  RCTAssertColorStop(clipped[1], rgba(0, 102, 153), 1);
}

- (void)testClipColorStopsInterpolatesBetweenSemiTransparentColors
{
  auto clipped = [self clip:{{rgba(255, 0, 0, 128), -0.5}, {_blue, 1.5}}];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], rgba(153, 0, 102, 160), 0);
  RCTAssertColorStop(clipped[1], rgba(37, 0, 218, 223), 1);
}

- (void)testTransitionHintsAreExpandedBeforeClipping
{
  auto fixed = [RCTGradientUtils getFixedColorStops:{{_red, ValueUnit(-30, UnitType::Percent)},
                                                     {SharedColor(), ValueUnit(0, UnitType::Percent)},
                                                     {_blue, ValueUnit(65, UnitType::Percent)}}
                                 gradientLineLength:100];
  auto clipped = [self clip:fixed];

  // The hint is an even mix, 127.5, which RCTInterpolateColorInRange rounds up.
  RCTAssertColorStop(clipped.front(), rgba(128, 0, 128), 0);
  for (const auto &colorStop : clipped) {
    XCTAssertGreaterThanOrEqual(colorStop.position.value_or(-1), 0, @"%@", describeStops(clipped));
  }
  RCTAssertColorStop(clipped.back(), _blue, 0.65);
}

// From WPT: linear-gradient(green -50%, blue -50%) and radial-gradient(green -50%, blue -50%).
// https://github.com/web-platform-tests/wpt/blob/master/css/css-images/normalization-linear.html
// https://github.com/web-platform-tests/wpt/blob/master/css/css-images/normalization-radial.html
- (void)testCoincidentStopsBelowRangeRenderLastColor
{
  auto fixed = [RCTGradientUtils
      getFixedColorStops:{{_green, ValueUnit(-50, UnitType::Percent)}, {_blue, ValueUnit(-50, UnitType::Percent)}}
      gradientLineLength:100];
  auto clipped = [self clip:fixed];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], _blue, 0);
  RCTAssertColorStop(clipped[1], _blue, 1);
}

// From WPT: linear-gradient(blue 150%, red 150%).
// https://github.com/web-platform-tests/wpt/blob/master/css/css-images/normalization-linear-2.html
- (void)testCoincidentStopsAboveRangeRenderFirstColor
{
  auto fixed = [RCTGradientUtils
      getFixedColorStops:{{_blue, ValueUnit(150, UnitType::Percent)}, {_red, ValueUnit(150, UnitType::Percent)}}
      gradientLineLength:100];
  auto clipped = [self clip:fixed];

  XCTAssertEqual(clipped.size(), 2, @"%@", describeStops(clipped));
  RCTAssertColorStop(clipped[0], _blue, 0);
  RCTAssertColorStop(clipped[1], _blue, 1);
}

// From WPT: radial-gradient(blue 150%, red 150%). Radial gradients keep stops past the ending
// shape, and grow the radius to fit them.
// https://github.com/web-platform-tests/wpt/blob/master/css/css-images/normalization-radial-2.html
- (void)testClipColorStopsKeepsStopsUpToCustomEnd
{
  std::vector<ProcessedColorStop> colorStops = {{_blue, 1.5}, {_red, 1.5}};

  XCTAssertTrue([RCTGradientUtils clipColorStops:colorStops end:1.5] == colorStops);
}

- (void)testLengthPositionsOnZeroLengthGradientLineResolveToZero
{
  auto fixed = [RCTGradientUtils
      getFixedColorStops:{{_red, ValueUnit(10, UnitType::Point)}, {_blue, ValueUnit(20, UnitType::Point)}}
      gradientLineLength:0];

  XCTAssertEqual(fixed.size(), 2, @"%@", describeStops(fixed));
  RCTAssertColorStop(fixed[0], _red, 0);
  RCTAssertColorStop(fixed[1], _blue, 0);
}

@end
