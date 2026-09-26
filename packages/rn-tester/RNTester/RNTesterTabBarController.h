/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class RCTReactNativeFactory;

NS_ASSUME_NONNULL_BEGIN

/**
 * The native navigator for RNTester: a tab for each of Components, Playground,
 * and APIs, each a navigation stack of React Native surfaces.
 */
@interface RNTesterTabBarController : UITabBarController

- (instancetype)initWithReactNativeFactory:(RCTReactNativeFactory *)reactNativeFactory
                         initialProperties:(NSDictionary *)initialProperties
                             launchOptions:(nullable NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithNibName:(nullable NSString *)nibNameOrNil
                         bundle:(nullable NSBundle *)nibBundleOrNil NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)coder NS_UNAVAILABLE;

/**
 * Pushes the screen for a route onto the selected tab's stack.
 *
 * A route has a `moduleKey` and `title`, and optionally an `exampleKey`, a
 * `documentationURL`, and `hidesChrome` to hide the navigation and tab bars.
 */
- (void)pushRoute:(NSDictionary *)route;

/**
 * Selects the Components tab, pops it to its root, and pushes the route.
 */
- (void)pushRouteFromDeepLink:(NSDictionary *)route;

@end

NS_ASSUME_NONNULL_END
