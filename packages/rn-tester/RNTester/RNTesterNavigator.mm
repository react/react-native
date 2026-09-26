/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNTesterTabBarController.h"

#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

/**
 * Lets JS push screens onto the native navigator, see js/utils/RNTesterNavigator.js.
 */
@interface RNTesterNavigator : NSObject <RCTBridgeModule>
@end

@implementation RNTesterNavigator

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_METHOD(push : (NSDictionary *)route)
{
  [[self tabBarController] pushRoute:route];
}

RCT_EXPORT_METHOD(pushFromDeepLink : (NSDictionary *)route)
{
  [[self tabBarController] pushRouteFromDeepLink:route];
}

- (RNTesterTabBarController *)tabBarController
{
  UIViewController *rootViewController = RCTKeyWindow().rootViewController;
  if (![rootViewController isKindOfClass:[RNTesterTabBarController class]]) {
    RCTLogError(@"RNTesterNavigator requires an RNTesterTabBarController as the root view controller");
    return nil;
  }
  return (RNTesterTabBarController *)rootViewController;
}

@end
