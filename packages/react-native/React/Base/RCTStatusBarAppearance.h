/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * The status bar state set from JavaScript. Root view controllers return these values from their status bar methods.
 */
@interface RCTStatusBarAppearance : NSObject

@property (class, nonatomic, readonly) UIStatusBarStyle style;
@property (class, nonatomic, readonly) BOOL hidden;
@property (class, nonatomic, readonly) UIStatusBarAnimation updateAnimation;

+ (void)setStyle:(UIStatusBarStyle)style animated:(BOOL)animated;
+ (void)setHidden:(BOOL)hidden withAnimation:(UIStatusBarAnimation)animation;

@end

NS_ASSUME_NONNULL_END
