/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>
#import <react/renderer/core/ReactPrimitives.h>
#import <react/runtime/JSRuntimeFactory.h>

#import "RCTInstance.h"

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;
@class RCTHost;
@class RCTModuleRegistry;
@class RCTBundleConfiguration;
@class RCTDevMenuConfiguration;

@protocol RCTTurboModuleManagerDelegate;

typedef NSURL *_Nullable (^RCTHostBundleURLProvider)(void);

// Runtime API

@protocol RCTHostDelegate <NSObject>

- (void)hostDidStart:(RCTHost *)host;

@optional
- (NSArray<NSString *> *)unstableModulesRequiringMainQueueSetup;

- (void)loadBundleAtURL:(NSURL *)sourceURL
             onProgress:(RCTSourceLoadProgressBlock)onProgress
             onComplete:(RCTSourceLoadBlock)loadCallback;

// TODO(T205780509): Remove this api in react native v0.78
// The bridgeless js error handling api will just call into exceptionsmanager directly
- (void)host:(RCTHost *)host
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
           originalMessage:(NSString *_Nullable)originalMessage
                      name:(NSString *_Nullable)name
            componentStack:(NSString *_Nullable)componentStack
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal
                 extraData:(NSDictionary<NSString *, id> *)extraData __attribute__((deprecated));

/**
 Delegate method invoked after the host has finished initializing the JavaScript runtime. At this stage,
 bindings for Turbo Modules and the NativeComponentRegistry are already installed,
 but the JavaScript bundle has not yet been executed. This method is called on the JavaScript thread;
 accessing the runtime from any other thread is prohibited and will result in crashes.
 */
- (void)host:(RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime;

@end

// `RCTHostRuntimeDelegate` has been merged into `RCTHostDelegate` in 0.84
[[deprecated("Use 'RCTHostDelegate' instead")]]
@protocol RCTHostRuntimeDelegate<NSObject>

- (void)host:(RCTHost *)host
    didInitializeRuntime:(facebook::jsi::Runtime &)runtime
    [[deprecated("Use an equivalent method from 'RCTHostDelegate' instead")]];

@end

typedef std::shared_ptr<facebook::react::JSRuntimeFactory> (^RCTHostJSEngineProvider)(void);

@interface RCTHost : NSObject

- (instancetype)initWithBundleURLProvider:(RCTHostBundleURLProvider)provider
                             hostDelegate:(id<RCTHostDelegate>)hostDelegate
               turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                         jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider
                            launchOptions:(nullable NSDictionary *)launchOptions
                      bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
                     devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithBundleURLProvider:(RCTHostBundleURLProvider)provider
                             hostDelegate:(id<RCTHostDelegate>)hostDelegate
               turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                         jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider
                            launchOptions:(nullable NSDictionary *)launchOptions;

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                     hostDelegate:(id<RCTHostDelegate>)hostDelegate
       turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                 jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider
                    launchOptions:(nullable NSDictionary *)launchOptions __deprecated;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

@property (nonatomic, weak, nullable) id<RCTHostRuntimeDelegate> runtimeDelegate
    [[deprecated("Use 'RCTHostDelegate' instead")]];

@property (nonatomic, readonly) RCTSurfacePresenter *surfacePresenter;

@property (nonatomic, readonly) RCTModuleRegistry *moduleRegistry;

- (void)start;

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args;

// Renderer API

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                             mode:(facebook::react::DisplayMode)displayMode
                                initialProperties:(NSDictionary *)properties;

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName initialProperties:(NSDictionary *)properties;

@end

NS_ASSUME_NONNULL_END
