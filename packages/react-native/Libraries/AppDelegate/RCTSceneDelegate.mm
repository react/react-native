/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSceneDelegate.h"

#import <React/RCTLinkingManager.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>

@implementation RCTSceneDelegate

- (instancetype)init
{
  if (self = [super init]) {
    _automaticallyLoadReactNativeWindow = YES;
  }
  return self;
}

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }

  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self];

  UIWindowScene *windowScene = (UIWindowScene *)scene;
  self.window = [[UIWindow alloc] initWithWindowScene:windowScene];

  if (self.automaticallyLoadReactNativeWindow) {
    [self loadReactNativeWindow:connectionOptions];
  }
}

- (void)loadReactNativeWindow:(UISceneConnectionOptions *)connectionOptions
{
  [self.reactNativeFactory startReactNativeWithModuleName:self.moduleName
                                                 inWindow:self.window
                                        initialProperties:self.initialProps
                                        connectionOptions:connectionOptions];
}

- (RCTRootViewFactory *)rootViewFactory
{
  return self.reactNativeFactory.rootViewFactory;
}

#pragma mark - Linking (SceneDelegate lifecycle)

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  [RCTLinkingManager scene:scene openURLContexts:URLContexts];
}

- (void)scene:(UIScene *)scene continueUserActivity:(NSUserActivity *)userActivity
{
  [RCTLinkingManager scene:scene continueUserActivity:userActivity];
}

@end
