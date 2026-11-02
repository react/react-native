/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/View.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTRadialGradient : NSObject

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const facebook::react::RadialGradient &)gradient;

@end

NS_ASSUME_NONNULL_END
