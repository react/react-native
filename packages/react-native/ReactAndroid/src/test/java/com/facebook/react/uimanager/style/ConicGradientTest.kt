/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.DisplayMetrics
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.data.Offset.offset
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ConicGradientTest {
  @Before
  fun setUp() {
    setDensity(1f)
  }

  private fun setDensity(density: Float) {
    val metrics = DisplayMetrics().apply { this.density = density }
    DisplayMetricsHolder.setScreenDisplayMetrics(metrics)
  }

  private fun percent(value: Float) = LengthPercentage(value, LengthPercentageType.PERCENT)

  private fun point(value: Float) = LengthPercentage(value, LengthPercentageType.POINT)

  private fun gradient(
      from: Float = 0f,
      position: RadialGradient.Position = RadialGradient.Position(null, null, null, null),
  ) =
      ConicGradient(
          from,
          position,
          listOf(
              ColorStop(Color.RED, percent(0f)),
              ColorStop(Color.RED, percent(12.5f)),
              ColorStop(Color.BLUE, percent(12.5f)),
              ColorStop(Color.BLUE, percent(50f)),
              ColorStop(Color.GREEN, percent(50f)),
              ColorStop(Color.GREEN, percent(100f)),
          ),
      )

  private fun render(gradient: Gradient, width: Int, height: Int): Bitmap {
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val paint = Paint().apply { shader = gradient.getShader(width.toFloat(), height.toFloat()) }
    Canvas(bitmap).drawPaint(paint)
    return bitmap
  }

  private fun assertColor(bitmap: Bitmap, x: Int, y: Int, expected: Int) {
    val actual = bitmap.getPixel(x, y)
    assertThat(Color.red(actual))
        .describedAs("red at (%s, %s)", x, y)
        .isCloseTo(Color.red(expected), offset(10))
    assertThat(Color.green(actual))
        .describedAs("green at (%s, %s)", x, y)
        .isCloseTo(Color.green(expected), offset(10))
    assertThat(Color.blue(actual))
        .describedAs("blue at (%s, %s)", x, y)
        .isCloseTo(Color.blue(expected), offset(10))
    assertThat(Color.alpha(actual))
        .describedAs("alpha at (%s, %s)", x, y)
        .isEqualTo(Color.alpha(expected))
  }

  private fun assertSectors(bitmap: Bitmap, x: Int, y: Int) {
    assertColor(bitmap, x + 4, y - 7, Color.RED)
    assertColor(bitmap, x + 7, y - 4, Color.BLUE)
    assertColor(bitmap, x + 6, y + 6, Color.BLUE)
    assertColor(bitmap, x - 6, y + 6, Color.GREEN)
    assertColor(bitmap, x - 6, y - 6, Color.GREEN)
  }

  @Test
  fun preservesAnglesOnSquareWideAndTallViews() {
    assertSectors(render(gradient(), 120, 120), 60, 60)
    assertSectors(render(gradient(), 240, 120), 120, 60)
    assertSectors(render(gradient(), 120, 240), 60, 120)
    assertSectors(render(gradient(), 600, 30), 300, 15)
    assertSectors(render(gradient(), 30, 600), 15, 300)
  }

  @Test
  fun rotatesClockwiseAndAcceptsNegativeAndMultiTurnAngles() {
    for (angle in listOf(90f, -270f, 450f)) {
      val bitmap = render(gradient(from = angle), 240, 120)
      assertColor(bitmap, 127, 64, Color.RED)
      assertColor(bitmap, 124, 67, Color.BLUE)
      assertColor(bitmap, 114, 54, Color.GREEN)
    }
  }

  @Test
  fun resolvesRightAndBottomOffsetsInDensityIndependentPixels() {
    setDensity(2f)
    val position = RadialGradient.Position(null, null, point(10f), point(20f))
    assertSectors(render(gradient(position = position), 240, 120), 220, 80)
  }

  @Test
  fun doesNotApplyDensityToPercentageOffsets() {
    setDensity(3f)
    val position = RadialGradient.Position(null, null, percent(25f), percent(25f))
    assertSectors(render(gradient(position = position), 240, 120), 180, 90)
  }

  @Test
  fun centersTheUnspecifiedAxis() {
    val rightOnly = RadialGradient.Position(null, null, point(10f), null)
    val bottomOnly = RadialGradient.Position(null, null, null, point(20f))
    assertSectors(render(gradient(position = rightOnly), 240, 120), 230, 60)
    assertSectors(render(gradient(position = bottomOnly), 240, 120), 120, 100)
  }

  @Test
  fun recalculatesPercentagePositionsWhenResized() {
    val value = gradient(position = RadialGradient.Position(percent(75f), percent(25f), null, null))
    assertSectors(render(value, 240, 120), 60, 90)
    assertSectors(render(value, 120, 240), 30, 180)
  }

  private fun parsePosition(position: JavaOnlyMap): Gradient {
    val map =
        JavaOnlyMap.of(
            "from",
            0.0,
            "position",
            position,
            "colorStops",
            JavaOnlyArray.of(
                JavaOnlyMap.of("color", Color.RED, "position", "0%"),
                JavaOnlyMap.of("color", Color.RED, "position", "12.5%"),
                JavaOnlyMap.of("color", Color.BLUE, "position", "12.5%"),
                JavaOnlyMap.of("color", Color.BLUE, "position", "50%"),
                JavaOnlyMap.of("color", Color.GREEN, "position", "50%"),
                JavaOnlyMap.of("color", Color.GREEN, "position", "100%"),
            ),
        )
    val parsed = ConicGradient.parse(map, RuntimeEnvironment.getApplication())
    assertThat(parsed).isInstanceOf(ConicGradient::class.java)
    return requireNotNull(parsed)
  }

  @Test
  fun parsesEdgeOffsetsFromNativeProps() {
    val parsed = parsePosition(JavaOnlyMap.of("right", 10.0, "bottom", 20.0))
    assertSectors(render(parsed, 240, 120), 230, 100)
  }

  @Test
  fun parsesNegativePointOffsetsOnEveryEdge() {
    setDensity(2f)
    val left = render(parsePosition(JavaOnlyMap.of("left", -20.0)), 240, 120)
    val top = render(parsePosition(JavaOnlyMap.of("top", -20.0)), 240, 120)
    val right = render(parsePosition(JavaOnlyMap.of("right", -20.0)), 240, 120)
    val bottom = render(parsePosition(JavaOnlyMap.of("bottom", -20.0)), 240, 120)
    assertColor(left, 10, 20, Color.BLUE)
    assertColor(top, 150, 10, Color.BLUE)
    assertColor(right, 230, 20, Color.GREEN)
    assertColor(bottom, 160, 115, Color.RED)
  }

  @Test
  fun parsesNegativePercentagesWithoutApplyingDensity() {
    setDensity(3f)
    val left = render(parsePosition(JavaOnlyMap.of("left", "-10%")), 240, 120)
    val top = render(parsePosition(JavaOnlyMap.of("top", "-10%")), 240, 120)
    val right = render(parsePosition(JavaOnlyMap.of("right", "-10%")), 240, 120)
    val bottom = render(parsePosition(JavaOnlyMap.of("bottom", "-20%")), 240, 120)
    assertColor(left, 10, 20, Color.RED)
    assertColor(top, 150, 10, Color.BLUE)
    assertColor(right, 230, 20, Color.GREEN)
    assertColor(bottom, 140, 110, Color.RED)
    assertColor(bottom, 160, 110, Color.BLUE)
  }

  @Test
  fun rendersCenterAboveAndLeftOfTheViewFromNativeProps() {
    val parsed = parsePosition(JavaOnlyMap.of("left", -20.0, "top", -20.0))
    val bitmap = render(parsed, 240, 120)
    for ((x, y) in listOf(0 to 0, 239 to 0, 0 to 119, 239 to 119, 120 to 60)) {
      assertColor(bitmap, x, y, Color.BLUE)
    }
  }

  @Test
  fun supportsZeroSizedShaderRequests() {
    for ((width, height) in listOf(0f to 0f, 0f to 100f, 100f to 0f)) {
      assertThat(gradient().getShader(width, height)).isNotNull()
    }
  }
}
