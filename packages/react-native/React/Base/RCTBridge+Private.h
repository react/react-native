/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>

@class RCTModuleRegistry;

#if !defined(RCT_REMOVE_LEGACY_MODULE_INTEROP) || !defined(RCT_REMOVE_LEGACY_COMPONENT_INTEROP)
RCT_EXTERN NSArray<Class> *RCTGetModuleClasses(void);
RCT_EXTERN void RCTRegisterModule(Class);
#endif // !defined(RCT_REMOVE_LEGACY_MODULE_INTEROP) || !defined(RCT_REMOVE_LEGACY_COMPONENT_INTEROP)

@interface RCTBridge ()

+ (instancetype)currentBridge __deprecated_msg("This API will be removed along with the legacy architecture.");
+ (void)setCurrentBridge:(RCTBridge *)bridge
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * This method is used to invoke a callback that was registered in the
 * JavaScript application context. Safe to call from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args;

/**
 * This property is mostly used on the main thread, but may be touched from
 * a background thread if the RCTBridge happens to deallocate on a background
 * thread. Therefore, we want all writes to it to be seen atomically.
 */
@property (atomic, strong) RCTBridge *batchedBridge;

/**
 * An object that allows one to require NativeModules/TurboModules.
 * RCTModuleRegistry is implemented in bridgeless mode and bridge mode.
 */
@property (nonatomic, strong, readonly) RCTModuleRegistry *moduleRegistry __deprecated_msg(
    "Access RCTModuleRegistry directly instead; this property will be removed.");

@end

@interface RCTBridge (RCTCxxBridge)

/**
 * Dispatch work to a module's queue - this is also supports the fake RCTJSThread
 * queue. Exposed for the RCTProfiler
 */
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

/**
 * Registers additional classes with the ModuleRegistry.
 */
- (void)registerAdditionalModuleClasses:(NSArray<Class> *)newModules;

@end
