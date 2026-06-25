/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorFlagOverridesGuard.h"

#include <jsinspector-modern/InspectorFlags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * Helper class that maps \c InspectorFlagOverrides to the shape of \c
 * ReactNativeFeatureFlagsDefaults.
 */
class ReactNativeFeatureFlagsOverrides
    : public ReactNativeFeatureFlagsDefaults {
 public:
  explicit ReactNativeFeatureFlagsOverrides(
      const InspectorFlagOverrides& overrides)
      : overrides_(overrides) {}

  bool fuseboxScreenshotCaptureEnabled() override {
    return overrides_.screenshotCaptureEnabled.value_or(
        ReactNativeFeatureFlagsDefaults::fuseboxScreenshotCaptureEnabled());
  }

  bool fuseboxEnabledRelease() override {
    return overrides_.fuseboxEnabledRelease.value_or(
        ReactNativeFeatureFlagsDefaults::fuseboxEnabledRelease());
  }

  bool fuseboxFrameRecordingEnabled() override {
    return overrides_.frameRecordingEnabled.value_or(
        ReactNativeFeatureFlagsDefaults::fuseboxFrameRecordingEnabled());
  }

  bool fuseboxNetworkInspectionEnabled() override {
    return overrides_.networkInspectionEnabled.value_or(
        ReactNativeFeatureFlagsDefaults::fuseboxNetworkInspectionEnabled());
  }

  bool enableBridgelessArchitecture() override {
    // NOTE: Network support is gated by (enableBridgelessArchitecture &&
    // fuseboxNetworkInspectionEnabled).
    return overrides_.networkInspectionEnabled.value_or(
        ReactNativeFeatureFlagsDefaults::enableBridgelessArchitecture());
  }

  bool enableNetworkEventReporting() override {
    return overrides_.enableNetworkEventReporting.value_or(
        ReactNativeFeatureFlagsDefaults::enableNetworkEventReporting());
  }

 private:
  InspectorFlagOverrides overrides_;
};

InspectorFlagOverridesGuard::InspectorFlagOverridesGuard(
    const InspectorFlagOverrides& overrides) {
  InspectorFlags::getInstance().dangerouslyResetFlags();
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsOverrides>(overrides));
}

InspectorFlagOverridesGuard::~InspectorFlagOverridesGuard() {
  ReactNativeFeatureFlags::dangerouslyReset();
}

} // namespace facebook::react::jsinspector_modern
