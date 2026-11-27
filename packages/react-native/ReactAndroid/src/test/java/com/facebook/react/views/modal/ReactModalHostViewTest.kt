/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.modal

import android.app.Activity
import android.view.View
import android.view.Window
import androidx.activity.ComponentDialog
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.util.ReflectionHelpers

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28, 30], shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class ReactModalHostViewTest {
  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun systemAppearance_preservesDialogLayoutWhenActivityFitsSystemWindows() {
    val dialogLayout =
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
    val result = updateSystemAppearance(dialogLayout, View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR)
    assertThat(result).isEqualTo(dialogLayout or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR)
  }

  @Test
  fun systemAppearance_doesNotInheritActivityLayoutWhenDialogFitsSystemWindows() {
    val activityFlags =
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
    val result = updateSystemAppearance(0, activityFlags)
    assertThat(result).isEqualTo(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR)
  }

  @Test
  fun systemAppearance_stillCopiesActivityAppearanceAndVisibility() {
    val dialogFlags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
    val activityFlags =
        View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
    val result = updateSystemAppearance(dialogFlags, activityFlags)
    assertThat(result).isEqualTo(View.SYSTEM_UI_FLAG_LAYOUT_STABLE or activityFlags)
  }

  private fun updateSystemAppearance(dialogFlags: Int, activityFlags: Int): Int {
    val activity = Robolectric.buildActivity(Activity::class.java).create().get()
    val reactContext = BridgeReactContext(activity.application)
    reactContext.onHostResume(activity)
    val context = ThemedReactContext(reactContext, activity, "ModalTest", 1)
    val hostView = ReactModalHostView(context)
    val dialog: ComponentDialog = mock()
    val window: Window = mock()
    val decorView = View(activity)
    whenever(dialog.window).thenReturn(window)
    whenever(window.decorView).thenReturn(decorView)
    activity.window.decorView.systemUiVisibility = activityFlags
    decorView.systemUiVisibility = dialogFlags
    ReflectionHelpers.setField(hostView, "dialog", dialog)
    ReflectionHelpers.callInstanceMethod<Void>(hostView, "updateSystemAppearance")
    return decorView.systemUiVisibility
  }
}
