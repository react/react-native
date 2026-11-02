/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootView.h"

NSString *const RCTContentDidAppearNotification = @"RCTContentDidAppearNotification";

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

@implementation RCTRootView
- (nonnull instancetype)initWithFrame:(CGRect)frame
                               bridge:(nonnull RCTBridge *)bridge
                           moduleName:(nonnull NSString *)moduleName
                    initialProperties:(nullable NSDictionary *)initialProperties
{
  return self;
}

- (nonnull instancetype)initWithBridge:(nonnull RCTBridge *)bridge
                            moduleName:(nonnull NSString *)moduleName
                     initialProperties:(nullable NSDictionary *)initialProperties
{
  return self;
}

- (nonnull instancetype)initWithBundleURL:(nonnull NSURL *)bundleURL
                               moduleName:(nonnull NSString *)moduleName
                        initialProperties:(nullable NSDictionary *)initialProperties
                            launchOptions:(nullable NSDictionary *)launchOptions
{
  return self;
}

@end

#pragma clang diagnostic pop
