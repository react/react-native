/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<26bae5c08d525d5b1824da0d63f837ea>>
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

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/featureflags/ReactNativeFeatureFlagsOverridesOSSStable.h>

namespace facebook::react {

class ReactNativeFeatureFlagsOverridesOSSCanary : public ReactNativeFeatureFlagsOverridesOSSStable {
 public:
    ReactNativeFeatureFlagsOverridesOSSCanary() = default;

  bool cxxNativeAnimatedEnabled() override {
    return true;
  }

  bool enableAccessibilityOrder() override {
    return true;
  }

  bool enableImperativeEvents() override {
    return true;
  }

  bool enableIntersectionObserverByDefault() override {
    return true;
  }

  bool enableSwiftUIBasedFilters() override {
    return true;
  }

  bool fixBorderlessRippleAndroid() override {
    return true;
  }

  bool fuseboxWebSocketEventsEnabled() override {
    return true;
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    return true;
  }

  bool useTurboModuleInterop() override {
    return true;
  }
};

} // namespace facebook::react
