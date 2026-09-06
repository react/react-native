/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwiftUIContainerViewWrapper.h"

@import RCTSwiftUI;

@interface RCTSwiftUIContainerViewWrapper ()
@property (nonatomic, strong) RCTSwiftUIContainerView *swiftContainerView;
@end

@implementation RCTSwiftUIContainerViewWrapper

- (instancetype)init
{
  if (self = [super init]) {
    _swiftContainerView = [RCTSwiftUIContainerView new];
  }
  return self;
}

- (UIView *_Nullable)contentView
{
  return [self.swiftContainerView contentView];
}

- (UIView *_Nullable)hostingView
{
  return [self.swiftContainerView hostingView];
}

- (void)attachToParentViewController:(UIViewController *)parentViewController inContainerView:(UIView *)containerView
{
  [self.swiftContainerView attachTo:parentViewController in:containerView];
}

- (void)detachFromParentViewController
{
  [self.swiftContainerView detachFromParentViewController];
}

- (void)resetStyles
{
  [self.swiftContainerView resetStyles];
}

- (void)updateContentView:(UIView *)view
{
  return [self.swiftContainerView updateContentView:view];
}

- (void)updateBlurRadius:(NSNumber *)radius
{
  [self.swiftContainerView updateBlurRadius:radius];
}

- (void)updateGrayscale:(NSNumber *)grayscale
{
  [self.swiftContainerView updateGrayscale:grayscale];
}

- (void)updateSaturation:(NSNumber *)saturation
{
  [self.swiftContainerView updateSaturation:saturation];
}

- (void)updateContrast:(NSNumber *)contrast
{
  [self.swiftContainerView updateContrast:contrast];
}

- (void)updateHueRotate:(NSNumber *)degrees
{
  [self.swiftContainerView updateHueRotate:degrees];
}

- (void)updateDropShadow:(NSNumber *)standardDeviation x:(NSNumber *)x y:(NSNumber *)y color:(UIColor *)color
{
  [self.swiftContainerView updateDropShadowWithStandardDeviation:standardDeviation x:x y:y color:color];
}

- (void)updateLayoutWithBounds:(CGRect)bounds
{
  [self.swiftContainerView updateLayoutWithBounds:bounds];
}

@end
