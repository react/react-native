/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "Probe.h"
#import <TargetConditionals.h>

#if !TARGET_OS_MACCATALYST
#import <ReactNativeShared/ReactNativeShared.h>
#endif

int RNSDistributionProbe(void)
{
#if TARGET_OS_MACCATALYST
  return 1;
#else
  @autoreleasepool {
    NSArray *input = @[
      [[RNSGradientStopInput alloc] initWithPosition:nil hasColor:YES],
      [[RNSGradientStopInput alloc] initWithPosition:nil hasColor:YES],
      [[RNSGradientStopInput alloc] initWithPosition:nil hasColor:YES],
    ];
    NSArray<RNSResolvedGradientStop *> *stops = [RNSGradientStops.shared resolveStops:input
                                                                              epsilon:0.00001
                                                                   useDoublePrecision:YES];
    return stops.count == 3 && stops[0].position == 0 && stops[1].position == 0.5 && stops[2].position == 1 &&
        stops[1].leftColorIndex == 1;
  }
#endif
}
