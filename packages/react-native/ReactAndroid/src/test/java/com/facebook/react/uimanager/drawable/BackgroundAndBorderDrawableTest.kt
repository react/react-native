/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.util.DisplayMetrics
import android.util.LayoutDirection
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.GraphicsMode

/** Tests for [BackgroundDrawable], [BackgroundImageDrawable] and [BorderDrawable] */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BackgroundAndBorderDrawableTest {

  private val context: Context = RuntimeEnvironment.getApplication()

  @Before
  fun setup() {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 2f })
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun backgroundKeepsItsGeometryWhenItsColorOrAlphaChanges() {
    val borderRadius = spy(roundedBy(8f))
    val drawable = background(borderRadius).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.backgroundColor = Color.RED
    drawable.alpha = 128

    val expected =
        background(roundedBy(8f)).withBounds(BOUNDS).apply {
          backgroundColor = Color.RED
          alpha = 128
        }
    assertDrawsLike(drawable, expected)
    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
  }

  @Test
  fun backgroundFollowsARadiusChangedInPlaceAndReassigned() {
    val borderRadius = unevenlyRoundedBy(8f)
    val drawable = background(borderRadius).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_TOP_LEFT_RADIUS, points(12f))
    drawable.borderRadius = borderRadius

    val expected =
        unevenlyRoundedBy(8f).apply { set(BorderRadiusProp.BORDER_TOP_LEFT_RADIUS, points(12f)) }
    assertDrawsLike(drawable, background(expected).withBounds(BOUNDS))
  }

  @Test
  fun backgroundFollowsBorderInsetsChangedInPlaceAndReassigned() {
    val borderInsets = BorderInsets()
    val drawable = background(roundedBy(8f), borderInsets).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderInsets.setBorderWidth(LogicalEdge.ALL, 3f)
    drawable.borderInsets = borderInsets

    assertDrawsLike(drawable, background(roundedBy(8f), insetBy(3f)).withBounds(BOUNDS))
  }

  @Test
  fun backgroundFollowsBoundsThatGrowFromEmpty() {
    val drawable = background(unevenlyRoundedBy(8f))
    drawable.draw(RecordingCanvas())

    drawable.bounds = BOUNDS

    assertDrawsLike(drawable, background(unevenlyRoundedBy(8f)).withBounds(BOUNDS))
  }

  @Test
  fun backgroundFollowsALayoutDirectionChange() {
    val drawable = background(startRoundedBy(8f)).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.layoutDirection = LayoutDirection.RTL

    val expected = background(startRoundedBy(8f)).withBounds(BOUNDS)
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun backgroundImageKeepsItsGeometryWhenItsLayersOrAlphaChange() {
    val borderRadius = spy(roundedBy(8f))
    val drawable = backgroundImage(borderRadius).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.backgroundImageLayers = listOf(gradientLayer(Color.GREEN, Color.BLACK))
    drawable.alpha = 128

    val expected =
        backgroundImage(roundedBy(8f), layers = listOf(gradientLayer(Color.GREEN, Color.BLACK)))
            .withBounds(BOUNDS)
            .apply { alpha = 128 }
    assertDrawsLike(drawable, expected)
    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
  }

  @Test
  fun backgroundImageFollowsARadiusChangedInPlaceAndReassigned() {
    val borderRadius = roundedBy(8f)
    val drawable = backgroundImage(borderRadius).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_RADIUS, points(4f))
    drawable.borderRadius = borderRadius

    assertDrawsLike(drawable, backgroundImage(roundedBy(4f)).withBounds(BOUNDS))
  }

  @Test
  fun backgroundImageFollowsBorderInsetsChangedInPlaceAndReassigned() {
    val borderInsets = BorderInsets()
    val drawable = backgroundImage(roundedBy(8f), borderInsets).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderInsets.setBorderWidth(LogicalEdge.ALL, 3f)
    drawable.borderInsets = borderInsets

    assertDrawsLike(drawable, backgroundImage(roundedBy(8f), insetBy(3f)).withBounds(BOUNDS))
  }

  @Test
  fun backgroundImageFollowsBoundsThatGrowFromEmpty() {
    val drawable = backgroundImage(unevenlyRoundedBy(8f))
    drawable.draw(RecordingCanvas())

    drawable.bounds = BOUNDS

    assertDrawsLike(drawable, backgroundImage(unevenlyRoundedBy(8f)).withBounds(BOUNDS))
  }

  @Test
  fun backgroundImageFollowsALayoutDirectionChange() {
    val drawable = backgroundImage(startRoundedBy(8f)).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.layoutDirection = LayoutDirection.RTL

    val expected = backgroundImage(startRoundedBy(8f)).withBounds(BOUNDS)
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun borderKeepsItsGeometryWhenItsColorAlphaOrStyleChanges() {
    val borderRadius = spy(roundedBy(8f))
    val borderInsets = spy(insetBy(2f))
    val drawable = border(borderRadius, borderInsets, Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.setBorderColor(LogicalEdge.ALL, Color.RED)
    drawable.alpha = 128
    drawable.borderStyle = BorderStyle.DASHED

    val expected =
        border(roundedBy(8f), insetBy(2f), Color.RED).withBounds(BOUNDS).apply {
          alpha = 128
          borderStyle = BorderStyle.DASHED
        }
    assertDrawsLike(drawable, expected)
    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
    verify(borderInsets, times(1)).resolve(any(), any())
  }

  @Test
  fun borderFollowsARadiusChangedInPlaceAndReassigned() {
    val borderRadius = roundedBy(8f)
    val drawable = border(borderRadius, insetBy(2f), Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_RADIUS, points(4f))
    drawable.borderRadius = borderRadius

    assertDrawsLike(drawable, border(roundedBy(4f), insetBy(2f), Color.BLUE).withBounds(BOUNDS))
  }

  @Test
  fun borderFollowsBorderInsetsChangedInPlaceAndReassigned() {
    val borderInsets = insetBy(2f)
    val drawable = border(roundedBy(8f), borderInsets, Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderInsets.setBorderWidth(LogicalEdge.ALL, 5f)
    drawable.borderInsets = borderInsets

    assertDrawsLike(drawable, border(roundedBy(8f), insetBy(5f), Color.BLUE).withBounds(BOUNDS))
  }

  @Test
  fun borderFollowsBoundsThatGrowFromEmpty() {
    val drawable = border(unevenlyRoundedBy(8f), insetBy(2f), Color.BLUE)
    drawable.draw(RecordingCanvas())

    drawable.bounds = BOUNDS

    assertDrawsLike(
        drawable,
        border(unevenlyRoundedBy(8f), insetBy(2f), Color.BLUE).withBounds(BOUNDS),
    )
  }

  @Test
  fun borderFollowsALayoutDirectionChange() {
    val drawable = border(startRoundedBy(8f), insetBy(2f), Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.layoutDirection = LayoutDirection.RTL

    val expected = border(startRoundedBy(8f), insetBy(2f), Color.BLUE).withBounds(BOUNDS)
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun borderFollowsAnEdgeColorThatBecomesVisible() {
    val drawable = border(roundedBy(8f), insetBy(4f), Color.TRANSPARENT).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.setBorderColor(LogicalEdge.ALL, Color.BLUE)
    drawable.setBorderColor(LogicalEdge.TOP, Color.RED)

    val expected =
        border(roundedBy(8f), insetBy(4f), Color.BLUE).withBounds(BOUNDS).apply {
          setBorderColor(LogicalEdge.TOP, Color.RED)
        }
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun uniformBorderKeepsItsGeometryWhenItsColorOrStyleChanges() {
    val borderRadius = spy(roundedBy(8f))
    val borderInsets = spy(insetBy(2f))
    val drawable = uniformBorder(borderRadius, 2f, Color.BLUE, borderInsets).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.setBorderColor(LogicalEdge.ALL, Color.RED)
    drawable.borderStyle = BorderStyle.DASHED

    val expected =
        uniformBorder(roundedBy(8f), 2f, Color.RED).withBounds(BOUNDS).apply {
          borderStyle = BorderStyle.DASHED
        }
    assertDrawsLike(drawable, expected)
    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
    verify(borderInsets, times(1)).resolve(any(), any())
  }

  @Test
  fun uniformBorderFollowsARadiusChangedInPlaceAndReassigned() {
    val borderRadius = unevenlyRoundedBy(8f)
    val drawable = uniformBorder(borderRadius, 2f, Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_TOP_LEFT_RADIUS, points(12f))
    drawable.borderRadius = borderRadius

    val expected =
        unevenlyRoundedBy(8f).apply { set(BorderRadiusProp.BORDER_TOP_LEFT_RADIUS, points(12f)) }
    assertDrawsLike(drawable, uniformBorder(expected, 2f, Color.BLUE).withBounds(BOUNDS))
  }

  @Test
  fun uniformBorderFollowsItsWidthChangedInPlaceAndReassigned() {
    val borderInsets = insetBy(2f)
    val drawable =
        uniformBorder(unevenlyRoundedBy(8f), 2f, Color.BLUE, borderInsets).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderInsets.setBorderWidth(LogicalEdge.ALL, 5f)
    drawable.setBorderWidth(Spacing.ALL, 5f.dpToPx())
    drawable.borderInsets = borderInsets

    assertDrawsLike(
        drawable,
        uniformBorder(unevenlyRoundedBy(8f), 5f, Color.BLUE).withBounds(BOUNDS),
    )
  }

  @Test
  fun uniformBorderFollowsBoundsThatGrowFromEmpty() {
    val drawable = uniformBorder(unevenlyRoundedBy(8f), 2f, Color.BLUE)
    drawable.draw(RecordingCanvas())

    drawable.bounds = BOUNDS

    assertDrawsLike(
        drawable,
        uniformBorder(unevenlyRoundedBy(8f), 2f, Color.BLUE).withBounds(BOUNDS),
    )
  }

  @Test
  fun uniformBorderFollowsALayoutDirectionChange() {
    val drawable = uniformBorder(startRoundedBy(8f), 2f, Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.layoutDirection = LayoutDirection.RTL

    val expected = uniformBorder(startRoundedBy(8f), 2f, Color.BLUE).withBounds(BOUNDS)
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun rectangularBorderKeepsItsGeometryWhenItsColorOrAlphaChanges() {
    val borderInsets = spy(insetBy(2f))
    val drawable = border(null, borderInsets, Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.setBorderColor(LogicalEdge.ALL, Color.RED)
    drawable.alpha = 128

    val expected = border(null, insetBy(2f), Color.RED).withBounds(BOUNDS).apply { alpha = 128 }
    assertDrawsLike(drawable, expected)
    verify(borderInsets, times(1)).resolve(any(), any())
  }

  @Test
  fun rectangularBorderFollowsBorderInsetsChangedInPlaceAndReassigned() {
    val borderInsets = insetBy(2f)
    val drawable = border(null, borderInsets, Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    borderInsets.setBorderWidth(LogicalEdge.ALL, 5f)
    drawable.borderInsets = borderInsets

    assertDrawsLike(drawable, border(null, insetBy(5f), Color.BLUE).withBounds(BOUNDS))
  }

  @Test
  fun rectangularBorderFollowsALayoutDirectionChange() {
    val drawable = border(null, insetBy(start = 1f, end = 4f), Color.BLUE).withBounds(BOUNDS)
    drawable.draw(RecordingCanvas())

    drawable.layoutDirection = LayoutDirection.RTL

    val expected = border(null, insetBy(start = 1f, end = 4f), Color.BLUE).withBounds(BOUNDS)
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun rectangularBorderDrawsTheSamePathOnEveryDraw() {
    val drawable = border(null, insetBy(2f), Color.BLUE).withBounds(BOUNDS)

    val firstDraw = RecordingCanvas().also { drawable.draw(it) }.geometry
    val secondDraw = RecordingCanvas().also { drawable.draw(it) }.geometry

    assertThat(firstDraw).isNotEmpty()
    assertThat(secondDraw).hasSameSizeAs(firstDraw)
    firstDraw.zip(secondDraw).forEach { (first, second) -> assertThat(second).isSameAs(first) }
  }

  private fun background(
      borderRadius: BorderRadiusStyle?,
      borderInsets: BorderInsets? = null,
  ): BackgroundDrawable =
      BackgroundDrawable(context, borderRadius, borderInsets).apply { backgroundColor = Color.BLUE }

  private fun backgroundImage(
      borderRadius: BorderRadiusStyle?,
      borderInsets: BorderInsets? = null,
      layers: List<BackgroundImageLayer> = listOf(gradientLayer(Color.RED, Color.BLUE)),
  ): BackgroundImageDrawable =
      BackgroundImageDrawable(context, borderRadius, borderInsets).apply {
        backgroundImageLayers = layers
      }

  private fun border(
      borderRadius: BorderRadiusStyle?,
      borderInsets: BorderInsets,
      color: Int,
  ): BorderDrawable =
      BorderDrawable(
              context = context,
              borderWidth = Spacing(0f),
              borderRadius = borderRadius,
              borderInsets = borderInsets,
              borderStyle = BorderStyle.SOLID,
          )
          .apply { setBorderColor(LogicalEdge.ALL, color) }

  private fun uniformBorder(
      borderRadius: BorderRadiusStyle?,
      width: Float,
      color: Int,
      borderInsets: BorderInsets = insetBy(width),
  ): BorderDrawable =
      BorderDrawable(
              context = context,
              borderWidth = Spacing(0f).apply { set(Spacing.ALL, width.dpToPx()) },
              borderRadius = borderRadius,
              borderInsets = borderInsets,
              borderStyle = BorderStyle.SOLID,
          )
          .apply { setBorderColor(LogicalEdge.ALL, color) }

  private fun gradientLayer(from: Int, to: Int): BackgroundImageLayer =
      checkNotNull(
          BackgroundImageLayer.parse(
              JavaOnlyMap.of(
                  "type",
                  "linear-gradient",
                  "direction",
                  JavaOnlyMap.of("type", "angle", "value", 90.0),
                  "colorStops",
                  JavaOnlyArray.of(JavaOnlyMap.of("color", from), JavaOnlyMap.of("color", to)),
              ),
              context,
          )
      )

  private fun points(value: Float): LengthPercentage =
      LengthPercentage(value, LengthPercentageType.POINT)

  private fun insetBy(width: Float): BorderInsets =
      BorderInsets().apply { setBorderWidth(LogicalEdge.ALL, width) }

  private fun insetBy(start: Float, end: Float): BorderInsets =
      BorderInsets().apply {
        setBorderWidth(LogicalEdge.START, start)
        setBorderWidth(LogicalEdge.END, end)
      }

  private fun roundedBy(radius: Float): BorderRadiusStyle =
      BorderRadiusStyle().apply { set(BorderRadiusProp.BORDER_RADIUS, points(radius)) }

  private fun unevenlyRoundedBy(radius: Float): BorderRadiusStyle =
      roundedBy(radius).apply { set(BorderRadiusProp.BORDER_BOTTOM_RIGHT_RADIUS, points(2f)) }

  private fun startRoundedBy(radius: Float): BorderRadiusStyle =
      BorderRadiusStyle().apply { set(BorderRadiusProp.BORDER_TOP_START_RADIUS, points(radius)) }

  private fun <T : Drawable> T.withBounds(bounds: Rect): T = apply { this.bounds = bounds }

  private fun assertDrawsLike(drawable: Drawable, expected: Drawable) {
    val drawn = RecordingCanvas().also { drawable.draw(it) }.calls
    assertThat(drawn).isNotEmpty()
    assertThat(drawn).isEqualTo(RecordingCanvas().also { expected.draw(it) }.calls)
    assertThat(pixelsOf(drawable).sameAs(pixelsOf(expected))).describedAs("pixels").isTrue()
  }

  private fun pixelsOf(drawable: Drawable): Bitmap =
      Bitmap.createBitmap(BOUNDS.width(), BOUNDS.height(), Bitmap.Config.ARGB_8888).also {
        drawable.draw(Canvas(it))
      }

  private companion object {
    val BOUNDS = Rect(0, 0, 100, 50)
  }
}
