/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>

@class RCTRootView;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTUIConfiguratorProtocol
/**
 * The default `RCTColorSpace` for the app. It defaults to `RCTColorSpaceSRGB`.
 */
- (RCTColorSpace)defaultColorSpace;

/**
 * This method can be used to customize the rootView that is passed to React Native.
 * Override on your `RCTReactNativeFactoryDelegate` (e.g. in AppDelegate, SceneDelegate, or
 * `RCTAppDelegate` subclass). Example:
 * ```
 * - (void)customizeRootView:(RCTRootView *)rootView
 * {
 *   rootView.backgroundColor = [UIColor colorWithDynamicProvider:^UIColor *(UITraitCollection *traitCollection) {
 *     if ([traitCollection userInterfaceStyle] == UIUserInterfaceStyleDark) {
 *       return [UIColor blackColor];
 *     } else {
 *       return [UIColor whiteColor];
 *     }
 *   }];
 * }
 * ```
 *
 * @parameter: rootView - The root view to customize.
 */
- (void)customizeRootView:(RCTRootView *)rootView;

/**
 * It creates the RootViewController.
 * By default, it creates a new instance of a `UIViewController`.
 * You can override it to provide your own initial ViewController.
 *
 * @return: an instance of `UIViewController`.
 */
- (UIViewController *)createRootViewController;

/**
 * It assigns the rootView to the rootViewController
 * By default, it assigns the rootView to the view property of the rootViewController
 * If you are not using a simple UIViewController, then there could be other methods to use to setup the rootView.
 * For example: UISplitViewController requires `setViewController(_:for:)`
 */
- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController;
@end

NS_ASSUME_NONNULL_END
