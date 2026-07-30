/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import <React/RCTI18nUtil.h>
#import "RCTI18nManager.h"

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTI18nManager () <NativeI18nManagerSpec>
@end

@implementation RCTI18nManager

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)allowRTL:(BOOL)value
{
  [[RCTI18nUtil sharedInstance] allowRTL:value];
}

- (void)forceRTL:(BOOL)value
{
  [[RCTI18nUtil sharedInstance] forceRTL:value];
}

- (void)swapLeftAndRightInRTL:(BOOL)value
{
  [[RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL" : @([[RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL" : @([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeI18nManagerSpecJSI>(params);
}

@end

Class RCTI18nManagerCls(void)
{
  return RCTI18nManager.class;
}
