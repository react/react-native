/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

#include <optional>

namespace facebook::react::jsinspector_modern {

/**
 * Overridden \c InspectorFlags values for use in tests.
 */
struct InspectorFlagOverrides {
  // NOTE: Keep these entries in sync with ReactNativeFeatureFlagsOverrides in
  // the implementation file.
  std::optional<bool> screenshotCaptureEnabled;
  std::optional<bool> enableNetworkEventReporting;
  std::optional<bool> frameRecordingEnabled;
  std::optional<bool> fuseboxEnabledRelease;
  std::optional<bool> networkInspectionEnabled;
};

/**
 * A RAII helper to set up and tear down \c InspectorFlags (via \c
 * ReactNativeFeatureFlags) with overrides for the lifetime of a test object.
 */
class InspectorFlagOverridesGuard {
 public:
  explicit InspectorFlagOverridesGuard(const InspectorFlagOverrides &overrides);
  InspectorFlagOverridesGuard(const InspectorFlagOverridesGuard &) = delete;
  InspectorFlagOverridesGuard(InspectorFlagOverridesGuard &&) = default;
  InspectorFlagOverridesGuard &operator=(const InspectorFlagOverridesGuard &) = delete;
  InspectorFlagOverridesGuard &operator=(InspectorFlagOverridesGuard &&) = default;

  ~InspectorFlagOverridesGuard();
};

} // namespace facebook::react::jsinspector_modern
