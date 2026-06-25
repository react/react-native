/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<21e8d5e2a4a37e0a51f25609b80f4924>>
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

public open class ReactNativeFeatureFlagsOverrides_RNOSS_Experimental_Android : ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android() {
  // We could use JNI to get the defaults from C++,
  // but that is more expensive than just duplicating the defaults here.

  override fun cxxNativeAnimatedEnabled(): Boolean = true

  override fun enableFlexboxAutoMinSizeInStrictMode(): Boolean = true

  override fun enableRuntimeSchedulerQueueClearingOnError(): Boolean = true

  override fun enableSchedulerDelegateInvalidation(): Boolean = true

  override fun preventShadowTreeCommitExhaustion(): Boolean = true

  override fun useSharedAnimatedBackend(): Boolean = true
}
