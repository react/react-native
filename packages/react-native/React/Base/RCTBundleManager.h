/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

typedef NSURL *_Nullable (^RCTBridgelessBundleURLGetter)(void);
typedef void (^RCTBridgelessBundleURLSetter)(NSURL *_Nullable bundleURL);
typedef NSMutableArray<NSURLQueryItem *> *_Nullable (^RCTPackagerOptionsUpdater)(
    NSMutableArray<NSURLQueryItem *> *_Nullable options);

/**
 * Configuration class for setting up custom bundle locations
 */
@interface RCTBundleConfiguration : NSObject

+ (nonnull instancetype)defaultConfiguration;

/**
 * The URL of the bundle to load from the file system
 */
@property (nonatomic, readonly, nullable) NSURL *bundleFilePath;

/**
 * The server scheme (e.g. http or https) to use when loading from the packager
 */
@property (nonatomic, readonly, nullable) NSString *packagerServerScheme;

/**
 * The server host (e.g. localhost) to use when loading from the packager
 */
@property (nonatomic, readonly, nullable) NSString *packagerServerHost;

/**
 * A block that modifies the packager options when loading from the packager
 */
@property (nonatomic, copy, nullable) RCTPackagerOptionsUpdater packagerOptionsUpdater;

/**
 * The relative path to the bundle.
 */
@property (nonatomic, readonly, nullable) NSString *bundlePath;

- (nonnull instancetype)initWithBundleFilePath:(nullable NSURL *)bundleFilePath;

- (nonnull instancetype)initWithPackagerServerScheme:(nullable NSString *)packagerServerScheme
                                  packagerServerHost:(nullable NSString *)packagerServerHost
                                          bundlePath:(nullable NSString *)bundlePath;

- (nullable NSURL *)getBundleURL;

- (nonnull NSString *)getPackagerServerScheme;

- (nonnull NSString *)getPackagerServerHost;

@end

/**
 * A class that allows NativeModules/TurboModules to read/write the bundleURL, with or without the bridge.
 */
@interface RCTBundleManager : NSObject

- (nullable instancetype)initWithBundleConfig:(nullable RCTBundleConfiguration *)bundleConfig;

- (void)setBridgelessBundleURLGetter:(nullable RCTBridgelessBundleURLGetter)getter
                           andSetter:(nullable RCTBridgelessBundleURLSetter)setter
                    andDefaultGetter:(nullable RCTBridgelessBundleURLGetter)defaultGetter;
- (void)resetBundleURL;
@property (nonatomic, nullable) NSURL *bundleURL;
@property (nonatomic, nonnull) RCTBundleConfiguration *bundleConfig;
@end
