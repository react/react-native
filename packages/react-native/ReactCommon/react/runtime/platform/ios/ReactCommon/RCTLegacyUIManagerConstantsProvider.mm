/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTLegacyUIManagerConstantsProvider.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#import <React/RCTBridge+Private.h>
#import <React/RCTComponentData.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import <ReactCommon/RCTTurboModule.h>
#import <react/runtime/nativeviewconfig/LegacyUIManagerConstantsProviderBinding.h>

namespace facebook::react {
namespace {

jsi::Value getConstants(facebook::jsi::Runtime &runtime)
{
  NSMutableDictionary<NSString *, NSObject *> *result = [NSMutableDictionary new];
  auto directEvents = [NSMutableDictionary new];
  auto bubblingEvents = [NSMutableDictionary new];
  for (Class moduleClass in RCTGetModuleClasses()) {
    if ([moduleClass isSubclassOfClass:RCTViewManager.class]) {
      auto name = RCTViewManagerModuleNameForClass(moduleClass);
      auto viewConfig = [RCTComponentData viewConfigForViewMangerClass:moduleClass];
      auto moduleConstants =
          RCTModuleConstantsForDestructuredComponent(directEvents, bubblingEvents, moduleClass, name, viewConfig);
      result[name] = moduleConstants;
    }
  }
  return TurboModuleConvertUtils::convertObjCObjectToJSIValue(runtime, result);
};

} // namespace

void installLegacyUIManagerConstantsProviderBinding(jsi::Runtime &runtime)
{
  LegacyUIManagerConstantsProviderBinding::install(runtime, "getConstants", getConstants);
}
} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
