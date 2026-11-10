/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>

#import <React/RCTI18nUtil.h>
#import <React/RCTSurfacePresenterStub.h>
#import "RCTI18nManager.h"

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTI18nManager () <NativeI18nManagerSpec>
@end

@implementation RCTI18nManager {
  __weak id<RCTSurfacePresenterStub> _surfacePresenter;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
}

- (NSNumber *)forceRTL:(BOOL)value
{
  BOOL wasRTL = [[RCTI18nUtil sharedInstance] isRTL];
  [[RCTI18nUtil sharedInstance] forceRTL:value];
  BOOL isRTL = [[RCTI18nUtil sharedInstance] isRTL];

  if (isRTL != wasRTL) {
    // Returns before the relayout, so JS reads the new value before any layout event
    id<RCTSurfacePresenterStub> surfacePresenter = _surfacePresenter;
    dispatch_async(dispatch_get_main_queue(), ^{
      [surfacePresenter updateLayoutDirectionOfSurfaces];
    });
  }

  return @(isRTL);
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL" : @([[RCTI18nUtil sharedInstance] isRTL]),
    @"localeIdentifier" : [self _localeIdentifier],
  };
}

// BCP 47 language tag (e.g. "en-US", "zh-Hans-CN"), the same format as Android and the web
- (NSString *)_localeIdentifier
{
  NSLocale *locale = [NSLocale currentLocale];
  NSMutableArray<NSString *> *subtags = [NSMutableArray arrayWithObject:locale.languageCode];

  if (locale.scriptCode != nil) {
    [subtags addObject:locale.scriptCode];
  }
  if (locale.countryCode != nil) {
    [subtags addObject:locale.countryCode];
  }

  return [subtags componentsJoinedByString:@"-"];
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
