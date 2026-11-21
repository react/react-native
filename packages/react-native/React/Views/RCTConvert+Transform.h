/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import "UIView+React.h"

/**
 * Whether every entry of a transform is finite as a float, the type React Native holds a transform's numbers in. Core
 * Animation hides a layer whose transform is not finite, and can hide its siblings.
 */
RCT_EXTERN BOOL RCTIsFiniteTransform(CATransform3D transform);

@interface RCTConvert (Transform)

+ (CATransform3D)CATransform3D:(id)json;

+ (RCTTransformOrigin)RCTTransformOrigin:(id)json;

@end
