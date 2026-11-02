/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <vector>

#import <React/Graphics.h>
#import <React/RCTBorderDrawing.h>
#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>

RCT_EXTERN CALayer *RCTGetBoxShadowLayer(
    const facebook::react::BoxShadow &shadow,
    RCTCornerRadii cornerRadii,
    UIEdgeInsets edgeInsets,
    CGSize layerSize);
