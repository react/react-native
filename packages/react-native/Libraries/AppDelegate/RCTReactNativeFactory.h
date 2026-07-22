/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeDelegate.h>
#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>
#import "RCTDependencyProvider.h"
#import "RCTJSRuntimeConfiguratorProtocol.h"
#import "RCTRootViewFactory.h"
#import "RCTUIConfiguratorProtocol.h"

#if defined(__cplusplus) // Don't conform to protocols requiring C++ when it's not defined.
#import <React/RCTComponentViewFactory.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#endif

@class RCTBridge;
@protocol RCTComponentViewProtocol;
@class RCTSurfacePresenterBridgeAdapter;
@class RCTBundleConfiguration;
@class RCTDevMenuConfiguration;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, RCTReleaseLevel) { Canary, Experimental, Stable };

@protocol RCTReactNativeFactoryDelegate <
    RCTBridgeDelegate,
    RCTUIConfiguratorProtocol,
#if defined(__cplusplus) // Don't conform to protocols requiring C++ when it's not defined.
    RCTHostDelegate,
    RCTTurboModuleManagerDelegate,
    RCTComponentViewFactoryComponentProvider,
#endif
    RCTJSRuntimeConfiguratorProtocol>

/// Return the bundle URL for the main bundle.
- (NSURL *__nullable)bundleURL;

@property (nonatomic, strong) id<RCTDependencyProvider> dependencyProvider;

@optional
/// This method returns a map of Component Descriptors and Components classes that needs to be registered in the
/// new renderer. The Component Descriptor is a string which represent the name used in JS to refer to the native
/// component. The default implementation returns an empty dictionary. Subclasses can override this method to register
/// the required components.
///
/// @return a dictionary that associate a component for the new renderer with his descriptor.
- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;

@end

@interface RCTReactNativeFactory : NSObject

/**
 * Bootstrap entrypoints:
 * - **AppDelegate path**: `startReactNativeWithModuleName:inWindow:launchOptions:` — call from
 *   `application:didFinishLaunchingWithOptions:` or `RCTAppDelegate`.
 * - **SceneDelegate path**: `startReactNativeWithModuleName:inWindow:connectionOptions:` — call from
 *   `scene:willConnectToSession:options:` in your app-owned `SceneDelegate` (subclass
 *   `RCTDefaultReactNativeFactoryDelegate` and conform to `UIWindowSceneDelegate`).
 *
 * **Multi-scene / multi-window (unsupported):** When using the SceneDelegate path, React Native
 * checks that Info.plist does not set `UIApplicationSupportsMultipleScenes` to `true`, since
 * running multiple React Native instances in one process is unsupported. The app crashes by default;
 * define `RN_ALLOW_MULTIPLE_SCENES` on the app target (e.g. `GCC_PREPROCESSOR_DEFINITIONS` or
 * `OTHER_CFLAGS`: `-DRN_ALLOW_MULTIPLE_SCENES=1`) to downgrade the check to a warning.
 */

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate;

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate releaseLevel:(RCTReleaseLevel)releaseLevel;

- (void)startReactNativeWithModuleName:(NSString *)moduleName inWindow:(UIWindow *_Nullable)window;

- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                         launchOptions:(NSDictionary *_Nullable)launchOptions;

- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                     initialProperties:(NSDictionary *_Nullable)initialProperties
                         launchOptions:(NSDictionary *_Nullable)launchOptions;

/// This is a SceneDelegate entrypoint method to start a React Native instance with the specified module name, window
/// and connection options for linking & user activity information. As it's usual for the typical deep-linking use case,
/// only the first item in URLContexts from connectionOptions will be checked; the same applies to userActivities.
/// @param moduleName name of the JS module to load
/// @param window the window to launch in
/// @param connectionOptions the scene's connection options
- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                     connectionOptions:(UISceneConnectionOptions *_Nullable)connectionOptions;

/// This is a SceneDelegate entrypoint method to start a React Native instance with the specified module name, window
/// and connection options for linking, initial properties & user activity information. As it's usual for the typical
/// deep-linking use case, only the first item in URLContexts from connectionOptions will be checked; the same applies
/// to userActivities.
/// @param moduleName name of the JS module to load
/// @param window the window to launch in
/// @param initialProperties the initial root properties
/// @param connectionOptions the scene's connection options
- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                     initialProperties:(NSDictionary *_Nullable)initialProperties
                     connectionOptions:(UISceneConnectionOptions *_Nullable)connectionOptions;

@property (nonatomic, nullable) RCTBridge *bridge
    __attribute__((deprecated("The bridge is deprecated and will be removed when removing the legacy architecture.")));

@property (nonatomic, strong, nonnull) RCTRootViewFactory *rootViewFactory;

@property (nonatomic, weak) id<RCTReactNativeFactoryDelegate> delegate;

@property (nonatomic, strong, nonnull) RCTBundleConfiguration *bundleConfiguration;

@property (nonatomic, nullable) RCTDevMenuConfiguration *devMenuConfiguration;

@end

NS_ASSUME_NONNULL_END
