/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTViewControllerAppearanceListener <NSObject>

@optional
- (void)reactViewControllerDidAppear:(UIViewController *)viewController animated:(BOOL)animated;
- (void)reactViewControllerDidDisappear:(UIViewController *)viewController animated:(BOOL)animated;

@end

@interface UIViewController (React)

@property (nonatomic, assign, readonly) BOOL reactViewControllerIsVisible;

- (void)reactAddViewControllerAppearanceListener:(id<RCTViewControllerAppearanceListener>)listener;
- (void)reactRemoveViewControllerAppearanceListener:(id<RCTViewControllerAppearanceListener>)listener;

/**
 * Call from `viewDidAppear:` / `viewDidDisappear:` in UIViewController subclasses
 * that want to notify registered React Native appearance listeners.
 */
- (void)reactNotifyViewControllerDidAppear:(BOOL)animated;
- (void)reactNotifyViewControllerDidDisappear:(BOOL)animated;

@end

NS_ASSUME_NONNULL_END
