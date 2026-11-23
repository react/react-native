/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactActivityTest {

  // The callback registration in onCreate() isn't covered here: onCreate() needs a
  // ReactApplication, and its SDK 36 check never passes with robolectric.properties at sdk=33.
  class TestActivity : ReactActivity()

  private lateinit var activity: TestActivity

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    activity = Robolectric.buildActivity(TestActivity::class.java).get()
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun backPressedCallbackIsEnabledByDefault() {
    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun setInterceptEnabledHasNoEffectWithoutFeatureFlag() {
    activity.setInterceptEnabled(false)

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun setInterceptEnabledTogglesCallbackWithFeatureFlag() {
    enablePredictiveBack()

    activity.setInterceptEnabled(false)
    assertThat(activity.backPressedCallback.isEnabled).isFalse()

    activity.setInterceptEnabled(true)
    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun invokeDefaultOnBackPressedRestoresDisabledState() {
    activity.backPressedCallback.isEnabled = false

    activity.invokeDefaultOnBackPressed()

    assertThat(activity.backPressedCallback.isEnabled).isFalse()
  }

  @Test
  fun invokeDefaultOnBackPressedRestoresEnabledState() {
    activity.invokeDefaultOnBackPressed()

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  private fun enablePredictiveBack() {
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enablePredictiveBackAndroid(): Boolean = true
        },
    )
  }
}
