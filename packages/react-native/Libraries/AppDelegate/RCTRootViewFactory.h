/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>
#import "RCTJSRuntimeConfiguratorProtocol.h"

@protocol RCTCxxBridgeDelegate;
@protocol RCTComponentViewFactoryComponentProvider;
@protocol RCTTurboModuleManagerDelegate;
@protocol RCTHostDelegate;
@class RCTBridge;
@class RCTHost;
@class RCTRootView;
@class RCTSurfacePresenterBridgeAdapter;
@class RCTBundleConfiguration;
@class RCTDevMenuConfiguration;

NS_ASSUME_NONNULL_BEGIN

#pragma mark - Blocks' definitions
typedef UIView *_Nonnull (
    ^RCTCreateRootViewWithBridgeBlock)(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps);
typedef RCTBridge *_Nonnull (
    ^RCTCreateBridgeWithDelegateBlock)(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions);
typedef void (^RCTCustomizeRootViewBlock)(UIView *rootView);
typedef NSURL *_Nullable (^RCTSourceURLForBridgeBlock)(RCTBridge *bridge);
typedef NSURL *_Nullable (^RCTBundleURLBlock)(void);
typedef NSArray<id<RCTBridgeModule>> *_Nonnull (^RCTExtraModulesForBridgeBlock)(RCTBridge *bridge);
typedef NSDictionary<NSString *, Class> *_Nonnull (^RCTExtraLazyModuleClassesForBridge)(RCTBridge *bridge);
typedef BOOL (^RCTBridgeDidNotFindModuleBlock)(RCTBridge *bridge, NSString *moduleName);
typedef void (^RCTLoadSourceForBridgeWithProgressBlock)(
    RCTBridge *bridge,
    RCTSourceLoadProgressBlock onProgress,
    RCTSourceLoadBlock loadCallback);
typedef void (^RCTLoadSourceForBridgeBlock)(RCTBridge *bridge, RCTSourceLoadBlock loadCallback);

#pragma mark - RCTRootViewFactory Configuration
@interface RCTRootViewFactoryConfiguration : NSObject

/// This property controls whether the App will use the Fabric renderer of the New Architecture or not.
@property (nonatomic, assign, readonly) BOOL fabricEnabled;

/// This property controls whether React Native's new initialization layer is enabled.
@property (nonatomic, assign, readonly) BOOL bridgelessEnabled;

/// This method controls whether the `turboModules` feature of the New Architecture is turned on or off
@property (nonatomic, assign, readonly) BOOL turboModuleEnabled;

/// Return the bundle URL for the main bundle.
@property (nonatomic, nonnull) RCTBundleURLBlock bundleURLBlock;

/**
 * Use this method to initialize a new instance of `RCTRootViewFactoryConfiguration` by passing a `bundleURL`
 *
 * Which is the location of the JavaScript source file. When running from the packager
 * this should be an absolute URL, e.g. `http://localhost:8081/index.ios.bundle`.
 * When running from a locally bundled JS file, this should be a `file://` url
 * pointing to a path inside the app resources, e.g. `file://.../main.jsbundle`.
 *
 */
- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock
                        newArchEnabled:(BOOL)newArchEnabled
                    turboModuleEnabled:(BOOL)turboModuleEnabled
                     bridgelessEnabled:(BOOL)bridgelessEnabled __deprecated;

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   newArchEnabled:(BOOL)newArchEnabled
               turboModuleEnabled:(BOOL)turboModuleEnabled
                bridgelessEnabled:(BOOL)bridgelessEnabled __deprecated;

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock
                        newArchEnabled:(BOOL)newArchEnabled NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithBundleURL:(NSURL *)bundleURL newArchEnabled:(BOOL)newArchEnabled;

/**
 * Block that allows to override logic of creating root view instance.
 * It creates a `UIView` starting from a bridge, a module name and a set of initial properties.
 * By default, it is invoked using the bridge created by `RCTCreateBridgeWithDelegateBlock` (or the default
 * implementation) and the `moduleName` variable comes from `viewWithModuleName:initialProperties:launchOptions` of
 * `RCTRootViewFactory`.
 *
 * @parameter: bridge - an instance of the `RCTBridge` object.
 * @parameter: moduleName - the name of the app, used by Metro to resolve the module.
 * @parameter: initProps - a set of initial properties.
 *
 * @returns: a UIView properly configured with a bridge for React Native.
 */
@property (nonatomic, nullable) RCTCreateRootViewWithBridgeBlock createRootViewWithBridge;

/**
 * Block that allows to override default behavior of creating bridge.
 * It should return `RCTBridge` using a delegate and some launch options.
 *
 * By default, it is invoked passing `self` as a delegate.
 *
 * @parameter: delegate - an object that implements the `RCTBridgeDelegate` protocol.
 * @parameter: launchOptions - a dictionary with a set of options.
 *
 * @returns: a newly created instance of RCTBridge.
 */
@property (nonatomic, nullable) RCTCreateBridgeWithDelegateBlock createBridgeWithDelegate;

/**
 * Block that allows to customize the rootView that is passed to React Native.
 *
 * @parameter: rootView - The root view to customize.
 */
@property (nonatomic, nullable) RCTCustomizeRootViewBlock customizeRootView;

@property (nonatomic, weak, nullable) id<RCTJSRuntimeConfiguratorProtocol> jsRuntimeConfiguratorDelegate;

#pragma mark - RCTBridgeDelegate blocks

/**
 * Block that returns the location of the JavaScript source file. When running from the packager
 * this should be an absolute URL, e.g. `http://localhost:8081/index.ios.bundle`.
 * When running from a locally bundled JS file, this should be a `file://` url
 * pointing to a path inside the app resources, e.g. `file://.../main.jsbundle`.
 */
@property (nonatomic, nullable) RCTSourceURLForBridgeBlock sourceURLForBridge;

/**
 * The bridge initializes any registered RCTBridgeModules automatically, however
 * if you wish to instantiate your own module instances, you can return them
 * from this block.
 *
 * Note: You should always return a new instance for each call, rather than
 * returning the same instance each time the bridge is reloaded. Module instances
 * should not be shared between bridges, and this may cause unexpected behavior.
 *
 * It is also possible to override standard modules with your own implementations
 * by returning a class with the same `moduleName` from this method, but this is
 * not recommended in most cases - if the module methods and behavior do not
 * match exactly, it may lead to bugs or crashes.
 */
@property (nonatomic, nullable) RCTExtraModulesForBridgeBlock extraModulesForBridge;

/**
 * Retrieve the list of lazy-native-modules names for the given bridge.
 */
@property (nonatomic, nullable) RCTExtraLazyModuleClassesForBridge extraLazyModuleClassesForBridge;

/**
 * The bridge will call this block when a module has been called from JS
 * cannot be found among registered modules.
 * It should return YES if the module with name 'moduleName' was registered
 * in the implementation, and the system must attempt to look for it again among registered.
 * If the module was not registered, return NO to prevent further searches.
 */
@property (nonatomic, nullable) RCTBridgeDidNotFindModuleBlock bridgeDidNotFindModule;

/**
 * The bridge will automatically attempt to load the JS source code from the
 * location specified by the `sourceURLForBridge:` method, however, if you want
 * to handle loading the JS yourself, you can do so by setting this property.
 */
@property (nonatomic, nullable) RCTLoadSourceForBridgeWithProgressBlock loadSourceForBridgeWithProgress;

/**
 * Similar to loadSourceForBridgeWithProgress but without progress
 * reporting.
 */
@property (nonatomic, nullable) RCTLoadSourceForBridgeBlock loadSourceForBridge;

@end

#pragma mark - RCTRootViewFactory
/**
 * The RCTRootViewFactory is a utility class that encapsulates the logic of creating a new RCTRootView based on the
 * current state of the environment. It allows you to initialize your app root view for old architecture, new
 * architecture and bridgeless mode.
 *
 * This class is used to initialize rootView in RCTAppDelegate, but you can also use it separately.
 *
 * Create a new instance of this class (make sure to retain it) and call the
 * `viewWithModuleName:initialProperties:launchOptions` method to create new RCTRootView.
 */
@interface RCTRootViewFactory : NSObject

#if !defined(RCT_REMOVE_LEGACY_ARCH)
@property (nonatomic, strong, nullable) RCTBridge *bridge;
@property (nonatomic, strong, nullable) RCTSurfacePresenterBridgeAdapter *bridgeAdapter;
#endif

@property (nonatomic, strong, nullable) RCTHost *reactHost;

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration
        andTurboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate> _Nullable)turboModuleManagerDelegate;

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration;

- (instancetype)initWithTurboModuleDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                               hostDelegate:(id<RCTHostDelegate>)hostDelegate
                              configuration:(RCTRootViewFactoryConfiguration *)configuration;

/**
 * This method can be used to create new RCTRootViews on demand.
 *
 * @parameter: moduleName  - the name of the app, used by Metro to resolve the module.
 * @parameter: initialProperties  -  a set of initial properties.
 * @parameter: launchOptions  - a dictionary with a set of options.
 * @parameter: bundleConfiguration  - a configuration for custom bundle source URL.
 * @parameter: devMenuConfiguration - a configuration for enabling/disabling dev menu.
 */
- (UIView *_Nonnull)viewWithModuleName:(NSString *)moduleName
                     initialProperties:(NSDictionary *__nullable)initialProperties
                         launchOptions:(NSDictionary *__nullable)launchOptions
                   bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
                  devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration;

- (UIView *_Nonnull)viewWithModuleName:(NSString *)moduleName
                     initialProperties:(NSDictionary *__nullable)initialProperties
                         launchOptions:(NSDictionary *__nullable)launchOptions;

- (UIView *_Nonnull)viewWithModuleName:(NSString *)moduleName
                     initialProperties:(NSDictionary *__nullable)initialProperties;

- (UIView *_Nonnull)viewWithModuleName:(NSString *)moduleName;

#pragma mark - RCTRootViewFactory Helpers

/**
 * Initialize React Host/Bridge without creating a view.
 *
 * Use it to speed up later viewWithModuleName: calls.
 *
 * @parameter: launchOptions  - a dictionary with a set of options.
 * @parameter: bundleConfiguration  - a configuration for custom bundle source URL.
 * @parameter: devMenuConfiguration - a configuration for enabling/disabling dev menu.
 */
- (void)initializeReactHostWithLaunchOptions:(NSDictionary *__nullable)launchOptions
                         bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
                        devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration;

- (RCTHost *)createReactHost:(NSDictionary *__nullable)launchOptions
         bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
        devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration;

- (RCTHost *)createReactHost:(NSDictionary *__nullable)launchOptions;

@end

NS_ASSUME_NONNULL_END
