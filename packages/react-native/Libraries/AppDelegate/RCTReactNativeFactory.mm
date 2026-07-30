/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTReactNativeFactory.h"
#import <React/RCTBundleManager.h>
#import <React/RCTColorSpaceUtils.h>
#import <React/RCTDevMenu.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTHost.h>
#import <objc/runtime.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsOverridesOSSCanary.h>
#import <react/featureflags/ReactNativeFeatureFlagsOverridesOSSExperimental.h>
#import <react/featureflags/ReactNativeFeatureFlagsOverridesOSSStable.h>
#import <react/renderer/graphics/ColorComponents.h>
#import "RCTAppSetupUtils.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#import <react/nativemodule/defaults/DefaultTurboModules.h>

#import "RCTDependencyProvider.h"

using namespace facebook::react;

@interface RCTReactNativeFactory () <
    RCTComponentViewFactoryComponentProvider,
    RCTHostDelegate,
    RCTJSRuntimeConfiguratorProtocol,
    RCTTurboModuleManagerDelegate>
@end

@implementation RCTReactNativeFactory

@synthesize bundleConfiguration = _bundleConfiguration;

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate
{
  return [self initWithDelegate:delegate releaseLevel:Stable];
}

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate releaseLevel:(RCTReleaseLevel)releaseLevel
{
  if (self = [super init]) {
    self.delegate = delegate;
    [self _setUpFeatureFlags:releaseLevel];

    [RCTColorSpaceUtils applyDefaultColorSpace:[self defaultColorSpace]];

    self.rootViewFactory = [self createRCTRootViewFactory];

    [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider = self;
  }

  return self;
}

- (void)startReactNativeWithModuleName:(NSString *)moduleName inWindow:(UIWindow *_Nullable)window
{
  [self startReactNativeWithModuleName:moduleName inWindow:window initialProperties:nil launchOptions:nil];
}

- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                         launchOptions:(NSDictionary *_Nullable)launchOptions
{
  [self startReactNativeWithModuleName:moduleName inWindow:window initialProperties:nil launchOptions:launchOptions];
}

- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                     initialProperties:(NSDictionary *_Nullable)initialProperties
                         launchOptions:(NSDictionary *_Nullable)launchOptions
{
  UIView *rootView = [self.rootViewFactory viewWithModuleName:moduleName
                                            initialProperties:initialProperties
                                                launchOptions:launchOptions
                                          bundleConfiguration:self.bundleConfiguration
                                         devMenuConfiguration:self.devMenuConfiguration];
  UIViewController *rootViewController = [_delegate createRootViewController];
  [_delegate setRootView:rootView toRootViewController:rootViewController];
  window.rootViewController = rootViewController;
  [window makeKeyAndVisible];
}

#pragma mark - RCTUIConfiguratorProtocol

- (RCTColorSpace)defaultColorSpace
{
  if ([_delegate respondsToSelector:@selector(defaultColorSpace)]) {
    return [_delegate defaultColorSpace];
  }

  return RCTColorSpaceSRGB;
}

- (NSURL *_Nullable)bundleURL
{
  if (![_delegate respondsToSelector:@selector(bundleURL)]) {
    [NSException raise:@"RCTReactNativeFactoryDelegate::bundleURL not implemented"
                format:@"Delegate must implement a valid getBundleURL method"];
  }

  return _delegate.bundleURL;
}

- (RCTBundleConfiguration *)bundleConfiguration
{
  if (_bundleConfiguration == nullptr) {
    _bundleConfiguration = [RCTBundleConfiguration defaultConfiguration];
  }
  return _bundleConfiguration;
}

#pragma mark - RCTJSRuntimeConfiguratorProtocol

- (JSRuntimeFactoryRef)createJSRuntimeFactory
{
  return [_delegate createJSRuntimeFactory];
}

#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
#if RN_DISABLE_OSS_PLUGIN_HEADER
  return RCTTurboModulePluginClassProvider(name);
#else
  if ([_delegate respondsToSelector:@selector(getModuleClassFromName:)]) {
    Class moduleClass = [_delegate getModuleClassFromName:name];
    if (moduleClass != nil) {
      return moduleClass;
    }
  }
  return RCTCoreModulesClassProvider(name);
#endif
}

- (nullable id<RCTModuleProvider>)getModuleProvider:(const char *)name
{
  if ([_delegate respondsToSelector:@selector(getModuleProvider:)]) {
    return [_delegate getModuleProvider:name];
  }
  return nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if ([_delegate respondsToSelector:@selector(getTurboModule:jsInvoker:)]) {
    return [_delegate getTurboModule:name jsInvoker:jsInvoker];
  }

  return facebook::react::DefaultTurboModules::getTurboModule(name, jsInvoker);
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
#if USE_OSS_CODEGEN
  if (self.delegate.dependencyProvider == nil) {
    [NSException raise:@"ReactNativeFactoryDelegate dependencyProvider is nil"
                format:@"Delegate must provide a valid dependencyProvider"];
  }
#endif
  if ([_delegate respondsToSelector:@selector(getModuleInstanceFromClass:)]) {
    id<RCTTurboModule> moduleInstance = [_delegate getModuleInstanceFromClass:moduleClass];
    if (moduleInstance != nil) {
      return moduleInstance;
    }
  }
  return RCTAppSetupDefaultModuleFromClass(moduleClass, self.delegate.dependencyProvider);
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  if ([_delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    return [_delegate extraModulesForBridge:bridge];
  }

  return @[];
}

#pragma mark - RCTComponentViewFactoryComponentProvider

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  if ([_delegate respondsToSelector:@selector(thirdPartyFabricComponents)]) {
    return _delegate.thirdPartyFabricComponents;
  }

  return self.delegate.dependencyProvider ? self.delegate.dependencyProvider.thirdPartyFabricComponents : @{};
}

#pragma mark - RCTHostDelegate

- (void)hostDidStart:(RCTHost *)host
{
  if ([_delegate respondsToSelector:@selector(hostDidStart:)]) {
    [_delegate hostDidStart:host];
  }
}

- (void)host:(RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  if ([_delegate respondsToSelector:@selector(host:didInitializeRuntime:)]) {
    [_delegate host:host didInitializeRuntime:runtime];
  }
}

- (NSArray<NSString *> *)unstableModulesRequiringMainQueueSetup
{
#if RN_DISABLE_OSS_PLUGIN_HEADER
  return RCTTurboModulePluginUnstableModulesRequiringMainQueueSetup();
#else
  return self.delegate.dependencyProvider
      ? RCTAppSetupUnstableModulesRequiringMainQueueSetup(self.delegate.dependencyProvider)
      : @[];
#endif
}

- (RCTRootViewFactory *)createRCTRootViewFactory
{
  __weak __typeof(self) weakSelf = self;
  RCTBundleURLBlock bundleUrlBlock = ^{
    auto *strongSelf = weakSelf;
    return strongSelf.bundleURL;
  };

  RCTRootViewFactoryConfiguration *configuration =
      [[RCTRootViewFactoryConfiguration alloc] initWithBundleURLBlock:bundleUrlBlock
                                                       newArchEnabled:YES
                                                   turboModuleEnabled:YES
                                                    bridgelessEnabled:YES];

  configuration.customizeRootView = ^(UIView *_Nonnull rootView) {
    [weakSelf.delegate customizeRootView:(RCTRootView *)rootView];
  };

  configuration.sourceURLForBridge = ^NSURL *_Nullable(RCTBridge *_Nonnull bridge)
  {
    return [weakSelf.delegate bundleURL];
  };

  if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    configuration.extraModulesForBridge = ^NSArray<id<RCTBridgeModule>> *_Nonnull(RCTBridge *_Nonnull bridge)
    {
      return [weakSelf.delegate extraModulesForBridge:bridge];
    };
  }

  configuration.jsRuntimeConfiguratorDelegate = self;

  return [[RCTRootViewFactory alloc] initWithTurboModuleDelegate:self hostDelegate:self configuration:configuration];
}

#pragma mark - Feature Flags

- (void)_setUpFeatureFlags:(RCTReleaseLevel)releaseLevel
{
  static BOOL initialized = NO;
  static RCTReleaseLevel chosenReleaseLevel;
  NSLog(@"_setUpFeatureFlags called with release level %li", releaseLevel);
  if (!initialized) {
    chosenReleaseLevel = releaseLevel;
    initialized = YES;
  } else if (chosenReleaseLevel != releaseLevel) {
    [NSException
         raise:@"RCTReactNativeFactory::_setUpFeatureFlags releaseLevel mismatch between React Native instances"
        format:@"The releaseLevel (%li) of the new instance does not match the previous instance's releaseLevel (%li)",
               releaseLevel,
               chosenReleaseLevel];
  }

  static dispatch_once_t setupFeatureFlagsToken;
  dispatch_once(&setupFeatureFlagsToken, ^{
    switch (releaseLevel) {
      case Canary:
        ReactNativeFeatureFlags::override(std::make_unique<ReactNativeFeatureFlagsOverridesOSSCanary>());
        break;
      case Experimental:
        ReactNativeFeatureFlags::override(std::make_unique<ReactNativeFeatureFlagsOverridesOSSExperimental>());
        break;
      case Stable:
      default:
        ReactNativeFeatureFlags::override(std::make_unique<ReactNativeFeatureFlagsOverridesOSSStable>());
        break;
    }
  });
}

@end
