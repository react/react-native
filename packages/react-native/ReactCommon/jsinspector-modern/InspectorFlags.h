/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <optional>

namespace facebook::react::jsinspector_modern {

/**
 * A container for all inspector related feature flags (Meyers singleton
 * pattern). Enforces that flag values are static for the lifetime of the app.
 */
class InspectorFlags {
 public:
  static InspectorFlags &getInstance();

  InspectorFlags(const InspectorFlags &) = delete;
  InspectorFlags &operator=(const InspectorFlags &) = delete;

  /**
   * Flag determining if the inspector backend should strictly assert that only
   * a single host is registered.
   */
  bool getAssertSingleHostState() const;

  /**
   * Flag determining if the modern CDP backend should be enabled.
   */
  bool getFuseboxEnabled() const;

  /**
   * Flag determining if this is a profiling build
   * (react_native.enable_fusebox_release).
   */
  bool getIsProfilingBuild() const;

  /**
   * Flag determining if Page.captureScreenshot CDP method is enabled.
   */
  bool getScreenshotCaptureEnabled() const;

  /**
   * Flag determining if frame recording (timings + screenshots) is enabled.
   */
  bool getFrameRecordingEnabled() const;

  /**
   * Flag determining if network inspection is enabled.
   */
  bool getNetworkInspectionEnabled() const;

  /**
   * Flag determining if the V2 in-app Performance Monitor is enabled.
   */
  bool getPerfIssuesEnabled() const;

  /**
   * Forcibly disable the main `getFuseboxEnabled()` flag. This should ONLY be
   * used by `ReactInstanceIntegrationTest`.
   */
  void dangerouslyDisableFuseboxForTest();

  /**
   * Reset flags to their upstream values. The caller must ensure any resources
   * that have read previous flag values have been cleaned up.
   */
  void dangerouslyResetFlags();

 private:
  struct Values {
    bool assertSingleHostState;
    bool screenshotCaptureEnabled;
    bool frameRecordingEnabled;
    bool fuseboxEnabled;
    bool isProfilingBuild;
    bool networkInspectionEnabled;
    bool perfIssuesEnabled;
    bool operator==(const Values &) const = default;
  };

  InspectorFlags() = default;
  ~InspectorFlags() = default;

  mutable std::mutex mutex_;
  mutable std::optional<Values> cachedValues_;
  mutable bool inconsistentFlagsStateLogged_{false};
  bool fuseboxDisabledForTest_{false};

  const Values &loadFlagsAndAssertUnchanged() const;
};

} // namespace facebook::react::jsinspector_modern
