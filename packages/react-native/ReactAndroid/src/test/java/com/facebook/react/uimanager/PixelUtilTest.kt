/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Suppress deprecation warnings for checking scaledDensity
@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.util.DisplayMetrics
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import kotlin.math.abs
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class PixelUtilTest {

  private lateinit var context: Context

  @Before
  fun setUp() {
    context = RuntimeEnvironment.getApplication()
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun toPixelFromSP_respectsFontScaleLessThanOne() {
    // Setup display metrics with fontScale < 1.0
    val displayMetrics = DisplayMetrics()
    displayMetrics.density = 3.0f
    displayMetrics.scaledDensity = 3.0f * 0.85f // fontScale = 0.85
    displayMetrics.widthPixels = 1080
    displayMetrics.heightPixels = 1920
    displayMetrics.densityDpi = DisplayMetrics.DENSITY_XXHIGH

    DisplayMetricsHolder.setScreenDisplayMetrics(displayMetrics)

    // Test that toPixelFromSP respects fontScale < 1.0
    val fontSize = 16f // 16sp
    val result = PixelUtil.toPixelFromSP(fontSize)

    // Expected: 16sp * 3.0 (density) * 0.85 (fontScale) = 40.8px
    val expected = fontSize * displayMetrics.scaledDensity

    assertThat(abs(result - expected)).isLessThan(0.1f)
  }

  @Test
  fun toPixelFromSP_respectsFontScaleGreaterThanOne() {
    // Setup display metrics with fontScale > 1.0
    val displayMetrics = DisplayMetrics()
    displayMetrics.density = 3.0f
    displayMetrics.scaledDensity = 3.0f * 1.3f // fontScale = 1.3
    displayMetrics.widthPixels = 1080
    displayMetrics.heightPixels = 1920
    displayMetrics.densityDpi = DisplayMetrics.DENSITY_XXHIGH

    DisplayMetricsHolder.setScreenDisplayMetrics(displayMetrics)

    // Test that toPixelFromSP respects fontScale > 1.0
    val fontSize = 16f // 16sp
    val result = PixelUtil.toPixelFromSP(fontSize)

    // Expected: 16sp * 3.0 (density) * 1.3 (fontScale) = 62.4px
    val expected = fontSize * displayMetrics.scaledDensity

    assertThat(abs(result - expected)).isLessThan(0.1f)
  }

  @Test
  fun toPixelFromSP_respectsMaxFontScale() {
    // Setup display metrics with high fontScale
    val displayMetrics = DisplayMetrics()
    displayMetrics.density = 3.0f
    displayMetrics.scaledDensity = 3.0f * 2.0f // fontScale = 2.0
    displayMetrics.widthPixels = 1080
    displayMetrics.heightPixels = 1920
    displayMetrics.densityDpi = DisplayMetrics.DENSITY_XXHIGH

    DisplayMetricsHolder.setScreenDisplayMetrics(displayMetrics)

    // Test that maxFontScale limits the scaling
    val fontSize = 16f // 16sp
    val maxFontScale = 1.5f
    val result = PixelUtil.toPixelFromSP(fontSize, maxFontScale)

    // With fontScale = 2.0, scaledValue would be 16 * 3.0 * 2.0 = 96px
    // But maxFontScale = 1.5 limits it to 16 * 3.0 * 1.5 = 72px
    val expected = fontSize * displayMetrics.density * maxFontScale

    assertThat(abs(result - expected)).isLessThan(0.1f)
  }

  @Test
  fun toPixelFromSP_doesNotApplyMaxFontScaleWhenFontScaleIsLess() {
    // Setup display metrics with low fontScale
    val displayMetrics = DisplayMetrics()
    displayMetrics.density = 3.0f
    displayMetrics.scaledDensity = 3.0f * 0.8f // fontScale = 0.8
    displayMetrics.widthPixels = 1080
    displayMetrics.heightPixels = 1920
    displayMetrics.densityDpi = DisplayMetrics.DENSITY_XXHIGH

    DisplayMetricsHolder.setScreenDisplayMetrics(displayMetrics)

    // Test that maxFontScale doesn't prevent scaling down
    val fontSize = 16f // 16sp
    val maxFontScale = 1.5f
    val result = PixelUtil.toPixelFromSP(fontSize, maxFontScale)

    // With fontScale = 0.8, scaledValue is 16 * 3.0 * 0.8 = 38.4px
    // maxFontScale limit would be 16 * 3.0 * 1.5 = 72px
    // min(38.4, 72) = 38.4px, so fontScale is respected
    val expected = fontSize * displayMetrics.scaledDensity

    assertThat(abs(result - expected)).isLessThan(0.1f)
  }

  @Test
  fun toPixelFromDIP_convertsCorrectly() {
    val displayMetrics = DisplayMetrics()
    displayMetrics.density = 3.0f
    displayMetrics.widthPixels = 1080
    displayMetrics.heightPixels = 1920
    displayMetrics.densityDpi = DisplayMetrics.DENSITY_XXHIGH

    DisplayMetricsHolder.setScreenDisplayMetrics(displayMetrics)

    val dipValue = 16f
    val result = PixelUtil.toPixelFromDIP(dipValue)

    // Expected: 16dp * 3.0 (density) = 48px
    val expected = dipValue * displayMetrics.density

    assertThat(abs(result - expected)).isLessThan(0.1f)
  }

  @Test
  fun initDisplayMetrics_preservesFontScale() {
    // Create a context with custom configuration
    val mockContext = mock<Context>()
    val mockResources = mock<Resources>()
    val configuration = Configuration()
    configuration.fontScale = 0.85f

    val displayMetrics = DisplayMetrics()
    displayMetrics.density = 3.0f
    displayMetrics.scaledDensity = 3.0f * 0.85f // fontScale = 0.85
    displayMetrics.widthPixels = 1080
    displayMetrics.heightPixels = 1920
    displayMetrics.densityDpi = DisplayMetrics.DENSITY_XXHIGH

    whenever(mockContext.resources).thenReturn(mockResources)
    whenever(mockResources.displayMetrics).thenReturn(displayMetrics)
    whenever(mockResources.configuration).thenReturn(configuration)
    whenever(mockContext.getSystemService(Context.WINDOW_SERVICE))
        .thenReturn(context.getSystemService(Context.WINDOW_SERVICE))

    // Initialize display metrics
    DisplayMetricsHolder.initDisplayMetrics(mockContext)

    val screenMetrics = DisplayMetricsHolder.getScreenDisplayMetrics()

    // Verify that scaledDensity (which includes fontScale) is preserved
    assertThat(abs(screenMetrics.scaledDensity - displayMetrics.scaledDensity)).isLessThan(0.01f)
  }
}
