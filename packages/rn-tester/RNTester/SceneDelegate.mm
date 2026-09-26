/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "SceneDelegate.h"

#import "NativeExampleViews/FlexibleSizeExampleView.h"
#import "NativeExampleViews/UpdatePropertiesExampleView.h"
#import "RNTesterTabBarController.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTDefines.h>
#import <React/RCTLinkingManager.h>
#import <ReactCommon/RCTSampleTurboModule.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <NativeCxxModuleExample/NativeCxxModuleExample.h>
#ifndef RN_DISABLE_OSS_PLUGIN_HEADER
#import <RNTMyNativeViewComponentView.h>
#endif

#if __has_include(<ReactAppDependencyProvider/RCTAppDependencyProvider.h>)
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#endif

#if RCT_DEV_MENU
#import <React/RCTDevMenu.h>
#endif

static NSString *const kBundlePath = @"js/RNTesterApp.ios";

// Mirrors the conversion RCTReactNativeFactory applies when it creates the root view itself.
static NSDictionary *launchOptionsFromConnectionOptions(UISceneConnectionOptions *connectionOptions)
{
  NSMutableDictionary *launchOptions = [NSMutableDictionary dictionary];

  NSURL *url = connectionOptions.URLContexts.anyObject.URL;
  if (url != nil) {
    launchOptions[UIApplicationLaunchOptionsURLKey] = url;
  }

  NSUserActivity *activity = connectionOptions.userActivities.anyObject;
  if (activity != nil) {
    launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey] = @{
      UIApplicationLaunchOptionsUserActivityTypeKey : activity.activityType,
      @"UIApplicationLaunchOptionsUserActivityKey" : activity,
    };
  }

  return launchOptions;
}

@implementation SceneDelegate

- (NSDictionary *)prepareInitialProps
{
  NSMutableDictionary *initProps = [NSMutableDictionary dictionary];
  NSString *routeUri = [[NSUserDefaults standardUserDefaults] stringForKey:@"route"];
  if (routeUri != nil) {
    NSString *example = [NSString stringWithFormat:@"rntester://example/%@Example", routeUri];
    initProps[@"exampleFromAppetizeParams"] = example;
  }
  return [initProps copy];
}

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }

#if __has_include(<ReactAppDependencyProvider/RCTAppDependencyProvider.h>)
  self.dependencyProvider = [[RCTAppDependencyProvider alloc] init];
#endif

  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self releaseLevel:[self releaseLevel]];

#if RCT_DEV_MENU
  RCTDevMenuConfiguration *devMenuConfiguration = [[RCTDevMenuConfiguration alloc] initWithDevMenuEnabled:true
                                                                                      shakeGestureEnabled:true
                                                                                 keyboardShortcutsEnabled:true];
  [self.reactNativeFactory setDevMenuConfiguration:devMenuConfiguration];
#endif

  auto *windowScene = (UIWindowScene *)scene;
  self.window = [[UIWindow alloc] initWithWindowScene:windowScene];
  self.window.rootViewController = [[RNTesterTabBarController alloc]
      initWithReactNativeFactory:self.reactNativeFactory
               initialProperties:[self prepareInitialProps]
                   launchOptions:launchOptionsFromConnectionOptions(connectionOptions)];
  [self.window makeKeyAndVisible];
}

- (RCTReleaseLevel)releaseLevel
{
  return RCTReleaseLevel::Stable;
}

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  [RCTLinkingManager scene:scene openURLContexts:URLContexts];
}

- (void)scene:(UIScene *)scene continueUserActivity:(NSUserActivity *)userActivity
{
  [RCTLinkingManager scene:scene continueUserActivity:userActivity];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:kBundlePath];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (name == facebook::react::NativeCxxModuleExample::kModuleName) {
    return std::make_shared<facebook::react::NativeCxxModuleExample>(jsInvoker);
  }

  return [super getTurboModule:name jsInvoker:jsInvoker];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(__unused RCTBridge *)bridge
{
  return @[
    [[FlexibleSizeExampleViewManager alloc] initWithRootViewFactory:self.reactNativeFactory.rootViewFactory],
    [[UpdatePropertiesExampleViewManager alloc] initWithRootViewFactory:self.reactNativeFactory.rootViewFactory],
  ];
}

#ifndef RN_DISABLE_OSS_PLUGIN_HEADER
- (nonnull NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  NSMutableDictionary *dict = [super thirdPartyFabricComponents].mutableCopy;
  if (!dict[@"RNTMyNativeView"]) {
    dict[@"RNTMyNativeView"] = NSClassFromString(@"RNTMyNativeViewComponentView");
  }
  if (!dict[@"SampleNativeComponent"]) {
    dict[@"SampleNativeComponent"] = NSClassFromString(@"RCTSampleNativeComponentComponentView");
  }
  return dict;
}
#endif

@end
