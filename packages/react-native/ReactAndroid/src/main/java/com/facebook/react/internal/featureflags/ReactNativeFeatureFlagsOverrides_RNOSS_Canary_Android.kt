/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<1664bdb6cd521d608b9bab74df43eb76>>
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

package com.facebook.react.internal.featureflags

public open class ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android : ReactNativeFeatureFlagsDefaults() {
  // We could use JNI to get the defaults from C++,
  // but that is more expensive than just duplicating the defaults here.

  override fun cxxNativeAnimatedEnabled(): Boolean = true

  override fun enableAccessibilityOrder(): Boolean = true

  override fun enableIntersectionObserverByDefault(): Boolean = true

  override fun enableSwiftUIBasedFilters(): Boolean = true

  override fun useNativeViewConfigsInBridgelessMode(): Boolean = true

  override fun useTurboModuleInterop(): Boolean = true
}
