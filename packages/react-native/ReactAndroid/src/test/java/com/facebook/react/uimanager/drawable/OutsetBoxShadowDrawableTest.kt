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
import android.graphics.RectF
import android.util.DisplayMetrics
import com.facebook.react.uimanager.DisplayMetricsHolder
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class OutsetBoxShadowDrawableTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 1f })
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun skipsShadowsWithZeroOrNegativeHeight() {
    for (spread in listOf(-25f, -30f)) {
      val canvas = mock<Canvas>()
      createDrawable(spread).draw(canvas)
      verifyNoInteractions(canvas)
    }
  }

  @Test
  fun drawsShadowWhenNegativeSpreadLeavesANonEmptyRect() {
    val canvas = mock<Canvas>()
    createDrawable(spread = -20f).draw(canvas)
    verify(canvas).drawRect(eq(RectF(20f, 60f, 80f, 70f)), any<Paint>())
  }

  private fun createDrawable(spread: Float): OutsetBoxShadowDrawable =
      OutsetBoxShadowDrawable(
              context = RuntimeEnvironment.getApplication(),
              shadowColor = Color.BLACK,
              offsetX = 0f,
              offsetY = 40f,
              blurRadius = 0f,
              spread = spread,
          )
          .apply { setBounds(0, 0, 100, 50) }
}
