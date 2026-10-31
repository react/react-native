/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridgeDelegate.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeModuleDecorator.h>
#import <React/RCTDefines.h>
#import <React/RCTFrameUpdate.h>
#import <React/RCTInvalidating.h>

#import "RCTBridgeConstants.h"
#import "RCTConstants.h"

@class JSValue;
@class RCTBridge;
@class RCTPerformanceLogger;

/**
 * This block can be used to instantiate modules that require additional
 * init parameters, or additional configuration prior to being used.
 * The bridge will call this block to instantiate the modules, and will
 * be responsible for invalidating/releasing them when the bridge is destroyed.
 * For this reason, the block should always return new module instances, and
 * module instances should not be shared between bridges.
 */
typedef NSArray<id<RCTBridgeModule>> * (^RCTBridgeModuleListProvider)(void);

RCT_EXTERN_C_BEGIN

/**
 * This function returns the module name for a given class.
 */
NSString *RCTBridgeModuleNameForClass(Class bridgeModuleClass);

/**
 * This function returns the list of modules that have been registered using the Old Architecture mechanism.
 */
NSMutableArray<NSString *> *getModulesLoadedWithOldArch(void)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

#ifndef RCT_REMOVE_LEGACY_MODULE_INTEROP
// Turn on TurboModule interop
BOOL RCTTurboModuleInteropEnabled(void);
void RCTEnableTurboModuleInterop(BOOL enabled);
#endif // RCT_REMOVE_LEGACY_MODULE_INTEROP

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP
// Turn on the fabric interop layer
BOOL RCTFabricInteropLayerEnabled(void);
void RCTEnableFabricInteropLayer(BOOL enabled);
#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP

typedef enum {
  kRCTBridgeProxyLoggingLevelNone,
  kRCTBridgeProxyLoggingLevelWarning,
  kRCTBridgeProxyLoggingLevelError,
} RCTBridgeProxyLoggingLevel;

RCTBridgeProxyLoggingLevel RCTTurboModuleInteropBridgeProxyLogLevel(void);
void RCTSetTurboModuleInteropBridgeProxyLogLevel(RCTBridgeProxyLoggingLevel logLevel);

// Route all TurboModules through TurboModule interop
BOOL RCTTurboModuleInteropForAllTurboModulesEnabled(void);
void RCTEnableTurboModuleInteropForAllTurboModules(BOOL enabled);

typedef enum {
  kRCTGlobalScope,
  kRCTGlobalScopeUsingRetainJSCallback,
  kRCTTurboModuleManagerScope,
} RCTTurboModuleCleanupMode;

RCTTurboModuleCleanupMode RCTGetTurboModuleCleanupMode(void);
void RCTSetTurboModuleCleanupMode(RCTTurboModuleCleanupMode mode);

RCT_EXTERN_C_END

/**
 * Async batched bridge used to communicate with the JavaScript application.
 */
@interface RCTBridge : NSObject <RCTInvalidating>

/**
 * This method registers the file path of an additional JS segment by its ID.
 *
 * @experimental
 */
- (void)registerSegmentWithId:(NSUInteger)segmentId
                         path:(NSString *)path
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Retrieve a bridge module instance by name or class. Note that modules are
 * lazily instantiated, so calling these methods for the first time with a given
 * module name/class may cause the class to be synchronously instantiated,
 * potentially blocking both the calling thread and main thread for a short time.
 *
 * Note: This method does NOT lazily load the particular module if it's not yet loaded.
 */
- (id)moduleForName:(NSString *)moduleName;
- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad;
// Note: This method lazily load the module as necessary.
- (id)moduleForClass:(Class)moduleClass;

/**
 * When a NativeModule performs a lookup for a TurboModule, we need to query
 * the TurboModuleRegistry.
 */
- (void)setRCTTurboModuleRegistry:(id<RCTTurboModuleRegistry>)turboModuleRegistry
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * This hook is called by the TurboModule infra with every ObjC module that's created.
 * It allows the bridge to attach properties to ObjC modules that give those modules
 * access to Bridge APIs.
 */
- (RCTBridgeModuleDecorator *)
    bridgeModuleDecorator __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * URL of the script that was loaded into the bridge.
 */
@property (nonatomic, strong, readonly)
    NSURL *bundleURL __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * The class of the executor currently being used. Changes to this value will
 * take effect after the bridge is reloaded.
 */
@property (nonatomic, strong)
    Class executorClass __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * The launch options that were used to initialize the bridge.
 */
@property (nonatomic, copy, readonly)
    NSDictionary *launchOptions __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Use this to check if the bridge is currently loading.
 */
@property (nonatomic, readonly, getter=isLoading)
    BOOL loading __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Use this to check if the bridge has been invalidated.
 */
@property (nonatomic, readonly, getter=isValid)
    BOOL valid __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Link to the Performance Logger that logs React Native perf events.
 */
@property (nonatomic, readonly, strong) RCTPerformanceLogger *performanceLogger __deprecated_msg(
    "This API will be removed along with the legacy architecture.");

/**
 * Handle notifications for a fast refresh. Safe to call from any thread.
 */
- (void)onFastRefresh __deprecated_msg("This API will be removed along with the legacy architecture.");

@end
