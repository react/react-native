/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <react/renderer/graphics/ConicGradient.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTConicGradient : NSObject

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const facebook::react::ConicGradient &)gradient;

@end

NS_ASSUME_NONNULL_END
