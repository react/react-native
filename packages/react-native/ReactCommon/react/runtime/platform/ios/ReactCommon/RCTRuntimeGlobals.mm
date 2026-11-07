/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRuntimeGlobals.h"

#import <ReactCommon/RCTTurboModule.h>

using namespace facebook::react;

void RCTInstallRuntimeGlobals(facebook::jsi::Runtime &runtime, NSDictionary<NSString *, id> *globals)
{
  if (globals == nil) {
    return;
  }
  auto global = runtime.global();
  for (NSString *name in globals) {
    global.setProperty(
        runtime,
        TurboModuleConvertUtils::convertObjCObjectToJSIValue(runtime, name).asString(runtime),
        TurboModuleConvertUtils::convertObjCObjectToJSIValue(runtime, globals[name]));
  }
}
