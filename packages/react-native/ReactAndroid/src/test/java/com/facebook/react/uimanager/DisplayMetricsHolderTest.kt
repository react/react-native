/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Suppress deprecation warnings for checking scaledDensity
@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.app.Activity
import android.content.Context
import android.util.DisplayMetrics
import android.view.View
import android.view.Window
import android.view.WindowInsets
import androidx.annotation.RequiresApi
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowNativeMap::class,
            ShadowWritableNativeMap::class,
            ShadowReadableNativeMap::class,
        ]
)
class DisplayMetricsHolderTest {

  private lateinit var context: Context
  private lateinit var displayMetrics: DisplayMetrics

  @Before
  fun setUp() {
    context = RuntimeEnvironment.getApplication()
    displayMetrics = context.resources.displayMetrics
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test(expected = IllegalStateException::class)
  fun getScreenDisplayMetrics_failsIfDisplayMetricsIsNotInitialized() {
    DisplayMetricsHolder.getScreenDisplayMetrics()
  }

  @Test
  fun setAndGetScreenDisplayMetrics_returnsSetValue() {
    DisplayMetricsHolder.setScreenDisplayMetrics(displayMetrics)
    val result = DisplayMetricsHolder.getScreenDisplayMetrics()
    assertThat(result).isEqualTo(displayMetrics)
  }

  @Test
  fun initDisplayMetrics_setsMetrics() {
    DisplayMetricsHolder.initDisplayMetrics(context)
    assertThat(DisplayMetricsHolder.getScreenDisplayMetrics()).isNotNull()
  }

  @Test
  fun initDisplayMetricsIfNotInitialized_onlyInitializesOnce() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
    val firstScreen = DisplayMetricsHolder.getScreenDisplayMetrics()
    // Should not reinitialize
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
    val secondScreen = DisplayMetricsHolder.getScreenDisplayMetrics()
    assertThat(secondScreen).isEqualTo(firstScreen)
  }

  @Test
  @RequiresApi(30)
  fun getEncodedScreenSizeWithoutVerticalInsets_returnsEncodedValue() {
    DisplayMetricsHolder.initDisplayMetrics(context)

    val activity: Activity = mock()
    val window: Window = mock()
    val decorView: View = mock()
    val windowInsets: WindowInsets = mock()
    whenever(activity.window).thenReturn(window)
    whenever(window.decorView).thenReturn(decorView)

    whenever(decorView.rootWindowInsets).thenReturn(windowInsets)
    whenever(windowInsets.getInsets(anyInt()))
        .thenReturn(android.graphics.Insets.of(10, 20, 10, 20))

    // Should return a non-zero encoded value
    val encoded = DisplayMetricsHolder.getEncodedScreenSizeWithoutVerticalInsets(activity)
    assertThat(encoded).isNotZero()
  }

  @Test
  fun getEncodedScreenSizeWithoutVerticalInsets_returnsZeroIfActivityIsNull() {
    val encoded = DisplayMetricsHolder.getEncodedScreenSizeWithoutVerticalInsets(null)
    assertThat(encoded).isZero()
  }

  @Test
  fun encodeFloatsToLong_encodesWidthAndHeightCorrectly() {
    val width = 123.45f
    val height = 67.89f
    val encoded = DisplayMetricsHolder.encodeFloatsToLong(width, height)
    val decodedWidth = Float.fromBits((encoded shr 32).toInt())
    val decodedHeight = Float.fromBits(encoded.toInt())
    assertThat(decodedWidth).isEqualTo(width)
    assertThat(decodedHeight).isEqualTo(height)
  }

  @Test
  fun initDisplayMetrics_preservesScaledDensityForFontScale() {
    val originalMetrics = context.resources.displayMetrics
    val customScaledDensity = originalMetrics.density * 0.85f // fontScale = 0.85

    originalMetrics.scaledDensity = customScaledDensity

    DisplayMetricsHolder.initDisplayMetrics(context)

    val screenMetrics = DisplayMetricsHolder.getScreenDisplayMetrics()

    assertThat(screenMetrics.scaledDensity).isEqualTo(customScaledDensity)
  }

  @Test
  fun initDisplayMetrics_doesNotCrashWithNonVisualContext() {
    val mockContext: Context = mock()
    val mockResources: android.content.res.Resources = mock()
    val metrics = DisplayMetrics()
    metrics.density = 2.0f
    metrics.scaledDensity = 2.0f
    metrics.widthPixels = 1080
    metrics.heightPixels = 1920
    metrics.densityDpi = DisplayMetrics.DENSITY_XHIGH

    whenever(mockContext.resources).thenReturn(mockResources)
    whenever(mockResources.displayMetrics).thenReturn(metrics)
    whenever(mockContext.getSystemService(Context.WINDOW_SERVICE))
        .thenThrow(IllegalStateException("non-visual context"))

    // Should not throw
    DisplayMetricsHolder.initDisplayMetrics(mockContext)

    // Metrics should still be set from resource display metrics
    assertThat(DisplayMetricsHolder.getScreenDisplayMetrics()).isNotNull()
  }
}
