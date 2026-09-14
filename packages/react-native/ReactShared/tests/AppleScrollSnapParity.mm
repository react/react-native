/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEnhancedScrollView.h>
#import <React/RCTUtils.h>
#import <mach/mach_time.h>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <initializer_list>

// This fixture links the actual scroll view and delegate splitter. The only omitted
// implementation is RN's logging sanitizer; every test coordinate is finite.
double RCTSanitizeNaNValue(double value, NSString *property)
{
  if (!std::isfinite(value)) {
    std::abort();
  }
  return value;
}

static RCTEnhancedScrollView *makeView(NSString *className, BOOL horizontal)
{
  auto view = (RCTEnhancedScrollView *)[[NSClassFromString(className) alloc] initWithFrame:CGRectMake(0, 0, 200, 200)];
  if (!view) {
    std::abort();
  }
  view.contentSize = horizontal ? CGSizeMake(500, 200) : CGSizeMake(200, 500);
  view.snapToStart = YES;
  view.snapToEnd = YES;
  return view;
}

static CGPoint target(RCTEnhancedScrollView *view, BOOL horizontal, double predicted, double velocity)
{
  CGPoint result = horizontal ? CGPointMake(predicted, 17) : CGPointMake(17, predicted);
  CGPoint speed = horizontal ? CGPointMake(velocity, 0) : CGPointMake(0, velocity);
  [(id<UIScrollViewDelegate>)view scrollViewWillEndDragging:view withVelocity:speed targetContentOffset:&result];
  return result;
}

static void requireEqual(CGPoint actual, CGPoint expected, NSUInteger index)
{
  if (actual.x != expected.x || actual.y != expected.y) {
    std::fprintf(
        stderr, "case %lu: (%g, %g) != (%g, %g)\n", (unsigned long)index, actual.x, actual.y, expected.x, expected.y);
    std::exit(1);
  }
}

static void checkViews(
    RCTEnhancedScrollView *actual,
    RCTEnhancedScrollView *baseline,
    RCTEnhancedScrollView *cached,
    BOOL horizontal,
    double predicted,
    double velocity,
    NSUInteger index)
{
  auto expected = target(baseline, horizontal, predicted, velocity);
  requireEqual(target(actual, horizontal, predicted, velocity), expected, index);
  requireEqual(target(cached, horizontal, predicted, velocity), expected, index);
}

static double nanos(uint64_t elapsed)
{
  mach_timebase_info_data_t scale;
  mach_timebase_info(&scale);
  return (double)elapsed * scale.numer / scale.denom;
}

int main(int argc, const char **argv)
{
  @autoreleasepool {
#if RCT_SCROLL_BENCHMARK
    const NSUInteger count = argc > 1 ? strtoul(argv[1], nullptr, 10) : 16;
    const NSUInteger iterations = 10000;
    auto view = makeView(@"RCTEnhancedScrollView", YES);
    NSMutableArray<NSNumber *> *offsets = [NSMutableArray new];
    for (NSUInteger i = 0; i < count; i++) {
      [offsets addObject:@(300.0 * i / MAX(count - 1, 1UL))];
    }
    const auto propertyStart = mach_continuous_time();
    view.snapToOffsets = offsets;
    const double firstPropertyNanos = nanos(mach_continuous_time() - propertyStart);
    const auto firstStart = mach_continuous_time();
    auto first = target(view, YES, 151.0, 1.0);
    const double firstFlingNanos = nanos(mach_continuous_time() - firstStart);
    NSMutableArray<NSNumber *> *samples = [NSMutableArray new];
    double checksum = first.x;
    for (NSUInteger sample = 0; sample < 7; sample++) {
      const auto start = mach_continuous_time();
      for (NSUInteger i = 0; i < iterations; i++) {
        @autoreleasepool {
          checksum += target(view, YES, (double)(i % 301), (int)(i % 3) - 1).x;
        }
      }
      [samples addObject:@(nanos(mach_continuous_time() - start) / iterations)];
    }
    NSDictionary *report = @{
      @"offsetCount" : @(count),
      @"iterationsPerSample" : @(iterations),
      @"firstPropertyNanos" : @(firstPropertyNanos),
      @"firstFlingNanos" : @(firstFlingNanos),
      @"nanosPerFling" : samples,
      @"checksum" : @(checksum),
    };
#else
    NSUInteger cases = 0;
    NSArray<NSArray<NSNumber *> *> *lists = @[
      @[],
      @[ @60 ],
      @[ @20, @60, @100 ],
      @[ @0.25, @0.25, @60.1, @100.75 ],
      @[ @100, @20, @60 ],
      @[ @-20, @60, @350 ],
    ];
    for (BOOL horizontal : {NO, YES}) {
      auto actual = makeView(@"RCTEnhancedScrollView", horizontal);
      auto baseline = makeView(@"RCTEnhancedScrollViewBaseline", horizontal);
      auto cached = makeView(@"RCTEnhancedScrollViewCached", horizontal);
      for (double maximum : {0.0, 120.0, 300.0}) {
        actual.contentSize = baseline.contentSize = cached.contentSize =
            horizontal ? CGSizeMake(200 + maximum, 200) : CGSizeMake(200, 200 + maximum);
        for (NSArray<NSNumber *> *offsets in lists) {
          actual.snapToOffsets = baseline.snapToOffsets = cached.snapToOffsets = offsets;
          for (int flags = 0; flags < 4; flags++) {
            actual.snapToStart = baseline.snapToStart = cached.snapToStart = flags & 1;
            actual.snapToEnd = baseline.snapToEnd = cached.snapToEnd = flags & 2;
            for (double current : {-20.0, 0.0, 20.0, 60.0, 100.0, 150.0, 320.0}) {
              actual.contentOffset = baseline.contentOffset = cached.contentOffset =
                  horizontal ? CGPointMake(current, 0) : CGPointMake(0, current);
              for (double predicted : {-50.0, 0.0, 20.0, 39.9, 40.0, 60.0, 100.0, 120.0, 150.0, 320.0}) {
                for (double velocity : {-1.0, 0.0, 1.0}) {
                  checkViews(actual, baseline, cached, horizontal, predicted, velocity, ++cases);
                }
              }
            }
          }
        }
      }
      // Replacing/clearing the property must invalidate the cached selector.
      NSMutableArray<NSNumber *> *mutableOffsets = [@[ @20, @60, @100 ] mutableCopy];
      actual.snapToOffsets = baseline.snapToOffsets = cached.snapToOffsets = mutableOffsets;
      mutableOffsets[1] = @90;
      checkViews(actual, baseline, cached, horizontal, 40, 1, ++cases);
      for (NSArray<NSNumber *> *replacement in @[ @[ @30, @70 ], @[] ]) {
        actual.snapToOffsets = baseline.snapToOffsets = cached.snapToOffsets = replacement;
        checkViews(actual, baseline, cached, horizontal, 40, 1, ++cases);
      }
      [actual setValue:nil forKey:@"snapToOffsets"];
      [baseline setValue:nil forKey:@"snapToOffsets"];
      [cached setValue:nil forKey:@"snapToOffsets"];
      // Interval snapping remains a native operation, including alignment and momentum policy.
      actual.contentSize = baseline.contentSize = cached.contentSize =
          horizontal ? CGSizeMake(500, 200) : CGSizeMake(200, 500);
      actual.snapToInterval = baseline.snapToInterval = cached.snapToInterval = 60;
      actual.contentOffset = baseline.contentOffset = cached.contentOffset =
          horizontal ? CGPointMake(75, 0) : CGPointMake(0, 75);
      for (NSString *alignment in @[ @"start", @"center", @"end" ]) {
        actual.snapToAlignment = baseline.snapToAlignment = cached.snapToAlignment = alignment;
        for (BOOL disableMomentum : {NO, YES}) {
          actual.disableIntervalMomentum = baseline.disableIntervalMomentum = cached.disableIntervalMomentum =
              disableMomentum;
          for (double velocity : {-1.0, 0.0, 1.0}) {
            checkViews(actual, baseline, cached, horizontal, 130, velocity, ++cases);
          }
        }
      }
    }
    NSDictionary *report = @{@"passedCases" : @(cases), @"cachedNativeControlCases" : @(cases), @"failedCases" : @0};
#endif
    NSData *json = [NSJSONSerialization dataWithJSONObject:report options:NSJSONWritingSortedKeys error:nil];
    std::puts([[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding].UTF8String);
  }
  return 0;
}
