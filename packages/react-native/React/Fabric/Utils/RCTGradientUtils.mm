/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTGradientUtils.h"
#import <React/RCTAnimationUtils.h>
#import <React/RCTConversions.h>
#import <TargetConditionals.h>
#import <react/utils/FloatComparison.h>
#include <optional>
#import <vector>

#if RCT_USE_KMP && TARGET_OS_IOS && !TARGET_OS_MACCATALYST
#define RCT_GRADIENT_USE_KMP 1
#import <ReactNativeShared/ReactNativeShared.h>
#else
#define RCT_GRADIENT_USE_KMP 0
#endif

using namespace facebook::react;

namespace {

struct Line;

struct LineSegment {
  CGPoint p1;
  CGPoint p2;

  LineSegment(CGPoint p1, CGPoint p2) : p1(p1), p2(p2) {}

  LineSegment(CGPoint p1, CGFloat m, CGFloat distance);

  CGFloat getLength() const
  {
    CGFloat dx = p2.x - p1.x;
    CGFloat dy = p2.y - p1.y;
    return sqrt(dx * dx + dy * dy);
  }

  CGFloat getDistance() const
  {
    return p1.x <= p2.x ? getLength() : -getLength();
  }

  CGPoint getMidpoint() const
  {
    return CGPointMake((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
  }

  CGFloat getSlope() const
  {
    CGFloat dx = p2.x - p1.x;
    if (floatEquality(dx, 0.0)) {
      return std::numeric_limits<CGFloat>::infinity();
    }
    return (p2.y - p1.y) / dx;
  }

  CGFloat getPerpendicularSlope() const
  {
    CGFloat slope = getSlope();
    if (std::isinf(slope)) {
      return 0.0;
    }
    if (floatEquality(slope, 0.0)) {
      return -std::numeric_limits<CGFloat>::infinity();
    }
    return -1 / slope;
  }

  Line toLine() const;

  LineSegment perpendicularBisector() const
  {
    CGPoint midpoint = getMidpoint();
    CGFloat perpSlope = getPerpendicularSlope();
    CGFloat dist = getDistance();
    return {LineSegment(midpoint, perpSlope, -dist / 2).p2, LineSegment(midpoint, perpSlope, dist / 2).p2};
  }

  LineSegment multiplied(CGSize multipliers) const
  {
    return {
        CGPointMake(p1.x * multipliers.width, p1.y * multipliers.height),
        CGPointMake(p2.x * multipliers.width, p2.y * multipliers.height)};
  }

  LineSegment divided(CGSize divisors) const
  {
    return multiplied(CGSizeMake(1 / divisors.width, 1 / divisors.height));
  }
};

struct Line {
  CGFloat m;
  CGFloat b;

  Line(CGFloat m, CGFloat b) : m(m), b(b) {}
  Line(CGFloat m, CGPoint p) : m(m), b(p.y - m * p.x) {}
  Line(CGPoint p1, CGPoint p2) : m(LineSegment(p1, p2).getSlope()), b(p1.y - m * p1.x) {}

  CGFloat y(CGFloat x) const
  {
    return m * x + b;
  }

  CGPoint point(CGFloat x) const
  {
    return CGPointMake(x, y(x));
  }

  std::optional<CGPoint> intersection(const Line &other) const
  {
    CGFloat n = other.m;
    CGFloat c = other.b;
    if (floatEquality(m, n)) {
      return std::nullopt;
    }
    CGFloat x = (c - b) / (m - n);
    return point(x);
  }
};

LineSegment::LineSegment(CGPoint p1, CGFloat m, CGFloat distance) : p1(p1)
{
  Line line(m, p1);
  CGPoint measuringPoint = line.point(p1.x + 1);
  LineSegment measuringSegment(p1, measuringPoint);
  CGFloat measuringDeltaH = measuringSegment.getDistance();
  CGFloat deltaX = !floatEquality(measuringDeltaH, 0.0) ? distance / measuringDeltaH : 0.0;
  p2 = line.point(p1.x + deltaX);
}

Line LineSegment::toLine() const
{
  return {p1, p2};
}

CGSize calculateMultipliers(CGSize bounds)
{
  if (bounds.height <= bounds.width) {
    return CGSizeMake(1, bounds.width / bounds.height);
  } else {
    return CGSizeMake(bounds.height / bounds.width, 1);
  }
}

} // namespace

static std::optional<Float> resolveColorStopPosition(ValueUnit position, CGFloat gradientLineLength)
{
  if (position.unit == UnitType::Point) {
    return position.resolve(0.0f) / gradientLineLength;
  }

  if (position.unit == UnitType::Percent) {
    return position.resolve(1.0f);
  }

  return std::nullopt;
}

#if RCT_GRADIENT_USE_KMP
static std::vector<ProcessedColorStop> resolveSharedColorStops(
    const std::vector<ColorStop> &colorStops,
    CGFloat gradientLineLength)
{
  NSMutableArray<RNSGradientStopInput *> *inputs = [NSMutableArray arrayWithCapacity:colorStops.size()];
  for (const auto &stop : colorStops) {
    auto position = resolveColorStopPosition(stop.position, gradientLineLength);
    RNSDouble *boxedPosition = position.has_value() ? [RNSDouble numberWithDouble:position.value()] : nil;
    auto input = [[RNSGradientStopInput alloc] initWithPosition:boxedPosition hasColor:static_cast<bool>(stop.color)];
    [inputs addObject:input];
  }

  auto resolved = [RNSGradientStops.shared resolveStops:inputs epsilon:kDefaultEpsilon useDoublePrecision:YES];
  std::vector<ProcessedColorStop> result;
  result.reserve(resolved.count);
  NSArray<NSNumber *> *inputRange = @[ @0.0, @1.0 ];
  for (RNSResolvedGradientStop *stop in resolved) {
    const auto &leftColor = colorStops[stop.leftColorIndex].color;
    SharedColor color;
    if (stop.leftColorIndex == stop.rightColorIndex) {
      // Preserve the original native color, including dynamic UIColor behavior.
      color = leftColor;
    } else if (std::isfinite(stop.weight)) {
      const auto &rightColor = colorStops[stop.rightColorIndex].color;
      NSArray<UIColor *> *outputRange =
          @[ RCTUIColorFromSharedColor(leftColor), RCTUIColorFromSharedColor(rightColor) ];
      auto interpolatedColor = RCTInterpolateColorInRange(stop.weight, inputRange, outputRange);
      auto alpha = (interpolatedColor >> 24) & 0xFF;
      auto red = (interpolatedColor >> 16) & 0xFF;
      auto green = (interpolatedColor >> 8) & 0xFF;
      auto blue = interpolatedColor & 0xFF;
      color = colorFromRGBA(red, green, blue, alpha);
    }
    result.push_back({.color = color, .position = stop.position});
  }
  return result;
}
#else
// Spec: https://drafts.csswg.org/css-images-4/#coloring-gradient-line (Refer transition hint section)
// Browsers add 9 intermediate color stops when a transition hint is present
// Algorithm is referred from Blink engine
// [source](https://github.com/chromium/chromium/blob/a296b1bad6dc1ed9d751b7528f7ca2134227b828/third_party/blink/renderer/core/css/css_gradient_value.cc#L240).
static std::vector<ProcessedColorStop> processColorTransitionHints(const std::vector<ProcessedColorStop> &originalStops)
{
  auto colorStops = std::vector<ProcessedColorStop>(originalStops);
  int indexOffset = 0;

  for (size_t i = 1; i < originalStops.size() - 1; ++i) {
    // Skip if not a color hint
    if (originalStops[i].color) {
      continue;
    }

    size_t x = i + indexOffset;
    if (x < 1) {
      continue;
    }

    auto offsetLeft = colorStops[x - 1].position.value();
    auto offsetRight = colorStops[x + 1].position.value();
    auto offset = colorStops[x].position.value();
    auto leftDist = offset - offsetLeft;
    auto rightDist = offsetRight - offset;
    auto totalDist = offsetRight - offsetLeft;
    const SharedColor &leftSharedColor = colorStops[x - 1].color;
    const SharedColor &rightSharedColor = colorStops[x + 1].color;

    if (floatEquality(leftDist, rightDist)) {
      colorStops.erase(colorStops.begin() + x);
      --indexOffset;
      continue;
    }

    if (floatEquality(leftDist, 0.0)) {
      colorStops[x].color = rightSharedColor;
      continue;
    }

    if (floatEquality(rightDist, 0.0)) {
      colorStops[x].color = leftSharedColor;
      continue;
    }

    std::vector<ProcessedColorStop> newStops;
    newStops.reserve(9);

    // Position the new color stops
    if (leftDist > rightDist) {
      for (int y = 0; y < 7; ++y) {
        ProcessedColorStop newStop{.color = SharedColor(), .position = offsetLeft + leftDist * ((7.0f + y) / 13.0f)};
        newStops.push_back(newStop);
      }
      ProcessedColorStop stop1{.color = SharedColor(), .position = offset + rightDist * (1.0f / 3.0f)};
      ProcessedColorStop stop2{.color = SharedColor(), .position = offset + rightDist * (2.0f / 3.0f)};
      newStops.push_back(stop1);
      newStops.push_back(stop2);
    } else {
      ProcessedColorStop stop1{.color = SharedColor(), .position = offsetLeft + leftDist * (1.0f / 3.0f)};
      ProcessedColorStop stop2{.color = SharedColor(), .position = offsetLeft + leftDist * (2.0f / 3.0f)};
      newStops.push_back(stop1);
      newStops.push_back(stop2);
      for (int y = 0; y < 7; ++y) {
        ProcessedColorStop newStop{.color = SharedColor(), .position = offset + rightDist * (y / 13.0f)};
        newStops.push_back(newStop);
      }
    }

    // calculate colors for the new color hints.
    // The color weighting for the new color stops will be
    // pointRelativeOffset^(ln(0.5)/ln(hintRelativeOffset)).
    auto hintRelativeOffset = leftDist / totalDist;
    const auto logRatio = log(0.5) / log(hintRelativeOffset);
    auto leftColor = RCTUIColorFromSharedColor(leftSharedColor);
    auto rightColor = RCTUIColorFromSharedColor(rightSharedColor);
    NSArray<NSNumber *> *inputRange = @[ @0.0, @1.0 ];
    NSArray<UIColor *> *outputRange = @[ leftColor, rightColor ];

    for (auto &newStop : newStops) {
      auto pointRelativeOffset = (newStop.position.value() - offsetLeft) / totalDist;
      auto weighting = pow(pointRelativeOffset, logRatio);

      if (!std::isfinite(weighting) || std::isnan(weighting)) {
        continue;
      }

      auto interpolatedColor = RCTInterpolateColorInRange(weighting, inputRange, outputRange);

      auto alpha = (interpolatedColor >> 24) & 0xFF;
      auto red = (interpolatedColor >> 16) & 0xFF;
      auto green = (interpolatedColor >> 8) & 0xFF;
      auto blue = interpolatedColor & 0xFF;

      newStop.color = colorFromRGBA(red, green, blue, alpha);
    }

    // Replace the color hint with new color stops
    colorStops.erase(colorStops.begin() + x);
    colorStops.insert(colorStops.begin() + x, newStops.begin(), newStops.end());
    indexOffset += 8;
  }

  return colorStops;
}
#endif

@implementation RCTGradientUtils
// https://drafts.csswg.org/css-images-4/#color-stop-fixup
+ (std::vector<ProcessedColorStop>)getFixedColorStops:(const std::vector<ColorStop> &)colorStops
                                   gradientLineLength:(CGFloat)gradientLineLength
{
#if RCT_GRADIENT_USE_KMP
  return resolveSharedColorStops(colorStops, gradientLineLength);
#else
  if (colorStops.empty()) {
    return {};
  }

  std::vector<ProcessedColorStop> fixedColorStops(colorStops.size());
  bool hasNullPositions = false;
  auto maxPositionSoFar = resolveColorStopPosition(colorStops[0].position, gradientLineLength);
  if (!maxPositionSoFar.has_value()) {
    maxPositionSoFar = 0.0f;
  }

  for (size_t i = 0; i < colorStops.size(); i++) {
    const auto &colorStop = colorStops[i];
    auto newPosition = resolveColorStopPosition(colorStop.position, gradientLineLength);

    if (!newPosition.has_value()) {
      // Step 1:
      // If the first color stop does not have a position,
      // set its position to 0%. If the last color stop does not have a position,
      // set its position to 100%.
      if (i == 0) {
        newPosition = 0.0f;
      } else if (i == colorStops.size() - 1) {
        newPosition = 1.0f;
      }
    }

    // Step 2:
    // If a color stop or transition hint has a position
    // that is less than the specified position of any color stop or transition hint
    // before it in the list, set its position to be equal to the
    // largest specified position of any color stop or transition hint before it.
    if (newPosition.has_value()) {
      newPosition = std::max(newPosition.value(), maxPositionSoFar.value());
      fixedColorStops[i] = ProcessedColorStop{.color = colorStop.color, .position = newPosition};
      maxPositionSoFar = newPosition;
    } else {
      hasNullPositions = true;
    }
  }

  // Step 3:
  // If any color stop still does not have a position,
  // then, for each run of adjacent color stops without positions,
  // set their positions so that they are evenly spaced between the preceding and
  // following color stops with positions.
  if (hasNullPositions) {
    size_t lastDefinedIndex = 0;
    for (size_t i = 1; i < fixedColorStops.size(); i++) {
      auto endPosition = fixedColorStops[i].position;
      if (endPosition.has_value()) {
        size_t unpositionedStops = i - lastDefinedIndex - 1;
        if (unpositionedStops > 0) {
          auto startPosition = fixedColorStops[lastDefinedIndex].position;
          if (startPosition.has_value()) {
            auto increment = (endPosition.value() - startPosition.value()) / (unpositionedStops + 1);
            for (size_t j = 1; j <= unpositionedStops; j++) {
              fixedColorStops[lastDefinedIndex + j] = ProcessedColorStop{
                  .color = colorStops[lastDefinedIndex + j].color, .position = startPosition.value() + increment * j};
            }
          }
        }
        lastDefinedIndex = i;
      }
    }
  }
  return processColorTransitionHints(fixedColorStops);
#endif
}

// CAGradientLayer linear gradient squishes the non-square gradient to square gradient.
// This function fixes the "squished" effect.
// See https://stackoverflow.com/a/43176174 for more information.
+ (std::pair<CGPoint, CGPoint>)pointsForCAGradientLayerLinearGradient:(CGPoint)startPoint
                                                             endPoint:(CGPoint)endPoint
                                                               bounds:(CGSize)bounds
{
  if (floatEquality(startPoint.x, endPoint.x) || floatEquality(startPoint.y, endPoint.y)) {
    // Apple's implementation of horizontal and vertical gradients works just fine
    return {startPoint, endPoint};
  }

  LineSegment startEnd(startPoint, endPoint);
  LineSegment ab = startEnd.multiplied({bounds.width, bounds.height});
  const CGPoint a = ab.p1;
  const CGPoint b = ab.p2;

  LineSegment cd = ab.perpendicularBisector();

  CGSize multipliers = calculateMultipliers(bounds);
  LineSegment lineSegmentCD = cd.multiplied(multipliers);

  LineSegment lineSegmentEF = lineSegmentCD.perpendicularBisector();

  LineSegment ef = lineSegmentEF.divided(multipliers);

  Line efLine = ef.toLine();

  Line aParallelLine(cd.getSlope(), a);
  Line bParallelLine(cd.getSlope(), b);

  std::optional<CGPoint> g_opt = efLine.intersection(aParallelLine);
  std::optional<CGPoint> h_opt = efLine.intersection(bParallelLine);

  if (g_opt && h_opt) {
    LineSegment gh(*g_opt, *h_opt);
    LineSegment result = gh.divided({bounds.width, bounds.height});
    return {result.p1, result.p2};
  }

  return {startPoint, endPoint};
}
+ (void)getColors:(NSMutableArray<id> *)colors
      andLocations:(NSMutableArray<NSNumber *> *)locations
    fromColorStops:(const std::vector<facebook::react::ProcessedColorStop> &)colorStops
{
  // iOS's CAGradientLayer interpolates colors in a way that can cause unexpected results.
  // For example, a gradient from a color to `transparent` (which is transparent black) will
  // fade the color's RGB components to black, creating a "muddy" or dark appearance.
  // To fix this, we detect when a color stop is transparent black and replace it with
  // a transparent version of the *previous* color stop. This creates a smooth fade-out effect
  // by only interpolating the alpha channel, matching web and Android behavior.
  UIColor *lastColor = nil;
  for (const auto &colorStop : colorStops) {
    UIColor *currentColor = RCTUIColorFromSharedColor(colorStop.color);

    CGFloat red = 0.0;
    CGFloat green = 0.0;
    CGFloat blue = 0.0;
    CGFloat alpha = 0.0;
    [currentColor getRed:&red green:&green blue:&blue alpha:&alpha];

    BOOL isTransparentBlack = alpha == 0.0 && red == 0.0 && green == 0.0 && blue == 0.0;

    if (isTransparentBlack && (lastColor != nullptr)) {
      [colors addObject:(id)[lastColor colorWithAlphaComponent:0.0].CGColor];
    } else {
      [colors addObject:(id)currentColor.CGColor];
    }

    if (!isTransparentBlack) {
      lastColor = currentColor;
    }
    [locations addObject:@(std::max(std::min(colorStop.position.value(), 1.0), 0.0))];
  }
}
@end
