/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>
#import <React/RCTJavaScriptLoader.h>
#import <jsinspector-modern/ReactCdp.h>
#import <react/runtime/JSRuntimeFactory.h>

#import "RCTContextContainerHandling.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * A utility to enable diagnostics mode at runtime. Useful for test runs.
 * The flags are comma-separated string tokens, or an empty string when
 * nothing is enabled.
 */
RCT_EXTERN NSString *RCTInstanceRuntimeDiagnosticFlags(void);
RCT_EXTERN void RCTInstanceSetRuntimeDiagnosticFlags(NSString *_Nullable flags);

@class RCTBundleManager;
@class RCTInstance;
@class RCTJSThreadManager;
@class RCTModuleRegistry;
@class RCTPerformanceLogger;
@class RCTSource;
@class RCTSurfacePresenter;
@class RCTDevMenuConfiguration;

@protocol RCTTurboModuleManagerDelegate;

@protocol RCTInstanceDelegate <RCTContextContainerHandling>

- (void)instance:(RCTInstance *)instance didInitializeRuntime:(facebook::jsi::Runtime &)runtime;

- (void)loadBundleAtURL:(NSURL *)sourceURL
             onProgress:(RCTSourceLoadProgressBlock)onProgress
             onComplete:(RCTSourceLoadBlock)loadCallback;

- (NSArray<NSString *> *)unstableModulesRequiringMainQueueSetup;

// TODO(T205780509): Remove this api in react native v0.78
// The bridgeless js error handling api will just call into exceptionsmanager directly
- (BOOL)instance:(RCTInstance *)instance
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
           originalMessage:(NSString *_Nullable)originalMessage
                      name:(NSString *_Nullable)name
            componentStack:(NSString *_Nullable)componentStack
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal
                 extraData:(NSDictionary<NSString *, id> *)extraData __attribute__((deprecated));
@end

/**
 * RCTInstance owns and manages most of the pieces of infrastructure required to display a screen powered by React
 * Native. RCTInstance should never be instantiated in product code, but rather accessed through RCTHost. The host
 * ensures that any access to the instance is safe, and manages instance lifecycle.
 */
@interface RCTInstance : NSObject

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsRuntimeFactory:(std::shared_ptr<facebook::react::JSRuntimeFactory>)jsRuntimeFactory
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry
           parentInspectorTarget:(facebook::react::jsinspector_modern::HostTarget *)parentInspectorTarget
                   launchOptions:(nullable NSDictionary *)launchOptions;

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsRuntimeFactory:(std::shared_ptr<facebook::react::JSRuntimeFactory>)jsRuntimeFactory
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry
           parentInspectorTarget:(facebook::react::jsinspector_modern::HostTarget *)parentInspectorTarget
                   launchOptions:(nullable NSDictionary *)launchOptions
            devMenuConfiguration:(RCTDevMenuConfiguration *__nullable)devMenuConfiguration;

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args;
- (void)callFunctionOnBufferedRuntimeExecutor:(std::function<void(facebook::jsi::Runtime &runtime)> &&)executor;

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path;

- (void)invalidate;

@property (nonatomic, readonly, strong) RCTSurfacePresenter *surfacePresenter;

@end

NS_ASSUME_NONNULL_END
