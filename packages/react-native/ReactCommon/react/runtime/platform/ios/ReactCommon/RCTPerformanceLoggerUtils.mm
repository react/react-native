/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPerformanceLoggerUtils.h"

#import <React/RCTPerformanceLogger.h>
#import <cxxreact/ReactMarker.h>

using namespace facebook::react;

static void mapReactMarkerToPerformanceLogger(
    const ReactMarker::ReactMarkerId markerId,
    RCTPerformanceLogger *performanceLogger)
{
  switch (markerId) {
    case ReactMarker::APP_STARTUP_START:
      [performanceLogger markStartForTag:RCTPLAppStartup];
      break;
    case ReactMarker::APP_STARTUP_STOP:
      [performanceLogger markStopForTag:RCTPLAppStartup];
      break;
    case ReactMarker::INIT_REACT_RUNTIME_START:
      [performanceLogger markStartForTag:RCTPLInitReactRuntime];
      break;
    case ReactMarker::INIT_REACT_RUNTIME_STOP:
      [performanceLogger markStopForTag:RCTPLInitReactRuntime];
      break;
    case ReactMarker::RUN_JS_BUNDLE_START:
      [performanceLogger markStartForTag:RCTPLScriptExecution];
      break;
    case ReactMarker::RUN_JS_BUNDLE_STOP:
      [performanceLogger markStopForTag:RCTPLScriptExecution];
      break;
    case ReactMarker::NATIVE_REQUIRE_START:
      [performanceLogger appendStartForTag:RCTPLRAMNativeRequires];
      break;
    case ReactMarker::NATIVE_REQUIRE_STOP:
      [performanceLogger appendStopForTag:RCTPLRAMNativeRequires];
      [performanceLogger addValue:1 forTag:RCTPLRAMNativeRequiresCount];
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_START:
      [performanceLogger markStartForTag:RCTPLNativeModuleSetup];
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_STOP:
      [performanceLogger markStopForTag:RCTPLNativeModuleSetup];
      break;
    case ReactMarker::REACT_INSTANCE_INIT_START:
      [performanceLogger markStartForTag:RCTPLReactInstanceInit];
      break;
    case ReactMarker::REACT_INSTANCE_INIT_STOP:
      [performanceLogger markStopForTag:RCTPLReactInstanceInit];
      break;
    case ReactMarker::CREATE_REACT_CONTEXT_STOP:
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_START:
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP:
    case ReactMarker::REGISTER_JS_SEGMENT_START:
    case ReactMarker::REGISTER_JS_SEGMENT_STOP:
      // These are not used on iOS.
      break;
  }
}

void registerPerformanceLoggerHooks(RCTPerformanceLogger *performanceLogger)
{
  __weak RCTPerformanceLogger *weakPerformanceLogger = performanceLogger;
  ReactMarker::logTaggedMarkerImpl = [weakPerformanceLogger](
                                         const ReactMarker::ReactMarkerId markerId, const char *tag) {
    (void)tag;
    mapReactMarkerToPerformanceLogger(markerId, weakPerformanceLogger);
  };
}
