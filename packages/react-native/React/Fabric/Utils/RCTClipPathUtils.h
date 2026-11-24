/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import <React/RCTBorderDrawing.h>
#import <react/renderer/components/view/YogaStylableProps.h>
#import <react/renderer/components/view/primitives.h>
#import <react/renderer/core/LayoutMetrics.h>
#import <react/renderer/graphics/ClipPath.h>
#import <yoga/style/Style.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTClipPathUtils : NSObject

+ (RCTCornerRadii)adjustCornerRadiiForGeometryBox:(facebook::react::GeometryBox)geometryBox
                                      cornerRadii:(RCTCornerRadii)cornerRadii
                                    layoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
                                yogaStylableProps:(const facebook::react::YogaStylableProps &)yogaStylableProps;

+ (CGRect)getGeometryBoxRect:(facebook::react::GeometryBox)geometryBox
               layoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           yogaStylableProps:(const facebook::react::YogaStylableProps &)yogaStylableProps
                      bounds:(CGRect)bounds;

+ (CALayer *_Nullable)createClipPathLayer:(const facebook::react::ClipPath &)clipPath
                            layoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
                        yogaStylableProps:(const facebook::react::YogaStylableProps &)yogaStylableProps
                                   bounds:(CGRect)bounds
                              cornerRadii:(RCTCornerRadii)cornerRadii;

@end

NS_ASSUME_NONNULL_END
