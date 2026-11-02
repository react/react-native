/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import <React/Graphics.h>

@interface RCTBackgroundImageUtils : NSObject

+ (CGSize)calculateBackgroundImageSize:(const CGRect &)positioningArea
                     itemIntrinsicSize:(CGSize)itemIntrinsicSize
                        backgroundSize:(const facebook::react::BackgroundSize &)backgroundSize
                      backgroundRepeat:(const facebook::react::BackgroundRepeat &)backgroundRepeat;

+ (CALayer *)createBackgroundImageLayerWithSize:(const CGRect &)positioningArea
                                   paintingArea:(const CGRect &)paintingArea
                                       itemSize:(const CGSize &)itemSize
                             backgroundPosition:(const facebook::react::BackgroundPosition &)backgroundPosition
                               backgroundRepeat:(const facebook::react::BackgroundRepeat &)backgroundRepeat
                                      itemLayer:(CALayer *)itemLayer;

@end
