/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <Foundation/Foundation.h>
#include <React/Graphics.h>
#import <vector>

NS_ASSUME_NONNULL_BEGIN

@interface RCTGradientUtils : NSObject

+ (std::vector<facebook::react::ProcessedColorStop>)getFixedColorStops:
                                                        (const std::vector<facebook::react::ColorStop> &)colorStops
                                                    gradientLineLength:(CGFloat)gradientLineLength;

// CAGradientLayer linear gradient squishes the non-square gradient to square gradient.
// This function fixes the "squished" effect.
// See https://stackoverflow.com/a/43176174 for more information.
+ (std::pair<CGPoint, CGPoint>)pointsForCAGradientLayerLinearGradient:(CGPoint)startPoint
                                                             endPoint:(CGPoint)endPoint
                                                               bounds:(CGSize)bounds;

+ (void)getColors:(NSMutableArray<id> *)colors
      andLocations:(NSMutableArray<NSNumber *> *)locations
    fromColorStops:(const std::vector<facebook::react::ProcessedColorStop> &)colorStops;

@end

NS_ASSUME_NONNULL_END
