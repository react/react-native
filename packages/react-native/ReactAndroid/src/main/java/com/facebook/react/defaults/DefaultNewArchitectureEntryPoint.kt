/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.react.common.ReleaseLevel
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsOverrides_RNOSS_Experimental_Android
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsProvider

/**
 * A utility class that serves as an entry point for users setup the New Architecture.
 *
 * This class needs to be invoked as `DefaultNewArchitectureEntryPoint.load()`, optionally after
 * setting [releaseLevel] to pick the set of feature flags to apply.
 *
 * By default it loads a library called `appmodules`. `appmodules` is a convention used to refer to
 * the application dynamic library. If changed here should be updated also inside the template.
 */
public object DefaultNewArchitectureEntryPoint {

  public var releaseLevel: ReleaseLevel = ReleaseLevel.STABLE

  /** Loads the React Native New Architecture entry point for the configured [releaseLevel]. */
  @JvmStatic
  public fun load() {
    ReactNativeFeatureFlags.override(getDefaultFeatureFlagsProvider())

    DefaultSoLoader.maybeLoadSoLibrary()
  }

  @JvmStatic
  internal fun loadWithFeatureFlags(featureFlags: ReactNativeFeatureFlagsProvider) {
    ReactNativeFeatureFlags.override(featureFlags)

    DefaultSoLoader.maybeLoadSoLibrary()
  }

  internal fun getDefaultFeatureFlagsProvider(): ReactNativeFeatureFlagsProvider =
      when (releaseLevel) {
        ReleaseLevel.EXPERIMENTAL -> ReactNativeFeatureFlagsOverrides_RNOSS_Experimental_Android()
        ReleaseLevel.CANARY -> ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android()
        ReleaseLevel.STABLE -> ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android()
      }
}
