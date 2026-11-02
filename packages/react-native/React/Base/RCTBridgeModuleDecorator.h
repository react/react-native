/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBridgeModule.h"

@class RCTBundleManager;
@class RCTCallableJSModules;
@class RCTModuleRegistry;
@class RCTPerformanceLogger;
@class RCTViewRegistry;

/**
 RCTBridgeModuleDecorator contains instances that can be initialized with @synthesize
 in RCTBridgeModules. For the Fabric interop layer.

 In Bridgeless, @synthesize ivars are passed from RCTBridgeModuleDecorator.
 In Bridge, @synthesize ivars are passed from RCTModuleData.
 */
@interface RCTBridgeModuleDecorator : NSObject
@property (nonatomic, strong, readonly) RCTViewRegistry *viewRegistry_DEPRECATED;
@property (nonatomic, strong, readonly) RCTModuleRegistry *moduleRegistry;
@property (nonatomic, strong, readonly) RCTBundleManager *bundleManager;
@property (nonatomic, strong, readonly) RCTCallableJSModules *callableJSModules;
@property (nonatomic, copy, readonly) NSDictionary *launchOptions;
@property (nonatomic, strong, readonly) RCTPerformanceLogger *performanceLogger;

- (instancetype)initWithViewRegistry:(RCTViewRegistry *)viewRegistry
                      moduleRegistry:(RCTModuleRegistry *)moduleRegistry
                       bundleManager:(RCTBundleManager *)bundleManager
                   callableJSModules:(RCTCallableJSModules *)callableJSModules
                       launchOptions:(NSDictionary *)launchOptions
                   performanceLogger:(RCTPerformanceLogger *)performanceLogger;

- (void)attachInteropAPIsToModule:(id<RCTBridgeModule>)bridgeModule;

@end
