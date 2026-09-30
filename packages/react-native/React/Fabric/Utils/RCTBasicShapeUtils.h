/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <react/renderer/graphics/ClipPath.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTBasicShapeUtils : NSObject

+ (UIBezierPath *_Nullable)createPathFromBasicShape:(const facebook::react::BasicShape &)basicShape
                                             bounds:(CGRect)bounds;

+ (UIBezierPath *_Nullable)createCirclePath:(const facebook::react::CircleShape &)circle bounds:(CGRect)bounds;
+ (UIBezierPath *_Nullable)createEllipsePath:(const facebook::react::EllipseShape &)ellipse bounds:(CGRect)bounds;
+ (UIBezierPath *_Nullable)createInsetPath:(const facebook::react::InsetShape &)inset bounds:(CGRect)bounds;
+ (UIBezierPath *_Nullable)createPolygonPath:(const facebook::react::PolygonShape &)polygon bounds:(CGRect)bounds;
+ (UIBezierPath *_Nullable)createRectPath:(const facebook::react::RectShape &)rect bounds:(CGRect)bounds;
+ (UIBezierPath *_Nullable)createXywhPath:(const facebook::react::XywhShape &)xywh bounds:(CGRect)bounds;

@end

NS_ASSUME_NONNULL_END
