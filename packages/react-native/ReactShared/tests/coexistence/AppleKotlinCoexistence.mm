/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <IndependentKotlin/IndependentKotlin.h>
#import <ReactNativeShared/ReactNativeShared.h>
#import <dispatch/dispatch.h>

#include <cstdio>
#include <cstdlib>

extern "C" NSArray<RNSResolvedGradientStop *> *ReactNativeSharedFixtureStops();

static void check(bool condition, const char *message)
{
  if (!condition) {
    fprintf(stderr, "Kotlin framework coexistence failed: %s\n", message);
    abort();
  }
}

static void exercise(int32_t seed)
{
  // Each framework keeps ownership of its Kotlin objects. Only primitive values
  // are copied between their APIs; these are not cast across Kotlin runtimes.
  auto independent = IndependentKotlinIndependentProbe.shared;
  auto token = [independent makeTokenSeed:seed];
  auto stops = ReactNativeSharedFixtureStops();
  check(stops.count == 3, "shared resolver returned the wrong number of stops");
  @autoreleasepool {
    NSArray *values = @[
      [[IndependentKotlinDouble alloc] initWithDouble:stops[0].position],
      [[IndependentKotlinDouble alloc] initWithDouble:stops[1].position],
      [[IndependentKotlinDouble alloc] initWithDouble:stops[2].position],
    ];
    check([independent sumValues:values] == 1.5, "independent framework could not use copied numeric values");
    for (int i = 0; i < 10; ++i) {
      @autoreleasepool {
        check(ReactNativeSharedFixtureStops().count == 3, "shared framework changed while another framework was alive");
        check(
            [independent verifyTokenToken:[independent makeTokenSeed:i] seed:i],
            "independent token did not round-trip");
      }
    }
  }
  check(stops[1].position == 0.5, "retained shared result changed after inner autorelease pools drained");
  check([independent verifyTokenToken:token seed:seed], "retained independent object lost its state");
}

int main()
{
  @autoreleasepool {
    for (int32_t i = 0; i < 100; ++i) {
      @autoreleasepool {
        exercise(i);
      }
    }
    dispatch_apply(64, dispatch_get_global_queue(QOS_CLASS_DEFAULT, 0), ^(size_t index) {
      @autoreleasepool {
        exercise(static_cast<int32_t>(index));
      }
    });
    puts("Kotlin framework coexistence passed: 100 serial and 64 concurrent object-lifetime/value checks.");
  }
  return 0;
}
