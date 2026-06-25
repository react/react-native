/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>

@class RCTDevMenuConfiguration;

@interface RCTDevMenuConfigurationDecorator : NSObject

#if RCT_DEV_MENU

@property (nonatomic, strong, readonly) RCTDevMenuConfiguration *__nullable devMenuConfiguration;

- (instancetype _Nonnull)initWithDevMenuConfiguration:(RCTDevMenuConfiguration *__nullable)devMenuConfiguration;
- (void)decorate:(id<RCTBridgeModule> _Nonnull)devMenuModule;

#endif

@end
