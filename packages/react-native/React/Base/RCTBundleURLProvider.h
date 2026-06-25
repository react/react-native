/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

#import "RCTBundleManager.h"

RCT_EXTERN NSString *_Nonnull const RCTBundleURLProviderUpdatedNotification;
RCT_EXTERN const NSUInteger kRCTBundleURLProviderDefaultPort;

#if RCT_DEV_MENU | RCT_PACKAGER_LOADING_FUNCTIONALITY
/**
 * Allow/disallow accessing the packager server for various runtime scenario.
 * For instance, if a test run should never access the packager, disable it
 * by calling this function before initializing React Native (RCTBridge etc).
 * By default the access is enabled.
 */
RCT_EXTERN void RCTBundleURLProviderAllowPackagerServerAccess(BOOL allowed);
#endif

NS_ASSUME_NONNULL_BEGIN

@interface RCTBundleURLProvider : NSObject

/**
 * Reset every settings to default.
 */
- (void)resetToDefaults;

/**
 * Return the server host. If its a development build and there's no jsLocation defined,
 * it will return the server host IP address
 */
- (NSString *)packagerServerHost;

/**
 * Return the server host with optional port. If its a development build and there's no jsLocation defined,
 * it will return the server host IP address
 */
- (NSString *)packagerServerHostPort;

/**
 * Returns if there's a packager running at the given host port.
 * The port is optional, if not specified, kRCTBundleURLProviderDefaultPort will be used
 */
+ (BOOL)isPackagerRunning:(NSString *)hostPort;

/**
 * Returns if there's a packager running at the given scheme://host:port.
 * The port is optional, if not specified, kRCTBundleURLProviderDefaultPort will be used
 * The scheme is also optional, if not specified, a default http protocol will be used
 */
+ (BOOL)isPackagerRunning:(NSString *)hostPort scheme:(NSString *__nullable)scheme;

/**
 * Asynchronously checks if there's a packager running at the given host:port.
 * The port is optional, if not specified, kRCTBundleURLProviderDefaultPort will be used
 * The completion handler is called on an arbitrary queue.
 */
+ (void)isPackagerRunningAsync:(NSString *)hostPort completion:(void (^)(BOOL isRunning))completion;

/**
 * Asynchronously checks if there's a packager running at the given scheme://host:port.
 * The port is optional, if not specified, kRCTBundleURLProviderDefaultPort will be used
 * The scheme is also optional, if not specified, a default http protocol will be used
 * The completion handler is called on an arbitrary queue.
 */
+ (void)isPackagerRunningAsync:(NSString *)hostPort
                        scheme:(NSString *__nullable)scheme
                    completion:(void (^)(BOOL isRunning))completion;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle if the packager is not running.
 */
- (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                          fallbackURLProvider:(NSURL *__nullable (^)(void))fallbackURLProvider;

/**
 * Returns the jsBundleURL for a given split bundle entrypoint in development
 */
- (NSURL *__nullable)jsBundleURLForSplitBundleRoot:(NSString *)bundleRoot;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle if the packager is not running.
 * if extension is nil, "jsbundle" will be used.
 */
- (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackExtension:(NSString *__nullable)extension;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle if the packager is not running.
 */
- (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle. If extension is nil,
 * "jsbundle" will be used.
 */
- (NSURL *__nullable)jsBundleURLForFallbackExtension:(NSString *__nullable)extension;

/**
 * Returns the jsBundleURL for a given bundle entrypoint,
 * the packager scheme, server host and options updater
 * for modifying default packager options.
 */
- (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                         packagerServerScheme:(NSString *)packagerServerScheme
                           packagerServerHost:(NSString *)packagerServerHost
                       packagerOptionsUpdater:(RCTPackagerOptionsUpdater)packagerOptionsUpdater;

/**
 * Returns the resourceURL for a given bundle entrypoint and
 * the fallback offline resource file if the packager is not running.
 */
- (NSURL *__nullable)resourceURLForResourceRoot:(NSString *)root
                                   resourceName:(NSString *)name
                              resourceExtension:(NSString *)extension
                                  offlineBundle:(NSBundle *)offlineBundle;

/**
 * Returns the query items for given options used to create the jsBundleURL.
 */
+ (NSArray<NSURLQueryItem *> *)createJSBundleURLQuery:(NSString *)packagerHost
                                       packagerScheme:(NSString *__nullable)scheme
                                            enableDev:(BOOL)enableDev
                                   enableMinification:(BOOL)enableMinification
                                      inlineSourceMap:(BOOL)inlineSourceMap
                                          modulesOnly:(BOOL)modulesOnly
                                            runModule:(BOOL)runModule
                                    additionalOptions:
                                        (NSDictionary<NSString *, NSString *> *__nullable)additionalOptions;

/**
 * The IP address or hostname of the packager.
 */
@property (nonatomic, copy, nullable) NSString *jsLocation;

@property (nonatomic, assign) BOOL enableMinification;
@property (nonatomic, assign) BOOL enableDev;
@property (nonatomic, assign) BOOL inlineSourceMap;

/**
 * The scheme/protocol used of the packager, the default is the http protocol
 */
@property (nonatomic, copy) NSString *packagerScheme;

+ (instancetype)sharedSettings;

/**
 * Given a hostname for the packager and a bundle root, returns the URL to the js bundle. Generally you should use the
 * instance method -jsBundleURLForBundleRoot:fallbackExtension: which includes logic to guess if the packager is running
 * and fall back to a pre-packaged bundle if it is not.
 *
 * The options here mirror some of Metro's Bundling Options:
 * - enableDev: Whether to keep or remove `__DEV__` blocks from the bundle.
 * - enableMinification: Enables or disables minification. Usually production bundles are minified and development
 *     bundles are not.
 * - inlineSourceMap: When true, the bundler will inline the source map in the bundle
 * - modulesOnly: When true, will only send module definitions without polyfills and without the require-runtime.
 * - runModule: When true, will run the main module after defining all modules. This is used in the main bundle but not
 *     in split bundles.
 * - additionalOptions: A dictionary of name-value pairs of additional options to pass to the packager.
 */
+ (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                                 packagerHost:(NSString *)packagerHost
                                    enableDev:(BOOL)enableDev
                           enableMinification:(BOOL)enableMinification
                              inlineSourceMap:(BOOL)inlineSourceMap;

+ (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                                 packagerHost:(NSString *)packagerHost
                                    enableDev:(BOOL)enableDev
                           enableMinification:(BOOL)enableMinification
                              inlineSourceMap:(BOOL)inlineSourceMap
                            additionalOptions:(NSDictionary<NSString *, NSString *> *__nullable)additionalOptions;

+ (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                                 packagerHost:(NSString *)packagerHost
                               packagerScheme:(NSString *__nullable)scheme
                                    enableDev:(BOOL)enableDev
                           enableMinification:(BOOL)enableMinification
                              inlineSourceMap:(BOOL)inlineSourceMap
                                  modulesOnly:(BOOL)modulesOnly
                                    runModule:(BOOL)runModule;

+ (NSURL *__nullable)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                                 packagerHost:(NSString *)packagerHost
                               packagerScheme:(NSString *__nullable)scheme
                                    enableDev:(BOOL)enableDev
                           enableMinification:(BOOL)enableMinification
                              inlineSourceMap:(BOOL)inlineSourceMap
                                  modulesOnly:(BOOL)modulesOnly
                                    runModule:(BOOL)runModule
                            additionalOptions:(NSDictionary<NSString *, NSString *> *__nullable)additionalOptions;

/**
 * Given a hostname for the packager and a resource path (including "/"), return the URL to the resource.
 * In general, please use the instance method to decide if the packager is running and fallback to the pre-packaged
 * resource if it is not: -resourceURLForResourceRoot:resourceName:resourceExtension:offlineBundle:
 */
+ (NSURL *)resourceURLForResourcePath:(NSString *)path
                         packagerHost:(NSString *)packagerHost
                               scheme:(NSString *__nullable)scheme
                                query:(NSString *__nullable)query
    __deprecated_msg("Use version with queryItems parameter instead");

/**
 * Given a hostname for the packager and a resource path (including "/"), return the URL to the resource.
 * In general, please use the instance method to decide if the packager is running and fallback to the pre-packaged
 * resource if it is not: -resourceURLForResourceRoot:resourceName:resourceExtension:offlineBundle:
 */
+ (NSURL *)resourceURLForResourcePath:(NSString *)path
                         packagerHost:(NSString *)packagerHost
                               scheme:(NSString *)scheme
                           queryItems:(NSArray<NSURLQueryItem *> *__nullable)queryItems;

@end

NS_ASSUME_NONNULL_END
