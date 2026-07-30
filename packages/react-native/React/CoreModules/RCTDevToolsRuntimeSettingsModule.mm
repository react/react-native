/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTDevToolsRuntimeSettingsModule.h>

#import "CoreModulesPlugins.h"

struct Config {
  bool shouldReloadAndProfile = false;
  bool recordChangeDescriptions = false;
};

// static to persist across Turbo Module reloads
static Config _config;

@interface RCTDevToolsRuntimeSettingsModule () <NativeReactDevToolsRuntimeSettingsModuleSpec> {
}
@end

@implementation RCTDevToolsRuntimeSettingsModule
RCT_EXPORT_MODULE(ReactDevToolsRuntimeSettingsModule)

- (void)setReloadAndProfileConfig:(JS::NativeReactDevToolsRuntimeSettingsModule::PartialReloadAndProfileConfig &)config
{
  if (config.shouldReloadAndProfile().has_value()) {
    _config.shouldReloadAndProfile = config.shouldReloadAndProfile().value();
  }
  if (config.recordChangeDescriptions().has_value()) {
    _config.recordChangeDescriptions = config.recordChangeDescriptions().value();
  }
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getReloadAndProfileConfig)
{
  return @{
    @"shouldReloadAndProfile" : @(_config.shouldReloadAndProfile),
    @"recordChangeDescriptions" : @(_config.recordChangeDescriptions),
  };
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeReactDevToolsRuntimeSettingsModuleSpecJSI>(params);
}

@end

Class RCTDevToolsRuntimeSettingsCls(void)
{
  return RCTDevToolsRuntimeSettingsModule.class;
}
