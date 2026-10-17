/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTStatusBarAppearance.h"

#import "RCTAssert.h"
#import "RCTUtils.h"

static UIStatusBarStyle sStyle = UIStatusBarStyleDefault;
static BOOL sHidden = NO;
static UIStatusBarAnimation sUpdateAnimation = UIStatusBarAnimationNone;

@implementation RCTStatusBarAppearance

+ (UIStatusBarStyle)style
{
  return sStyle;
}

+ (BOOL)hidden
{
  return sHidden;
}

+ (UIStatusBarAnimation)updateAnimation
{
  return sUpdateAnimation;
}

+ (void)setStyle:(UIStatusBarStyle)style animated:(BOOL)animated
{
  RCTAssertMainQueue();
  sStyle = style;
  [self updateStatusBarAnimated:animated];
}

+ (void)setHidden:(BOOL)hidden withAnimation:(UIStatusBarAnimation)animation
{
  RCTAssertMainQueue();
  sHidden = hidden;
  sUpdateAnimation = animation;
  [self updateStatusBarAnimated:animation != UIStatusBarAnimationNone];
}

+ (void)updateStatusBarAnimated:(BOOL)animated
{
  UIViewController *viewController = RCTPresentedViewController();
  if (animated) {
    [UIView animateWithDuration:UINavigationControllerHideShowBarDuration
                     animations:^{
                       [viewController setNeedsStatusBarAppearanceUpdate];
                     }];
  } else {
    [viewController setNeedsStatusBarAppearanceUpdate];
  }
}

@end
