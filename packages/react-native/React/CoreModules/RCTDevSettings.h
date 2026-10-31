/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTBridgeProxy.h>
#import <React/RCTDefines.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTInitializing.h>

@class RCTPackagerClientResponder;
typedef uint32_t RCTHandlerToken;
typedef void (^RCTNotificationHandler)(NSDictionary<NSString *, id> *);
typedef void (^RCTRequestHandler)(NSDictionary<NSString *, id> *, RCTPackagerClientResponder *);
typedef void (^RCTConnectedHandler)(void);

@class RCTPackagerConnection;

@protocol RCTPackagerClientMethod;

/**
 * An abstraction for a key-value store to manage RCTDevSettings behavior.
 * The default implementation persists settings using NSUserDefaults.
 */
@protocol RCTDevSettingsDataSource <NSObject>

/**
 * Updates the setting with the given key to the given value.
 * How the data source's state changes depends on the implementation.
 */
- (void)updateSettingWithValue:(id)value forKey:(NSString *)key;

/**
 * Returns the value for the setting with the given key.
 */
- (id)settingForKey:(NSString *)key;

@end

@protocol RCTDevSettingsInspectable <NSObject>

/**
 * Whether current jsi::Runtime is inspectable.
 * Only set when using as a bridgeless turbo module.
 */
@property (nonatomic, assign, readwrite) BOOL isInspectable;

@end

@interface RCTDevSettings : RCTEventEmitter <RCTInitializing>

- (instancetype)initWithDataSource:(id<RCTDevSettingsDataSource>)dataSource;

@property (nonatomic, readonly) BOOL isHotLoadingAvailable;
@property (nonatomic, readonly) BOOL isDeviceDebuggingAvailable;

/*
 * Whether shaking will show RCTDevMenu. The menu is enabled by default if RCT_DEV=1, but
 * you may wish to disable it so that you can provide your own shake handler.
 */
@property (nonatomic, assign) BOOL isShakeToShowDevMenuEnabled;

/**
 * Whether performance profiling is enabled.
 */
@property (nonatomic, assign, setter=setProfilingEnabled:) BOOL isProfilingEnabled;

/**
 * Whether hot loading is enabled.
 */
@property (nonatomic, assign, setter=setHotLoadingEnabled:) BOOL isHotLoadingEnabled;

/**
 * Whether shake gesture is enabled.
 */
@property (nonatomic, assign) BOOL isShakeGestureEnabled;

/**
 * Enables starting of profiling sampler on launch
 */
@property (nonatomic, assign) BOOL startSamplingProfilerOnLaunch;

/**
 * Whether the element inspector is visible.
 */
@property (nonatomic, readonly) BOOL isElementInspectorShown;

/**
 * Whether the performance monitor is visible.
 */
@property (nonatomic, assign) BOOL isPerfMonitorShown;

#if RCT_DEV
@property (nonatomic, readonly) RCTPackagerConnection *packagerConnection;
#endif

/**
 * Toggle the element inspector.
 */
- (void)toggleElementInspector;

/**
 * Set up the HMRClient if loading the bundle from Metro.
 */
- (void)setupHMRClientWithBundleURL:(NSURL *)bundleURL;

/**
 * Register additional bundles with the HMRClient.
 */
- (void)setupHMRClientWithAdditionalBundleURL:(NSURL *)bundleURL;

#if RCT_DEV_MENU
- (void)addHandler:(id<RCTPackagerClientMethod>)handler
    forPackagerMethod:(NSString *)name __deprecated_msg("Use addRequestHandler or addNotificationHandler instead");
#endif

#if RCT_DEV
/**
 * Registers a handler for a notification broadcast from the packager. An
 * example is "reload" - an instruction to reload from the packager.
 * If multiple notification handlers are registered for the same method, they
 * will all be invoked sequentially.
 */
- (RCTHandlerToken)addNotificationHandler:(RCTNotificationHandler)handler
                                    queue:(dispatch_queue_t)queue
                                forMethod:(NSString *)method;

/**
 * Registers a handler for a request from the packager. An example is
 * pokeSamplingProfiler; it asks for profile data from the client.
 * Only one handler can be registered for a given method; calling this
 * displaces any previous request handler registered for that method.
 */
- (RCTHandlerToken)addRequestHandler:(RCTRequestHandler)handler
                               queue:(dispatch_queue_t)queue
                           forMethod:(NSString *)method;

#endif

@end

@interface RCTBridgeProxy (RCTDevSettings)

@property (nonatomic, readonly) RCTDevSettings *devSettings;

@end

// In debug builds, the dev menu is enabled by default but it is further customizable using this method.
// However, this method only has an effect in builds where the dev menu is actually compiled in.
// (i.e. RCT_DEV or RCT_DEV_MENU is set)
RCT_EXTERN void RCTDevSettingsSetEnabled(BOOL enabled);
