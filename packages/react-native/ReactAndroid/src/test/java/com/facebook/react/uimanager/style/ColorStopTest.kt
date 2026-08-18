/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.Color
import android.util.DisplayMetrics
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import org.assertj.core.api.Assertions.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/** Tests for [ColorStopUtils] */
@RunWith(RobolectricTestRunner::class)
class ColorStopTest {
  @Before
  fun setUp() {
    val metrics = DisplayMetrics()
    metrics.density = 1f
    DisplayMetricsHolder.setScreenDisplayMetrics(metrics)
  }

  @Test
  fun testBasicColorStops() {
    val colorStops = listOf(
        ColorStop(Color.RED, LengthPercentage(0f, LengthPercentageType.PERCENT)),
        ColorStop(Color.GREEN, LengthPercentage(42f, LengthPercentageType.PERCENT)),
    )

    val processed = ColorStopUtils.getFixedColorStops(colorStops, 60f)
    assertThat(processed).hasSize(2)
    assertThat(processed[0].color).isEqualTo(Color.RED)
    assertThat(processed[0].position).isEqualTo(0f)
    assertThat(processed[1].color).isEqualTo(Color.GREEN)
    assertThat(processed[1].position).isEqualTo(0.42f)
  }

  @Test
  fun testColorStopsWithFirstAndLastPositionsMissing() {
    val colorStops = listOf(
        ColorStop(Color.RED),
        ColorStop(Color.GREEN, LengthPercentage(30f, LengthPercentageType.PERCENT)),
        ColorStop(Color.BLUE),
    )
    val processed = ColorStopUtils.getFixedColorStops(colorStops, 80f)

    assertThat(processed).hasSize(3)
    assertThat(processed[0].color).isEqualTo(Color.RED)
    assertThat(processed[0].position).isEqualTo(0f)
    assertThat(processed[1].color).isEqualTo(Color.GREEN)
    assertThat(processed[1].position).isEqualTo(0.3f)
    assertThat(processed[2].color).isEqualTo(Color.BLUE)
    assertThat(processed[2].position).isEqualTo(1f)
  }

  @Test
  fun testColorStopsWithLessPositionValueThanPreviousPosition() {
    val colorStops = listOf(
        ColorStop(Color.RED),
        ColorStop(Color.GREEN, LengthPercentage(30f, LengthPercentageType.PERCENT)),
        ColorStop(Color.BLUE, LengthPercentage(20f, LengthPercentageType.PERCENT)),
        ColorStop(Color.GRAY, LengthPercentage(60f, LengthPercentageType.PERCENT)),
        ColorStop(Color.CYAN, LengthPercentage(50f, LengthPercentageType.PERCENT)),
    )
    val processed = ColorStopUtils.getFixedColorStops(colorStops, 80f)

    assertThat(processed).hasSize(5)
    assertThat(processed[0].color).isEqualTo(Color.RED)
    assertThat(processed[0].position).isEqualTo(0f)
    assertThat(processed[1].color).isEqualTo(Color.GREEN)
    assertThat(processed[1].position).isEqualTo(0.3f)
    assertThat(processed[2].color).isEqualTo(Color.BLUE)
    assertThat(processed[2].position).isEqualTo(0.3f)
    assertThat(processed[3].color).isEqualTo(Color.GRAY)
    assertThat(processed[3].position).isEqualTo(0.6f)
    assertThat(processed[4].color).isEqualTo(Color.CYAN)
    assertThat(processed[4].position).isEqualTo(0.6f)
  }

  @Test
  fun testColorStopsWithMissingMiddlePositions() {
    val colorStops = listOf(
        ColorStop(Color.RED, LengthPercentage(0f, LengthPercentageType.PERCENT)),
        ColorStop(Color.GREEN),
        ColorStop(Color.BLUE),
        ColorStop(Color.TRANSPARENT, LengthPercentage(100f, LengthPercentageType.PERCENT)),
    )
    val processed = ColorStopUtils.getFixedColorStops(colorStops, 100f)

    assertThat(processed).hasSize(4)
    assertThat(processed[0].color).isEqualTo(Color.RED)
    assertThat(processed[0].position).isEqualTo(0f)
    assertThat(processed[1].color).isEqualTo(Color.GREEN)
    assertThat(processed[1].position).isEqualTo(0.33333334f)
    assertThat(processed[2].color).isEqualTo(Color.BLUE)
    assertThat(processed[2].position).isEqualTo(0.6666667f)
    assertThat(processed[3].color).isEqualTo(Color.TRANSPARENT)
    assertThat(processed[3].position).isEqualTo(1f)
  }

  @Test
  fun testColorStopsWithMixedUnits() {
    val colorStops = listOf(
        ColorStop(Color.YELLOW, LengthPercentage(100f, LengthPercentageType.POINT)),
        ColorStop(Color.BLUE, LengthPercentage(50f, LengthPercentageType.PERCENT)),
    )

    val processed200px = ColorStopUtils.getFixedColorStops(colorStops, 200f)
    assertThat(processed200px).hasSize(2)
    assertThat(processed200px[0].color).isEqualTo(Color.YELLOW)
    assertThat(processed200px[0].position).isEqualTo(0.5f)
    assertThat(processed200px[1].color).isEqualTo(Color.BLUE)
    assertThat(processed200px[1].position).isEqualTo(0.5f)

    // positions should be corrected
    val processed150px = ColorStopUtils.getFixedColorStops(colorStops, 150f)
    assertThat(processed150px).hasSize(2)
    assertThat(processed150px[0].color).isEqualTo(Color.YELLOW)
    assertThat(processed150px[0].position).isEqualTo(0.6666667f) // 100px / 150px ≈ 0.6667
    assertThat(processed150px[1].color).isEqualTo(Color.BLUE)
    assertThat(processed150px[1].position)
        .isEqualTo(0.6666667f) // Corrected to match yellow's position
  }

  @Test
  fun testColorStopsWithMultipleTransitionHints() {
    val colorStops = listOf(
        ColorStop(Color.RED, LengthPercentage(0f, LengthPercentageType.PERCENT)),
        ColorStop(null, LengthPercentage(10f, LengthPercentageType.PERCENT)),
        ColorStop(Color.GREEN, LengthPercentage(50f, LengthPercentageType.PERCENT)),
        ColorStop(null, LengthPercentage(85f, LengthPercentageType.PERCENT)),
        ColorStop(Color.BLUE, LengthPercentage(100f, LengthPercentageType.PERCENT)),
    )
    val processed = ColorStopUtils.getFixedColorStops(colorStops, 100f)
    assertThat(processed.size).isEqualTo(21)
    assertThat(processed.first().color).isEqualTo(Color.RED)
    assertThat(processed.first().position).isEqualTo(0f)
    // 9 interpolated colors and positions between RED and GREEN
    assertThat(processed.subList(1, 10).all { it.color != null && it.position != null }).isTrue()
    assertThat(processed[10].color).isEqualTo(Color.GREEN)
    assertThat(processed[10].position).isEqualTo(0.5f)
    // 9 interpolated colors and positions between GREEN and BLUE
    assertThat(processed.subList(11, 20).all { it.color != null && it.position != null }).isTrue()
    assertThat(processed[20].color).isEqualTo(Color.BLUE)
    assertThat(processed[20].position).isEqualTo(1f)
  }

  @Test
  fun testColorStopsWithPositionedStopAdjacentToUnpositionedStop() {
    val colorStops = listOf(
        ColorStop(Color.RED, LengthPercentage(0f, LengthPercentageType.PERCENT)),
        ColorStop(Color.GREEN, LengthPercentage(20f, LengthPercentageType.PERCENT)),
        ColorStop(Color.BLUE),
        ColorStop(Color.YELLOW, LengthPercentage(80f, LengthPercentageType.PERCENT)),
        ColorStop(Color.MAGENTA, LengthPercentage(100f, LengthPercentageType.PERCENT)),
    )
    val processed = ColorStopUtils.getFixedColorStops(colorStops, 100f)

    assertThat(processed).hasSize(5)
    assertThat(processed[0].color).isEqualTo(Color.RED)
    assertThat(processed[0].position).isEqualTo(0f)
    assertThat(processed[1].color).isEqualTo(Color.GREEN)
    assertThat(processed[1].position).isEqualTo(0.2f)
    assertThat(processed[2].color).isEqualTo(Color.BLUE)
    assertThat(processed[2].position).isEqualTo(0.5f)
    assertThat(processed[3].color).isEqualTo(Color.YELLOW)
    assertThat(processed[3].position).isEqualTo(0.8f)
    assertThat(processed[4].color).isEqualTo(Color.MAGENTA)
    assertThat(processed[4].position).isEqualTo(1f)
  }
}
