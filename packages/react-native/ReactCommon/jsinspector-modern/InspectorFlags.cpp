/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorFlags.h"

#include <glog/logging.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react::jsinspector_modern {

InspectorFlags& InspectorFlags::getInstance() {
  static InspectorFlags instance;
  return instance;
}

bool InspectorFlags::getAssertSingleHostState() const {
  return loadFlagsAndAssertUnchanged().assertSingleHostState;
}

bool InspectorFlags::getScreenshotCaptureEnabled() const {
  return loadFlagsAndAssertUnchanged().screenshotCaptureEnabled;
}

bool InspectorFlags::getFrameRecordingEnabled() const {
  return loadFlagsAndAssertUnchanged().frameRecordingEnabled;
}

bool InspectorFlags::getFuseboxEnabled() const {
  if (fuseboxDisabledForTest_) {
    return false;
  }

  return loadFlagsAndAssertUnchanged().fuseboxEnabled;
}

bool InspectorFlags::getIsProfilingBuild() const {
  return loadFlagsAndAssertUnchanged().isProfilingBuild;
}

bool InspectorFlags::getNetworkInspectionEnabled() const {
  return loadFlagsAndAssertUnchanged().networkInspectionEnabled;
}

bool InspectorFlags::getPerfIssuesEnabled() const {
  return loadFlagsAndAssertUnchanged().perfIssuesEnabled;
}

void InspectorFlags::dangerouslyResetFlags() {
  std::lock_guard<std::mutex> lock(mutex_);
  cachedValues_.reset();
  inconsistentFlagsStateLogged_ = false;
  fuseboxDisabledForTest_ = false;
}

void InspectorFlags::dangerouslyDisableFuseboxForTest() {
  fuseboxDisabledForTest_ = true;
}

const InspectorFlags::Values& InspectorFlags::loadFlagsAndAssertUnchanged()
    const {
  InspectorFlags::Values newValues = {
      .assertSingleHostState =
          ReactNativeFeatureFlags::fuseboxAssertSingleHostState(),
      .screenshotCaptureEnabled =
          ReactNativeFeatureFlags::fuseboxScreenshotCaptureEnabled(),
      .frameRecordingEnabled =
          ReactNativeFeatureFlags::fuseboxFrameRecordingEnabled(),
      .fuseboxEnabled =
#if defined(REACT_NATIVE_DEBUGGER_ENABLED)
          true,
#else
          ReactNativeFeatureFlags::fuseboxEnabledRelease(),
#endif
      .isProfilingBuild =
#if defined(REACT_NATIVE_DEBUGGER_MODE_PROD)
          true,
#else
          false,
#endif
      .networkInspectionEnabled =
          ReactNativeFeatureFlags::enableBridgelessArchitecture() &&
          ReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled(),
      .perfIssuesEnabled = ReactNativeFeatureFlags::perfIssuesEnabled(),
  };

  // Protect against concurrent calls
  std::lock_guard<std::mutex> lock(mutex_);
  if (cachedValues_.has_value() && !inconsistentFlagsStateLogged_) {
    if (cachedValues_ != newValues) {
      LOG(ERROR)
          << "[InspectorFlags] Error: One or more ReactNativeFeatureFlags values "
          << "have changed during the global app lifetime. This may lead to "
          << "inconsistent inspector behaviour. Please quit and restart the app.";
      inconsistentFlagsStateLogged_ = true;
    }
  }
  cachedValues_ = newValues;

  return cachedValues_.value();
}

} // namespace facebook::react::jsinspector_modern
