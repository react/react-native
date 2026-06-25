/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RCTBridgeModule.h"

NS_ASSUME_NONNULL_BEGIN

@class RCTBundleManager;
@class RCTCallableJSModules;
@class RCTModuleRegistry;
@class RCTPerformanceLogger;
@class RCTViewRegistry;

@interface RCTBridgeProxy : NSProxy

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 * The performance logger for this React instance. In bridgeless mode it is
 * injected by RCTInstance so that consumers reading `[bridge performanceLogger]`
 * on `RCTJavaScriptDidLoadNotification` keep working; previously it returned nil.
 */
@property (nonatomic, strong, nullable) RCTPerformanceLogger *performanceLogger;

- (instancetype)initWithViewRegistry:(RCTViewRegistry *)viewRegistry
                      moduleRegistry:(RCTModuleRegistry *)moduleRegistry
                       bundleManager:(RCTBundleManager *)bundleManager
                   callableJSModules:(RCTCallableJSModules *)callableJSModules
                  dispatchToJSThread:(void (^)(dispatch_block_t))dispatchToJSThread
               registerSegmentWithId:(void (^)(NSNumber *, NSString *))registerSegmentWithId
                             runtime:(void *)runtime
                       launchOptions:(nullable NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

- (NSMethodSignature *)methodSignatureForSelector:(SEL)sel;
- (void)forwardInvocation:(NSInvocation *)invocation;

- (void)logWarning:(NSString *)message cmd:(SEL)cmd;
- (void)logError:(NSString *)message cmd:(SEL)cmd;

/**
 * Methods required for RCTBridge class extensions
 */
- (id)moduleForClass:(Class)moduleClass;
- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad;

@end

NS_ASSUME_NONNULL_END
