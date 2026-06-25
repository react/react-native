/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBundleManager.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTDevLoadingViewSetEnabled.h>
#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTLog.h"

@implementation RCTBundleConfiguration

+ (instancetype)defaultConfiguration
{
  return [[self alloc] initWithBundleFilePath:nil packagerServerScheme:nil packagerServerHost:nil bundlePath:nil];
}

- (instancetype)initWithBundleFilePath:(NSURL *)bundleFilePath
{
  return [self initWithBundleFilePath:bundleFilePath packagerServerScheme:nil packagerServerHost:nil bundlePath:nil];
}

- (instancetype)initWithPackagerServerScheme:(NSString *)packagerServerScheme
                          packagerServerHost:(NSString *)packagerServerHost
                                  bundlePath:(NSString *)bundlePath
{
  return [self initWithBundleFilePath:nil
                 packagerServerScheme:packagerServerScheme
                   packagerServerHost:packagerServerHost
                           bundlePath:bundlePath];
}

- (instancetype)initWithBundleFilePath:(NSURL *)bundleFilePath
                  packagerServerScheme:(NSString *)packagerServerScheme
                    packagerServerHost:(NSString *)packagerServerHost
                            bundlePath:(NSString *)bundlePath
{
  if (self = [super init]) {
    _bundleFilePath = bundleFilePath;
    _packagerServerScheme = packagerServerScheme;
    _packagerServerHost = packagerServerHost;
    _bundlePath = bundlePath;
    _packagerOptionsUpdater = ^NSMutableArray<NSURLQueryItem *> *(NSMutableArray<NSURLQueryItem *> *options)
    {
      return options;
    };

    // When the bundleFilePath is set in the RCTBundleConfiguration the Metro connection
    // shouldn't be suggested/required.
    if (_bundleFilePath != nil) {
      RCTDevLoadingViewSetEnabled(false);
    }
  }

  return self;
}

- (NSString *)getPackagerServerScheme
{
  if (!_packagerServerScheme) {
    return [[RCTBundleURLProvider sharedSettings] packagerScheme];
  }

  return _packagerServerScheme;
}

- (NSString *)getPackagerServerHost
{
  if (!_packagerServerHost) {
    return [[RCTBundleURLProvider sharedSettings] packagerServerHostPort];
  }

  return _packagerServerHost;
}

- (NSURL *)getBundleURL
{
  if (_packagerServerScheme && _packagerServerHost) {
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:_bundlePath
                                                      packagerServerScheme:_packagerServerScheme
                                                        packagerServerHost:_packagerServerHost
                                                    packagerOptionsUpdater:_packagerOptionsUpdater];
  }

  if (_bundleFilePath) {
    if (!_bundleFilePath.fileURL) {
      RCTLogError(@"Bundle file path must be a file URL");
      return nil;
    }

    return _bundleFilePath;
  }

  return nil;
}

@end

@implementation RCTBundleManager {
  RCTBridgelessBundleURLGetter _bridgelessBundleURLGetter;
  RCTBridgelessBundleURLSetter _bridgelessBundleURLSetter;
  RCTBridgelessBundleURLGetter _bridgelessBundleURLDefaultGetter;
}

- (instancetype)initWithBundleConfig:(RCTBundleConfiguration *)bundleConfig
{
  if (self = [super init]) {
    self.bundleConfig = bundleConfig ? bundleConfig : [RCTBundleConfiguration defaultConfiguration];
  }

  return self;
}

- (instancetype)init
{
  return [self initWithBundleConfig:[RCTBundleConfiguration defaultConfiguration]];
}

- (void)setBridgelessBundleURLGetter:(RCTBridgelessBundleURLGetter)getter
                           andSetter:(RCTBridgelessBundleURLSetter)setter
                    andDefaultGetter:(RCTBridgelessBundleURLGetter)defaultGetter
{
  _bridgelessBundleURLGetter = getter;
  _bridgelessBundleURLSetter = setter;
  _bridgelessBundleURLDefaultGetter = defaultGetter;
}

- (void)setBundleURL:(NSURL *)bundleURL
{
  RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLSetter must not be nil.");
  _bridgelessBundleURLSetter(bundleURL);
}

- (NSURL *)bundleURL
{
  RCTAssert(
      _bridgelessBundleURLGetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLGetter must not be nil.");

  NSURL *bundleURL = [_bundleConfig getBundleURL];

  if (bundleURL == nil) {
    return _bridgelessBundleURLGetter();
  }

  return bundleURL;
}

- (void)resetBundleURL
{
  RCTAssert(
      _bridgelessBundleURLDefaultGetter != nil,
      @"RCTBundleManager: In bridgeless mode, default RCTBridgelessBundleURLGetter must not be nil.");
  RCTAssert(
      _bridgelessBundleURLSetter != nil,
      @"RCTBundleManager: In bridgeless mode, RCTBridgelessBundleURLSetter must not be nil.");

  _bridgelessBundleURLSetter(_bridgelessBundleURLDefaultGetter());
}

@end
