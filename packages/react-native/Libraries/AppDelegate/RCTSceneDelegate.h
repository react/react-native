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
 * Usage:
 * 1. Declare `UIApplicationSceneManifest` in Info.plist with your SceneDelegate class.
 * 2. Subclass `RCTSceneDelegate` and configure it before calling `[super ...]` in
 *    `scene:willConnectToSession:options:`.
 *
 * ```objc
 * #import <React_RCTAppDelegate/RCTSceneDelegate.h>
 *
 * @implementation SceneDelegate
 *
 * - (void)scene:(UIScene *)scene
 *     willConnectToSession:(UISceneSession *)session
 *                  options:(UISceneConnectionOptions *)connectionOptions
 * {
 *   self.moduleName = @"MyApp"; // required: JS module name registered in AppRegistry
 *   self.initialProps = @{
 *     // optional root props
 *   };
 *   self.dependencyProvider = [[RCTAppDependencyProvider alloc] init]; // if using codegen
 *   [super scene:scene willConnectToSession:session options:connectionOptions];
 * }
 *
 * - (NSURL *)bundleURL
 * {
 *   return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
 * }
 *
 * @end
 * ```
 *
 * Required configuration (set before `[super scene:willConnectToSession:options:]`):
 *   - `moduleName` — the AppRegistry component name to mount.
 *   - `bundleURL` — override to return the JS bundle URL (raises if not implemented).
 *
 * Optional configuration:
 *   - `initialProps` — props passed to the root component.
 *   - `dependencyProvider` — codegen module/component provider.
 *   - `automaticallyLoadReactNativeWindow` — defaults to `YES`; set to `NO` to call
 *     `loadReactNativeWindow:` yourself after custom setup.
 *
 * Linking is forwarded automatically via `RCTLinkingManager`. Push notifications and other
 * `UIApplicationDelegate` callbacks should remain on your AppDelegate.
 *
 * Overridable methods (inherited from `RCTDefaultReactNativeFactoryDelegate`):
 *   - (UIViewController *)createRootViewController;
 *   - (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController;
 *   - (void)customizeRootView:(RCTRootView *)rootView;
 *   - (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;
 *   - (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
 *                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;
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
