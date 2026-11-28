/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.RectF
import android.util.DisplayMetrics
import com.facebook.react.uimanager.DisplayMetricsHolder
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class BackgroundDrawableTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 1f })
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun setAlphaScalesTheAlphaOfTheBackgroundColor() {
    val drawable = createDrawable(Color.argb(128, 255, 0, 0))

    drawable.alpha = 128

    assertThat(drawnColor(drawable)).isEqualTo(Color.argb(64, 255, 0, 0))
    @Suppress("DEPRECATION") assertThat(drawable.opacity).isEqualTo(PixelFormat.TRANSLUCENT)
  }

  @Test
  fun settingTheBackgroundColorResetsTheAlpha() {
    val drawable = createDrawable(Color.RED)
    drawable.alpha = 0
    @Suppress("DEPRECATION") assertThat(drawable.opacity).isEqualTo(PixelFormat.TRANSPARENT)

    drawable.backgroundColor = Color.BLUE

    assertThat(drawnColor(drawable)).isEqualTo(Color.BLUE)
    @Suppress("DEPRECATION") assertThat(drawable.opacity).isEqualTo(PixelFormat.OPAQUE)
  }

  @Test
  fun drawablesShareOnePaintAndKeepTheirColors() {
    val red = createDrawable(Color.RED)
    val blue = createDrawable(Color.BLUE)

    val redPaint = drawnPaint(red)
    assertThat(redPaint.color).isEqualTo(Color.RED)
    val bluePaint = drawnPaint(blue)
    assertThat(bluePaint.color).isEqualTo(Color.BLUE)
    assertThat(bluePaint).isSameAs(redPaint)
    assertThat(drawnColor(red)).isEqualTo(Color.RED)
  }

  private fun createDrawable(color: Int): BackgroundDrawable =
      BackgroundDrawable(RuntimeEnvironment.getApplication()).apply {
        setBounds(0, 0, 100, 50)
        backgroundColor = color
      }

  private fun drawnColor(drawable: BackgroundDrawable): Int = drawnPaint(drawable).color

  /** Draws [drawable] and returns the paint it drew with, read before anything else draws. */
  private fun drawnPaint(drawable: BackgroundDrawable): Paint {
    val canvas = mock<Canvas>()
    drawable.draw(canvas)
    val paint = argumentCaptor<Paint>()
    verify(canvas).drawRect(any<RectF>(), paint.capture())
    return paint.lastValue
  }
}
