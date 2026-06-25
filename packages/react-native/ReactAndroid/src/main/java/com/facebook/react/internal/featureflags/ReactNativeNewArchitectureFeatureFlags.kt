/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.featureflags

import android.annotation.SuppressLint
import com.facebook.infer.annotation.Assertions
import com.facebook.react.common.build.ReactBuildConfig

/**
 * This class provides feature flags for the React Native New Architecture. It wraps the base
 * ReactNativeFeatureFlags with additional logic for strict mode. When strict mode is enabled (via
 * UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE), it enforces specific configurations and provides
 * assertions to ensure proper setup.
 *
 * This class suppress the lint UseReactNativeNewArchitectureFeatureFlagDetector as it is expected
 * to access ReactNativeFeatureFlags from this file.
 */
@SuppressLint("UseReactNativeNewArchitectureFeatureFlagDetector")
public object ReactNativeNewArchitectureFeatureFlags {

  @JvmStatic
  public fun enableBridgelessArchitecture(): Boolean {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          ReactNativeFeatureFlags.enableBridgelessArchitecture(),
          "ReactNativeFeatureFlags.enableBridgelessArchitecture() should be set to TRUE when Strict Mode is enabled",
      )
      return true
    }
    return ReactNativeFeatureFlags.enableBridgelessArchitecture()
  }

  @JvmStatic
  public fun useFabricInterop(): Boolean {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          !ReactNativeFeatureFlags.useFabricInterop(),
          "ReactNativeFeatureFlags.useFabricInterop() should be set to FALSE when Strict Mode is enabled",
      )
      return false
    }
    return ReactNativeFeatureFlags.useFabricInterop()
  }

  @JvmStatic
  public fun useTurboModuleInterop(): Boolean {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          !ReactNativeFeatureFlags.useTurboModuleInterop(),
          "ReactNativeFeatureFlags.useTurboModuleInterop() should be set to FALSE when Strict Mode is enabled",
      )
      return false
    }
    return ReactNativeFeatureFlags.useTurboModuleInterop()
  }
}
