/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactNativeShared/ReactNativeShared.h>

// Linked into the host for static React Native, or into one dedicated dylib for
// dynamic React Native. The dynamic host never links ReactNativeShared again.
extern "C" NSArray<RNSResolvedGradientStop *> *ReactNativeSharedFixtureStops()
{
  NSArray *input = @[
    [[RNSGradientStopInput alloc] initWithPosition:nil hasColor:YES],
    [[RNSGradientStopInput alloc] initWithPosition:nil hasColor:YES],
    [[RNSGradientStopInput alloc] initWithPosition:nil hasColor:YES],
  ];
  return [RNSGradientStops.shared resolveStops:input epsilon:0.005 useDoublePrecision:YES];
}
