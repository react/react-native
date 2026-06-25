/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootViewFactory.h"
#import <React/RCTDevMenu.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import "RCTAppDelegate.h"
#import "RCTAppSetupUtils.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <ReactCommon/RCTHost+Internal.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <react/runtime/JSRuntimeFactory.h>
#import <react/runtime/JSRuntimeFactoryCAPI.h>

@implementation RCTRootViewFactoryConfiguration

- (instancetype)initWithBundleURL:(NSURL *)bundleURL newArchEnabled:(BOOL)newArchEnabled
{
  return [self initWithBundleURL:bundleURL];
}

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock newArchEnabled:(BOOL)newArchEnabled
{
  return [self initWithBundleURLBlock:bundleURLBlock];
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   newArchEnabled:(BOOL)newArchEnabled
               turboModuleEnabled:(BOOL)turboModuleEnabled
                bridgelessEnabled:(BOOL)bridgelessEnabled
{
  return [self initWithBundleURLBlock:^{
    return bundleURL;
  }];
}

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock
                        newArchEnabled:(BOOL)newArchEnabled
                    turboModuleEnabled:(BOOL)turboModuleEnabled
                     bridgelessEnabled:(BOOL)bridgelessEnabled
{
  if (self = [super init]) {
    _bundleURLBlock = bundleURLBlock;
    _fabricEnabled = YES;
    _turboModuleEnabled = YES;
    _bridgelessEnabled = YES;
  }
  return self;
}

- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock
{
  if (self = [super init]) {
    _bundleURLBlock = bundleURLBlock;
    _fabricEnabled = YES;
    _turboModuleEnabled = YES;
    _bridgelessEnabled = YES;
  }
  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
{
  return [self initWithBundleURLBlock:^{
    return bundleURL;
  }];
}

@end

@interface RCTRootViewFactory () {
  std::shared_ptr<const facebook::react::ContextContainer> _contextContainer;
  std::shared_ptr<facebook::react::RuntimeScheduler> _runtimeScheduler;
}
@end

@implementation RCTRootViewFactory {
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
  __weak id<RCTHostDelegate> _hostDelegate;
  RCTRootViewFactoryConfiguration *_configuration;
}

- (instancetype)initWithTurboModuleDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                               hostDelegate:(id<RCTHostDelegate>)hostDelegate
                              configuration:(RCTRootViewFactoryConfiguration *)configuration
{
  if (self = [super init]) {
    _configuration = configuration;
    _hostDelegate = hostDelegate;
    _contextContainer = std::make_shared<const facebook::react::ContextContainer>();
    _turboModuleManagerDelegate = turboModuleManagerDelegate;
  }
  return self;
}

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration
        andTurboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
{
  id<RCTHostDelegate> hostDelegate = [turboModuleManagerDelegate conformsToProtocol:@protocol(RCTHostDelegate)]
      ? (id<RCTHostDelegate>)turboModuleManagerDelegate
      : nil;
  return [self initWithTurboModuleDelegate:turboModuleManagerDelegate
                              hostDelegate:hostDelegate
                             configuration:configuration];
}

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration
{
  return [self initWithConfiguration:configuration andTurboModuleManagerDelegate:nil];
}

- (UIView *)viewWithModuleName:(NSString *)moduleName initialProperties:(NSDictionary *)initialProperties
{
  return [self viewWithModuleName:moduleName
                initialProperties:initialProperties
                    launchOptions:nil
              bundleConfiguration:[RCTBundleConfiguration defaultConfiguration]
             devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
{
  return [self viewWithModuleName:moduleName
                initialProperties:nil
                    launchOptions:nil
              bundleConfiguration:[RCTBundleConfiguration defaultConfiguration]
             devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (void)initializeReactHostWithLaunchOptions:(NSDictionary *)launchOptions
                         bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
                        devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  // Enable TurboModule interop by default in Bridgeless mode
#ifndef RCT_REMOVE_LEGACY_MODULE_INTEROP
  RCTEnableTurboModuleInterop(YES);
#endif // RCT_REMOVE_LEGACY_MODULE_INTEROP

  [self createReactHostIfNeeded:launchOptions
            bundleConfiguration:bundleConfiguration
           devMenuConfiguration:devMenuConfiguration];
  return;
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
                 launchOptions:(NSDictionary *)launchOptions
{
  return [self viewWithModuleName:moduleName
                initialProperties:initialProperties
                    launchOptions:launchOptions
              bundleConfiguration:[RCTBundleConfiguration defaultConfiguration]
             devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initProps
                 launchOptions:(NSDictionary *)launchOptions
           bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
          devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  [self initializeReactHostWithLaunchOptions:launchOptions
                         bundleConfiguration:bundleConfiguration
                        devMenuConfiguration:devMenuConfiguration];

  RCTFabricSurface *surface = [self.reactHost createSurfaceWithModuleName:moduleName
                                                        initialProperties:initProps ? initProps : @{}];

  RCTSurfaceHostingProxyRootView *surfaceHostingProxyRootView =
      [[RCTSurfaceHostingProxyRootView alloc] initWithSurface:surface];

#if TARGET_OS_TV
  surfaceHostingProxyRootView.backgroundColor = [UIColor clearColor];
#else
  surfaceHostingProxyRootView.backgroundColor = [UIColor systemBackgroundColor];
#endif
  if (_configuration.customizeRootView != nil) {
    _configuration.customizeRootView(surfaceHostingProxyRootView);
  }
  return surfaceHostingProxyRootView;
}

#pragma mark - New Arch Utilities

- (void)createReactHostIfNeeded:(NSDictionary *)launchOptions
            bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
           devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self.reactHost) {
    return;
  }

  self.reactHost = [self createReactHost:launchOptions
                     bundleConfiguration:bundleConfiguration
                    devMenuConfiguration:devMenuConfiguration];
}

- (RCTHost *)createReactHost:(NSDictionary *)launchOptions
{
  return [self createReactHost:launchOptions
           bundleConfiguration:[RCTBundleConfiguration defaultConfiguration]
          devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (RCTHost *)createReactHost:(NSDictionary *)launchOptions
         bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
        devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  __weak __typeof(self) weakSelf = self;
  RCTHost *reactHost =
      [[RCTHost alloc] initWithBundleURLProvider:self->_configuration.bundleURLBlock
                                    hostDelegate:_hostDelegate
                      turboModuleManagerDelegate:_turboModuleManagerDelegate
                                jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                  return [weakSelf createJSRuntimeFactory];
                                }
                                   launchOptions:launchOptions
                             bundleConfiguration:bundleConfiguration
                            devMenuConfiguration:devMenuConfiguration];
  [reactHost setBundleURLProvider:^NSURL *() {
    return [weakSelf bundleURL];
  }];
  [reactHost start];
  return reactHost;
}

- (std::shared_ptr<facebook::react::JSRuntimeFactory>)createJSRuntimeFactory
{
  if (_configuration.jsRuntimeConfiguratorDelegate == nil) {
    [NSException raise:@"RCTReactNativeFactoryDelegate::createJSRuntimeFactory not implemented"
                format:@"Delegate must implement a valid createJSRuntimeFactory method"];
    return nullptr;
  }

  auto jsRuntimeFactory = [_configuration.jsRuntimeConfiguratorDelegate createJSRuntimeFactory];

  return std::shared_ptr<facebook::react::JSRuntimeFactory>(
      reinterpret_cast<facebook::react::JSRuntimeFactory *>(jsRuntimeFactory), &js_runtime_factory_destroy);
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  if (_configuration.extraModulesForBridge != nil) {
    return _configuration.extraModulesForBridge(bridge);
  }
  return nil;
}

- (NSURL *)bundleURL
{
  return self->_configuration.bundleURLBlock();
}

@end
