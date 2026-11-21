/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.modal

import android.app.Activity
import android.graphics.Color
import android.view.Window
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.LightNavigationBarColor
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28], qualifiers = "notnight", shadows = [ShadowSoLoader::class])
class ReactModalHostViewNavigationBarTest {
  private lateinit var activityController: ActivityController<Activity>
  private lateinit var modal: ReactModalHostView
  private var previousEdgeToEdgeFlag = false

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    previousEdgeToEdgeFlag = isEdgeToEdgeFeatureFlagOn
    isEdgeToEdgeFeatureFlagOn = false
    activityController = Robolectric.buildActivity(Activity::class.java).setup()
    val activity = activityController.get()
    val reactContext = createTestReactApplicationContext()
    reactContext.onHostResume(activity)
    modal = ReactModalHostView(ThemedReactContext(reactContext, activity, "ModalTest", 1))
  }

  @After
  fun tearDown() {
    modal.onDropInstance()
    activityController.pause().stop().destroy()
    isEdgeToEdgeFeatureFlagOn = previousEdgeToEdgeFlag
  }

  private fun showModal(transparent: Boolean): Window {
    modal.transparent = transparent
    modal.statusBarTranslucent = true
    modal.navigationBarTranslucent = true
    modal.showOrUpdate()
    return requireNotNull(modal.dialog?.window)
  }

  @Test
  fun transparentModalDoesNotAddALightScrim() {
    val activityWindow = activityController.get().window
    activityWindow.navigationBarColor = Color.BLACK

    assertThat(showModal(transparent = true).navigationBarColor).isEqualTo(Color.TRANSPARENT)
    assertThat(activityWindow.navigationBarColor).isEqualTo(Color.BLACK)
  }

  @Test
  @Config(qualifiers = "night")
  fun transparentModalDoesNotAddADarkScrim() {
    assertThat(showModal(transparent = true).navigationBarColor).isEqualTo(Color.TRANSPARENT)
  }

  @Test
  @Config(sdk = [28, 29, 33])
  fun transparentModalKeepsHostNavigationButtonStyleAcrossUpdates() {
    val activityWindow = activityController.get().window
    val hostController = WindowInsetsControllerCompat(activityWindow, activityWindow.decorView)
    hostController.isAppearanceLightNavigationBars = false

    val window = showModal(transparent = true)
    val modalController = WindowInsetsControllerCompat(window, window.decorView)
    assertThat(modalController.isAppearanceLightNavigationBars).isFalse()

    modal.showOrUpdate()
    assertThat(modalController.isAppearanceLightNavigationBars).isFalse()

    hostController.isAppearanceLightNavigationBars = true
    modal.showOrUpdate()
    assertThat(modalController.isAppearanceLightNavigationBars).isTrue()
  }

  @Test
  fun opaqueModalKeepsTheScrim() {
    assertThat(showModal(transparent = false).navigationBarColor).isEqualTo(LightNavigationBarColor)
  }

  @Test
  fun changingTransparencyUpdatesTheScrim() {
    val window = showModal(transparent = false)

    modal.transparent = true
    modal.showOrUpdate()
    assertThat(window.navigationBarColor).isEqualTo(Color.TRANSPARENT)

    modal.transparent = false
    modal.showOrUpdate()
    assertThat(window.navigationBarColor).isEqualTo(LightNavigationBarColor)
  }
}
