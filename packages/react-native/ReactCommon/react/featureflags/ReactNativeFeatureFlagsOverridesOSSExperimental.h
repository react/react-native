/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<bcd31ae20312c38ff0bbc8fdeac5ce36>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsOverridesOSSCanary.h>

namespace facebook::react {

class ReactNativeFeatureFlagsOverridesOSSExperimental : public ReactNativeFeatureFlagsOverridesOSSCanary {
 public:
    ReactNativeFeatureFlagsOverridesOSSExperimental() = default;

  bool enableFlexboxAutoMinSizeInStrictMode() override {
    return true;
  }

  bool enableRuntimeSchedulerQueueClearingOnError() override {
    return true;
  }

  bool enableSchedulerDelegateInvalidation() override {
    return true;
  }

  bool fuseboxFrameRecordingEnabled() override {
    return true;
  }

  bool fuseboxScreenshotCaptureEnabled() override {
    return true;
  }

  bool preventShadowTreeCommitExhaustion() override {
    return true;
  }

  bool useSharedAnimatedBackend() override {
    return true;
  }
};

} // namespace facebook::react
