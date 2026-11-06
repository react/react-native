/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Filter.h>

#import <CoreImage/CoreImage.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTBackdropFilterUtils : NSObject

/**
 * Applies filterFunctions as a chained CIFilter pipeline to image and returns
 * the result. scale is the display scale factor used to convert CSS pixel
 * values to device pixels (e.g. blur radius). Returns the original image if
 * no applicable filters are present.
 */
+ (CIImage *)applyCIFilterFunctions:(const std::vector<facebook::react::FilterFunction> &)filterFunctions
                            toImage:(CIImage *)image
                              scale:(CGFloat)scale;

@end

NS_ASSUME_NONNULL_END
