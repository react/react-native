/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.Color
import android.util.DisplayMetrics
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import org.assertj.core.api.Assertions.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

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
    val colorStops =
        listOf(
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
    val colorStops =
        listOf(
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
    val colorStops =
        listOf(
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
    val colorStops =
        listOf(
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
    val colorStops =
        listOf(
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
    val colorStops =
        listOf(
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
    val colorStops =
        listOf(
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

  @Test
  fun testClipColorStopsKeepsStopsInsideRange() {
    val colorStops =
        listOf(ProcessedColorStop(Color.RED, 0.1f), ProcessedColorStop(Color.BLUE, 0.9f))

    assertThat(ColorStopUtils.clipColorStops(colorStops)).isSameAs(colorStops)
  }

  @Test
  fun testClipColorStopsInterpolatesAtBothEnds() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(ProcessedColorStop(Color.RED, -0.5f), ProcessedColorStop(Color.BLUE, 1.5f))
        )

    assertThat(clipped).hasSize(2)
    assertThat(clipped[0].color).isEqualTo(Color.rgb(191, 0, 64))
    assertThat(clipped[0].position).isEqualTo(0f)
    assertThat(clipped[1].color).isEqualTo(Color.rgb(64, 0, 191))
    assertThat(clipped[1].position).isEqualTo(1f)
  }

  @Test
  fun testClipColorStopsKeepsStopsBetweenClippedEnds() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(
                ProcessedColorStop(Color.RED, -0.5f),
                ProcessedColorStop(Color.YELLOW, 0.25f),
                ProcessedColorStop(Color.BLUE, 1.5f),
            )
        )

    assertThat(clipped).hasSize(3)
    assertThat(clipped[0].color).isEqualTo(Color.rgb(255, 170, 0))
    assertThat(clipped[0].position).isEqualTo(0f)
    assertThat(clipped[1].color).isEqualTo(Color.YELLOW)
    assertThat(clipped[1].position).isEqualTo(0.25f)
    assertThat(clipped[2].color).isEqualTo(Color.rgb(102, 102, 153))
    assertThat(clipped[2].position).isEqualTo(1f)
  }

  @Test
  fun testClipColorStopsOutsideRangeBecomeSolidColor() {
    val below =
        ColorStopUtils.clipColorStops(
            listOf(ProcessedColorStop(Color.RED, -0.8f), ProcessedColorStop(Color.BLUE, -0.2f))
        )
    assertThat(below.map { it.color }).containsExactly(Color.BLUE, Color.BLUE)
    assertThat(below.map { it.position }).containsExactly(0f, 1f)

    val above =
        ColorStopUtils.clipColorStops(
            listOf(ProcessedColorStop(Color.RED, 1.2f), ProcessedColorStop(Color.BLUE, 1.8f))
        )
    assertThat(above.map { it.color }).containsExactly(Color.RED, Color.RED)
    assertThat(above.map { it.position }).containsExactly(0f, 1f)
  }

  @Test
  fun testClipColorStopsAddsSecondStopWhenOnlyOneRemains() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(ProcessedColorStop(Color.RED, -0.1f), ProcessedColorStop(Color.BLUE, 0f))
        )

    assertThat(clipped.map { it.color }).containsExactly(Color.BLUE, Color.BLUE)
    assertThat(clipped.map { it.position }).containsExactly(0f, 1f)
  }

  @Test
  fun testClipColorStopsWithCustomEndOnlyClipsBelowZero() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(ProcessedColorStop(Color.RED, -0.5f), ProcessedColorStop(Color.BLUE, 1.5f)),
            end = 1.5f,
        )

    assertThat(clipped).hasSize(2)
    assertThat(clipped[0].color).isEqualTo(Color.rgb(191, 0, 64))
    assertThat(clipped[0].position).isEqualTo(0f)
    assertThat(clipped[1].color).isEqualTo(Color.BLUE)
    assertThat(clipped[1].position).isEqualTo(1.5f)
  }

  @Test
  fun testClipColorStopsInterpolatesWithPremultipliedAlpha() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(
                ProcessedColorStop(Color.RED, -0.5f),
                ProcessedColorStop(Color.TRANSPARENT, 1.5f),
            )
        )

    assertThat(clipped[0].color).isEqualTo(Color.argb(191, 255, 0, 0))
    assertThat(clipped[1].color).isEqualTo(Color.argb(64, 255, 0, 0))
  }

  @Test
  fun testClipColorStopsKeepsStopsOnRangeBoundaries() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(
                ProcessedColorStop(Color.RED, -0.5f),
                ProcessedColorStop(Color.GREEN, 0f),
                ProcessedColorStop(Color.BLUE, 1f),
                ProcessedColorStop(Color.YELLOW, 1.5f),
            )
        )

    assertThat(clipped.map { it.color }).containsExactly(Color.GREEN, Color.BLUE)
    assertThat(clipped.map { it.position }).containsExactly(0f, 1f)
  }

  @Test
  fun testClipColorStopsInterpolatesBetweenStopsAroundBoundary() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(
                ProcessedColorStop(Color.RED, -1f),
                ProcessedColorStop(Color.GREEN, -0.5f),
                ProcessedColorStop(Color.BLUE, 0.5f),
            )
        )

    assertThat(clipped.map { it.color }).containsExactly(Color.rgb(0, 128, 128), Color.BLUE)
    assertThat(clipped.map { it.position }).containsExactly(0f, 0.5f)
  }

  @Test
  fun testClipColorStopsWithNoStopInsideRange() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(
                ProcessedColorStop(Color.RED, -1f),
                ProcessedColorStop(Color.GREEN, -0.5f),
                ProcessedColorStop(Color.BLUE, 2f),
            )
        )

    assertThat(clipped.map { it.color })
        .containsExactly(Color.rgb(0, 204, 51), Color.rgb(0, 102, 153))
    assertThat(clipped.map { it.position }).containsExactly(0f, 1f)
  }

  @Test
  fun testClipColorStopsInterpolatesBetweenSemiTransparentColors() {
    val clipped =
        ColorStopUtils.clipColorStops(
            listOf(
                ProcessedColorStop(Color.argb(128, 255, 0, 0), -0.5f),
                ProcessedColorStop(Color.BLUE, 1.5f),
            )
        )

    assertThat(clipped[0].color).isEqualTo(Color.argb(160, 153, 0, 102))
    assertThat(clipped[1].color).isEqualTo(Color.argb(223, 37, 0, 218))
  }

  @Test
  fun testInfinitePositionsAreClampedBeforeClipping() {
    val fixed =
        ColorStopUtils.getFixedColorStops(
            listOf(
                ColorStop(
                    Color.RED,
                    LengthPercentage(Float.NEGATIVE_INFINITY, LengthPercentageType.PERCENT),
                ),
                ColorStop(Color.BLUE, LengthPercentage(50f, LengthPercentageType.PERCENT)),
            ),
            100f,
        )
    val clipped = ColorStopUtils.clipColorStops(fixed)

    assertThat(fixed.map { it.position }).allMatch { it != null && it.isFinite() }
    assertThat(clipped.map { it.color }).containsExactly(Color.BLUE, Color.BLUE)
    assertThat(clipped.map { it.position }).containsExactly(0f, 0.5f)
  }

  @Test
  fun testTransitionHintsAreExpandedBeforeClipping() {
    val fixed =
        ColorStopUtils.getFixedColorStops(
            listOf(
                ColorStop(Color.RED, LengthPercentage(-30f, LengthPercentageType.PERCENT)),
                ColorStop(null, LengthPercentage(0f, LengthPercentageType.PERCENT)),
                ColorStop(Color.BLUE, LengthPercentage(65f, LengthPercentageType.PERCENT)),
            ),
            100f,
        )
    val clipped = ColorStopUtils.clipColorStops(fixed)

    assertThat(clipped.first().color).isEqualTo(Color.rgb(127, 0, 127))
    assertThat(clipped.first().position).isEqualTo(0f)
    assertThat(clipped.map { it.position }).allMatch { it != null && it >= 0f }
    assertThat(clipped.last().color).isEqualTo(Color.BLUE)
    assertThat(clipped.last().position).isEqualTo(0.65f)
  }

  // From WPT: linear-gradient(green -50%, blue -50%) and radial-gradient(green -50%, blue -50%).
  // https://github.com/web-platform-tests/wpt/blob/master/css/css-images/normalization-linear.html
  // https://github.com/web-platform-tests/wpt/blob/master/css/css-images/normalization-radial.html
  @Test
  fun testCoincidentStopsBelowRangeRenderLastColor() {
    val fixed =
        ColorStopUtils.getFixedColorStops(
            listOf(
                ColorStop(Color.GREEN, LengthPercentage(-50f, LengthPercentageType.PERCENT)),
                ColorStop(Color.BLUE, LengthPercentage(-50f, LengthPercentageType.PERCENT)),
            ),
            100f,
        )

    assertThat(ColorStopUtils.clipColorStops(fixed).map { it.color })
        .containsExactly(Color.BLUE, Color.BLUE)
  }

  // From WPT: linear-gradient(blue 150%, red 150%).
  // https://github.com/web-platform-tests/wpt/blob/master/css/css-images/normalization-linear-2.html
  @Test
  fun testCoincidentStopsAboveRangeRenderFirstColor() {
    val fixed =
        ColorStopUtils.getFixedColorStops(
            listOf(
                ColorStop(Color.BLUE, LengthPercentage(150f, LengthPercentageType.PERCENT)),
                ColorStop(Color.RED, LengthPercentage(150f, LengthPercentageType.PERCENT)),
            ),
            100f,
        )

    assertThat(ColorStopUtils.clipColorStops(fixed).map { it.color })
        .containsExactly(Color.BLUE, Color.BLUE)
  }

  // From WPT: radial-gradient(blue 150%, red 150%). Radial gradients keep stops past the ending
  // shape, and grow the radius to fit them.
  // https://github.com/web-platform-tests/wpt/blob/master/css/css-images/normalization-radial-2.html
  @Test
  fun testClipColorStopsKeepsStopsUpToCustomEnd() {
    val colorStops =
        listOf(ProcessedColorStop(Color.BLUE, 1.5f), ProcessedColorStop(Color.RED, 1.5f))

    assertThat(ColorStopUtils.clipColorStops(colorStops, end = 1.5f)).isSameAs(colorStops)
  }

  @Test
  fun testLengthPositionsOnZeroLengthGradientLineResolveToZero() {
    val fixed =
        ColorStopUtils.getFixedColorStops(
            listOf(
                ColorStop(Color.RED, LengthPercentage(10f, LengthPercentageType.POINT)),
                ColorStop(Color.BLUE, LengthPercentage(20f, LengthPercentageType.POINT)),
            ),
            0f,
        )

    assertThat(fixed.map { it.position }).containsExactly(0f, 0f)
  }

  @Test
  fun testGradientsParseNegativeColorStopPositions() {
    val colorStops =
        JavaOnlyArray.of(
            JavaOnlyMap.of("color", Color.RED, "position", "-50%"),
            JavaOnlyMap.of("color", Color.BLUE, "position", -20.0),
        )
    val context = RuntimeEnvironment.getApplication()

    val linear =
        LinearGradient.parse(
            JavaOnlyMap.of(
                "direction",
                JavaOnlyMap.of("type", "angle", "value", 90.0),
                "colorStops",
                colorStops,
            ),
            context,
        ) as LinearGradient
    val radial =
        RadialGradient.parse(
            JavaOnlyMap.of(
                "shape",
                "circle",
                "size",
                "farthest-corner",
                "position",
                JavaOnlyMap.of("top", "50%", "left", "50%"),
                "colorStops",
                colorStops,
            ),
            context,
        ) as RadialGradient

    for (stops in listOf(linear.colorStops, radial.colorStops)) {
      assertThat(stops[0].position?.type).isEqualTo(LengthPercentageType.PERCENT)
      assertThat(stops[0].position?.resolve(1f)).isEqualTo(-0.5f)
      assertThat(stops[1].position?.type).isEqualTo(LengthPercentageType.POINT)
      assertThat(stops[1].position?.resolve(0f)).isEqualTo(-20f)
    }
  }
}
