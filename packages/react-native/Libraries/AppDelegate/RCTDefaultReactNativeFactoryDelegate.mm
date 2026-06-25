/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDefaultReactNativeFactoryDelegate.h"
#import <ReactCommon/RCTHost.h>
#import "RCTAppSetupUtils.h"
#import "RCTDependencyProvider.h"
#if USE_THIRD_PARTY_JSC != 1
#import <React/RCTHermesInstanceFactory.h>
#endif

#import <RCTAnimatedModuleProvider/RCTAnimatedModuleProvider.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/nativemodule/defaults/DefaultTurboModules.h>

@implementation RCTDefaultReactNativeFactoryDelegate {
  // C++ Native Animated provider, created once on first use (getTurboModule: may be called
  // concurrently for different module names).
  RCTAnimatedModuleProvider *_animatedModuleProvider;
  dispatch_once_t _animatedModuleProviderToken;
}

@synthesize dependencyProvider;

- (NSURL *_Nullable)sourceURLForBridge:(nonnull RCTBridge *)bridge
{
  [NSException raise:@"RCTBridgeDelegate::sourceURLForBridge not implemented"
              format:@"Subclasses must implement a valid sourceURLForBridge method"];
  return nil;
}

- (UIViewController *)createRootViewController
{
  return [UIViewController new];
}

- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController
{
  rootViewController.view = rootView;
}

- (JSRuntimeFactoryRef)createJSRuntimeFactory
{
#if USE_THIRD_PARTY_JSC != 1
  return jsrt_create_hermes_factory();
#else
  [NSException raise:@"JSRuntimeFactory"
              format:@"createJSRuntimeFactory must be overridden when using third-party JSC"];
  return nil;
#endif
}

- (void)customizeRootView:(RCTRootView *)rootView
{
  // Override point for customization after application launch.
}

- (RCTColorSpace)defaultColorSpace
{
  return RCTColorSpaceSRGB;
}

- (NSURL *_Nullable)bundleURL
{
  [NSException raise:@"RCTAppDelegate::bundleURL not implemented"
              format:@"Subclasses must implement a valid getBundleURL method"];
  return nullptr;
}

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  return (self.dependencyProvider != nullptr) ? self.dependencyProvider.thirdPartyFabricComponents : @{};
}

- (void)hostDidStart:(RCTHost *)host
{
}

- (NSArray<NSString *> *)unstableModulesRequiringMainQueueSetup
{
  return (self.dependencyProvider != nullptr)
      ? RCTAppSetupUnstableModulesRequiringMainQueueSetup(self.dependencyProvider)
      : @[];
}

- (nullable id<RCTModuleProvider>)getModuleProvider:(const char *)name
{
  NSString *providerName = [NSString stringWithCString:name encoding:NSUTF8StringEncoding];
  return (self.dependencyProvider != nullptr) ? self.dependencyProvider.moduleProviders[providerName] : nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  // The dedicated provider supplies the platform-driven C++ Animated module only when the shared
  // animated backend is off; with it on, DefaultTurboModules serves AnimatedModule instead.
  if (!facebook::react::ReactNativeFeatureFlags::useSharedAnimatedBackend()) {
    dispatch_once(&_animatedModuleProviderToken, ^{
      _animatedModuleProvider = [RCTAnimatedModuleProvider new];
    });
    if (auto animatedModule = [_animatedModuleProvider getTurboModule:name jsInvoker:jsInvoker]) {
      return animatedModule;
    }
  }
  return facebook::react::DefaultTurboModules::getTurboModule(name, jsInvoker);
}

#pragma mark - RCTArchConfiguratorProtocol

- (BOOL)newArchEnabled
{
  return YES;
}

- (BOOL)bridgelessEnabled
{
  return YES;
}

- (BOOL)fabricEnabled
{
  return YES;
}

- (BOOL)turboModuleEnabled
{
  return YES;
}

- (Class)getModuleClassFromName:(const char *)name
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return nullptr;
}

- (void)loadSourceForBridge:(RCTBridge *)bridge
                 onProgress:(RCTSourceLoadProgressBlock)onProgress
                 onComplete:(RCTSourceLoadBlock)loadCallback
{
  [RCTJavaScriptLoader loadBundleAtURL:[self sourceURLForBridge:bridge] onProgress:onProgress onComplete:loadCallback];
}

@end
