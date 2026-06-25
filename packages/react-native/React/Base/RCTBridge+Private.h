/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>

@class RCTModuleRegistry;
@class RCTModuleData;
@protocol RCTJavaScriptExecutor;

RCT_EXTERN NSArray<Class> *RCTGetModuleClasses(void);
RCT_EXTERN void RCTRegisterModule(Class);

@interface RCTBridge ()

// Used for the profiler flow events between JS and native
@property (nonatomic, assign) int64_t flowID;
@property (nonatomic, assign) CFMutableDictionaryRef flowIDMap;
@property (nonatomic, strong) NSLock *flowIDMapLock;

// Used by RCTDevMenu
@property (nonatomic, copy) NSString *bridgeDescription;

+ (instancetype)currentBridge;
+ (void)setCurrentBridge:(RCTBridge *)bridge;

/**
 * Bridge setup code - creates an instance of RCTBachedBridge. Exposed for
 * test only
 */
- (void)setUp;

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
 * The block that creates the modules' instances to be added to the bridge.
 * Exposed for RCTCxxBridge
 */
@property (nonatomic, copy, readonly) RCTBridgeModuleListProvider moduleProvider;

/**
 * Used by RCTDevMenu to override the `hot` param of the current bundleURL.
 */
@property (nonatomic, strong, readwrite) NSURL *bundleURL;

/**
 * An object that allows one to require NativeModules/TurboModules.
 * RCTModuleRegistry is implemented in bridgeless mode and bridge mode.
 * Used by RCTRootView.
 */
@property (nonatomic, strong, readonly) RCTModuleRegistry *moduleRegistry;

@end

@interface RCTBridge (RCTCxxBridge)

/**
 * Used by RCTModuleData
 */

@property (nonatomic, weak, readonly) RCTBridge *parentBridge;

/**
 * Used by RCTModuleData
 */
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

/**
 * Called on the child bridge to run the executor and start loading.
 */
- (void)start;

/**
 * Used by RCTModuleData to register the module for frame updates after it is
 * lazily initialized.
 */
- (void)registerModuleForFrameUpdates:(id<RCTBridgeModule>)module withModuleData:(RCTModuleData *)moduleData;

/**
 * Dispatch work to a module's queue - this is also supports the fake RCTJSThread
 * queue. Exposed for the RCTProfiler
 */
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

/**
 * Get the module data for a given module name. Used by UIManager to implement
 * the `dispatchViewManagerCommand` method.
 */
- (RCTModuleData *)moduleDataForName:(NSString *)moduleName;

/**
 * Registers additional classes with the ModuleRegistry.
 */
- (void)registerAdditionalModuleClasses:(NSArray<Class> *)newModules;

/**
 * Updates the ModuleRegistry with a pre-initialized instance.
 */
- (void)updateModuleWithInstance:(id<RCTBridgeModule>)instance;

/**
 * Systrace profiler toggling methods exposed for the RCTDevMenu
 */
- (void)startProfiling;
- (void)stopProfiling:(void (^)(NSData *))callback;

/**
 * Synchronously call a specific native module's method and return the result
 */
- (id)callNativeModule:(NSUInteger)moduleID method:(NSUInteger)methodID params:(NSArray *)params;

/**
 * Hook exposed for RCTLog to send logs to JavaScript when not running in JSC
 */
- (void)logMessage:(NSString *)message level:(NSString *)level;

/**
 * Allow super fast, one time, timers to skip the queue and be directly executed
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer;

@end
