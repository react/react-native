/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Application
import com.facebook.react.bridge.ReactContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@SuppressLint(
    "ActivityStoredInField",
    "DeprecatedClass",
    "DeprecatedMethod",
    "DeprecatedSuperclass",
)
@RunWith(RobolectricTestRunner::class)
class ReactDelegateTest {

  private lateinit var activity: Activity

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    activity = Robolectric.buildActivity(Activity::class.java).create().get()
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun currentReactContext_withReactHost_returnsContext() {
    overrideBridgelessArchitecture(true)
    val reactContext = mock<ReactContext>()
    val reactHost = mock<ReactHost> { on { currentReactContext } doReturn reactContext }
    val delegate = ReactDelegate(activity, reactHost, "test-app", null)

    assertThat(delegate.currentReactContext).isSameAs(reactContext)
  }

  @Test
  fun currentReactContext_withReactHost_ignoresArchitectureFlag() {
    overrideBridgelessArchitecture(false)
    val reactContext = mock<ReactContext>()
    val reactHost = mock<ReactHost> { on { currentReactContext } doReturn reactContext }
    val delegate = ReactDelegate(activity, reactHost, "test-app", null)

    assertThat(delegate.currentReactContext).isSameAs(reactContext)
  }

  @Suppress("DEPRECATION")
  @Test
  fun currentReactContext_withoutReactNativeHost_returnsNull() {
    overrideBridgelessArchitecture(false)
    val delegate = ReactDelegate(activity, null as ReactNativeHost?, "test-app", null)

    assertThat(delegate.currentReactContext).isNull()
  }

  @Suppress("DEPRECATION")
  @Test
  fun currentReactContext_withUninitializedReactNativeHost_doesNotCreateInstance() {
    overrideBridgelessArchitecture(false)
    val reactNativeHost =
        object : ReactNativeHost(activity.application as Application) {
          override fun getUseDeveloperSupport(): Boolean = false

          override fun getPackages(): List<ReactPackage> = emptyList()
        }
    val delegate = ReactDelegate(activity, reactNativeHost, "test-app", null)

    assertThat(delegate.currentReactContext).isNull()
    assertThat(reactNativeHost.hasInstance()).isFalse()
  }

  @Suppress("DEPRECATION")
  @Test
  fun currentReactContext_withInitializedReactNativeHost_returnsContext() {
    overrideBridgelessArchitecture(false)
    val reactContext = mock<ReactContext>()
    val instanceManager =
        mock<ReactInstanceManager> { on { currentReactContext } doReturn reactContext }
    val reactNativeHost = createInitializedReactNativeHost(instanceManager)
    val delegate = ReactDelegate(activity, reactNativeHost, "test-app", null)

    assertThat(delegate.currentReactContext).isSameAs(reactContext)
  }

  @Suppress("DEPRECATION")
  @Test
  fun currentReactContext_withReactNativeHost_ignoresArchitectureFlag() {
    overrideBridgelessArchitecture(true)
    val reactContext = mock<ReactContext>()
    val instanceManager =
        mock<ReactInstanceManager> { on { currentReactContext } doReturn reactContext }
    val reactNativeHost = createInitializedReactNativeHost(instanceManager)
    val delegate = ReactDelegate(activity, reactNativeHost, "test-app", null)

    assertThat(delegate.currentReactContext).isSameAs(reactContext)
  }

  @Suppress("DEPRECATION")
  private fun createInitializedReactNativeHost(
      instanceManager: ReactInstanceManager,
  ): ReactNativeHost =
      object : ReactNativeHost(activity.application as Application) {
        override val reactInstanceManager: ReactInstanceManager = instanceManager

        override fun hasInstance(): Boolean = true

        override fun getUseDeveloperSupport(): Boolean = false

        override fun getPackages(): List<ReactPackage> = emptyList()
      }

  private fun overrideBridgelessArchitecture(enabled: Boolean) {
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableBridgelessArchitecture(): Boolean = enabled
        },
    )
  }
}
