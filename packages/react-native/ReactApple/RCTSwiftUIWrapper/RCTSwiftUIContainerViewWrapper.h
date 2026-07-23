/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTSwiftUIContainerViewWrapper : NSObject

- (UIView *_Nullable)contentView;
- (void)updateBlurRadius:(NSNumber *)radius;
- (void)updateGrayscale:(NSNumber *)grayscale;
- (void)updateDropShadow:(NSNumber *)standardDeviation x:(NSNumber *)x y:(NSNumber *)y color:(UIColor *)color;
- (void)updateSaturation:(NSNumber *)saturation;
- (void)updateContrast:(NSNumber *)contrast;
- (void)updateHueRotate:(NSNumber *)degrees;
- (void)updateContentView:(UIView *)view;
- (UIView *_Nullable)hostingView;
- (void)attachToParentViewController:(UIViewController *)parentViewController inContainerView:(UIView *)containerView;
- (void)detachFromParentViewController;
- (void)resetStyles;
- (void)updateLayoutWithBounds:(CGRect)bounds;

@end

NS_ASSUME_NONNULL_END
