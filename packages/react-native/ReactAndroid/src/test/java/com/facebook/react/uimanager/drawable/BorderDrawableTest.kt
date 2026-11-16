/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.util.DisplayMetrics
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.atLeastOnce
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class BorderDrawableTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 1f })
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun removingBorderStyleClearsDashedPathEffect() {
    val borderInsets = BorderInsets().apply { setBorderWidth(LogicalEdge.ALL, 8f) }
    val drawable =
        BorderDrawable(
            context = RuntimeEnvironment.getApplication(),
            borderWidth = Spacing(0f),
            borderRadius = null,
            borderInsets = borderInsets,
            borderStyle = BorderStyle.DASHED,
        )
    drawable.setBounds(0, 0, 240, 120)
    drawable.setBorderWidth(Spacing.ALL, 8f)
    drawable.setBorderColor(LogicalEdge.ALL, Color.RED)

    assertThat(drawBorderPaint(drawable).pathEffect).isInstanceOf(DashPathEffect::class.java)

    drawable.borderStyle = null

    assertThat(drawBorderPaint(drawable).pathEffect).isNull()
  }

  private fun drawBorderPaint(drawable: BorderDrawable): Paint {
    val canvas = mock<Canvas>()
    drawable.draw(canvas)
    val paint = argumentCaptor<Paint>()
    verify(canvas, atLeastOnce()).drawPath(any<Path>(), paint.capture())
    return paint.lastValue
  }
}
