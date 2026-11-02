/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.scroll

import android.annotation.SuppressLint
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Verifies the default overflow of the vertical and horizontal ScrollViews under props diffing. */
@SuppressLint("DeprecatedClass", "DeprecatedMethod")
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactScrollViewDefaultOverflowTest {

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @Test
  fun defaultOverflowIsScrollWithoutPropsDiffing() {
    overrideFlags(allComponents = false, coreComponents = false)
    assertDefaultOverflow("scroll")
  }

  @Test
  fun defaultOverflowIsVisibleWithPropsDiffingForAllComponents() {
    overrideFlags(allComponents = true, coreComponents = false)
    assertDefaultOverflow("visible")
  }

  @Test
  fun defaultOverflowIsVisibleWithPropsDiffingForCoreComponents() {
    overrideFlags(allComponents = false, coreComponents = true)
    assertDefaultOverflow("visible")
  }

  private fun assertDefaultOverflow(expected: String) {
    val context = createTestReactApplicationContext()
    val themedContext = ThemedReactContext(context, context, null, -1)
    assertThat(ReactScrollViewManager().createViewInstance(themedContext).overflow)
        .isEqualTo(expected)
    assertThat(ReactHorizontalScrollViewManager().createViewInstance(themedContext).overflow)
        .isEqualTo(expected)
  }

  private fun overrideFlags(allComponents: Boolean, coreComponents: Boolean) {
    ReactNativeFeatureFlags.dangerouslyForceOverride(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enablePropsUpdateReconciliationAndroid(): Boolean = allComponents

          override fun enableCoreComponentsPropsUpdateReconciliationAndroid(): Boolean =
              coreComponents
        },
    )
  }
}
