/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "SceneDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTDefines.h>
#import <ReactCommon/RCTSampleTurboModule.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <NativeCxxModuleExample/NativeCxxModuleExample.h>
#ifndef RN_DISABLE_OSS_PLUGIN_HEADER
#import <RNTMyNativeViewComponentView.h>
#endif

#if __has_include(<ReactAppDependencyProvider/RCTAppDependencyProvider.h>)
#define USE_OSS_CODEGEN 1
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#else
#define USE_OSS_CODEGEN 0
#endif

#if RCT_DEV_MENU
#import <React/RCTDevMenu.h>
#endif

static NSString *kBundlePath = @"js/RNTesterApp.ios";

@implementation SceneDelegate

- (NSDictionary *)prepareInitialProps
{
  NSMutableDictionary *initProps = [NSMutableDictionary dictionary];
  NSString *routeUri = [[NSUserDefaults standardUserDefaults] stringForKey:@"route"];
  if (routeUri) {
    NSString *example = [NSString stringWithFormat:@"rntester://example/%@Example", routeUri];
    initProps[@"exampleFromAppetizeParams"] = example;
  }
  return [initProps copy];
}

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  self.moduleName = @"RNTesterApp";
  self.initialProps = [self prepareInitialProps];
#if USE_OSS_CODEGEN
  self.dependencyProvider = [[RCTAppDependencyProvider alloc] init];
#endif

  [super scene:scene willConnectToSession:session options:connectionOptions];

#if RCT_DEV_MENU
  RCTDevMenuConfiguration *devMenuConfiguration = [[RCTDevMenuConfiguration alloc] initWithDevMenuEnabled:true
                                                                                      shakeGestureEnabled:true
                                                                                 keyboardShortcutsEnabled:true];
  [self.reactNativeFactory setDevMenuConfiguration:devMenuConfiguration];
#endif
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
