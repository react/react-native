/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTVibration.h>

#import <AudioToolbox/AudioToolbox.h>
#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTLog.h>

#import "RCTVibrationPlugins.h"

@interface RCTVibration () <NativeVibrationSpec>
@end

@implementation RCTVibration

RCT_EXPORT_MODULE()

- (void)vibrate
{
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

- (void)vibrate:(double)pattern
{
  [self vibrate];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeVibrationSpecJSI>(params);
}

- (void)vibrateByPattern:(NSArray *)pattern repeat:(double)repeat
{
  RCTLogError(@"Vibration.vibrateByPattern does not have an iOS implementation");
}

- (void)cancel
{
  RCTLogError(@"Vibration.cancel does not have an iOS implementation");
}

@end

Class RCTVibrationCls(void)
{
  return RCTVibration.class;
}
