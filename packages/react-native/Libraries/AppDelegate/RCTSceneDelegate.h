/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import "RCTDefaultReactNativeFactoryDelegate.h"
#import "RCTReactNativeFactory.h"
#import "RCTRootViewFactory.h"

@protocol RCTBridgeDelegate;
@protocol RCTComponentViewProtocol;
@class RCTRootView;
@class RCTSurfacePresenterBridgeAdapter;
@protocol RCTDependencyProvider;

NS_ASSUME_NONNULL_BEGIN

/**
 * Optional utility base class for SceneDelegate-based React Native apps using the UIScene lifecycle.
 *
 * For AppDelegate-only apps, use `RCTAppDelegate` or `RCTReactNativeFactory` directly.
 *
 * To use it, make your SceneDelegate a subclass of RCTSceneDelegate:
 *
 * ```objc
 * #import <React_RCTAppDelegate/RCTSceneDelegate.h>
 * @interface SceneDelegate : RCTSceneDelegate
 * @end
 * ```
 *
 * Requires `UIApplicationSceneManifest` in Info.plist with your SceneDelegate class configured.
 *
 * All methods implemented by RCTSceneDelegate can be overridden. Call `[super ...]` to use the default
 * implementation.
 */
@interface RCTSceneDelegate : RCTDefaultReactNativeFactoryDelegate <UIWindowSceneDelegate>

/// The window object used to render UIViewControllers for this scene.
@property (nonatomic, strong, nullable) UIWindow *window;

#if !defined(RCT_REMOVE_LEGACY_ARCH)
@property (nonatomic, nullable) RCTBridge *bridge
    __attribute__((deprecated("The bridge is deprecated and will be removed when removing the legacy architecture.")));
@property (nonatomic, nullable) RCTSurfacePresenterBridgeAdapter *bridgeAdapter __attribute__((
    deprecated("The bridge adapter is deprecated and will be removed when removing the legacy architecture.")));
#endif

@property (nonatomic, strong, nullable) NSString *moduleName;
@property (nonatomic, strong, nullable) NSDictionary *initialProps;
@property (nonatomic, strong, nullable) RCTReactNativeFactory *reactNativeFactory;

/// If `automaticallyLoadReactNativeWindow` is set to `true`, the React Native window is loaded in
/// `scene:willConnectToSession:options:`.
@property (nonatomic, assign) BOOL automaticallyLoadReactNativeWindow;

- (RCTRootViewFactory *)rootViewFactory;

/// Loads the React Native root view into `self.window` using UIScene connection options.
- (void)loadReactNativeWindow:(UISceneConnectionOptions *_Nullable)connectionOptions;

@end

NS_ASSUME_NONNULL_END
