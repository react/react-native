/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.util.DisplayMetrics
import android.util.LayoutDirection
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.LogicalEdge
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for [InsetBoxShadowDrawable] and [OutsetBoxShadowDrawable] */
@RunWith(RobolectricTestRunner::class)
class BoxShadowDrawableTest {

  private val context: Context = RuntimeEnvironment.getApplication()

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 2f })
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun roundedInsetShadowDrawsTheSameGeometryObjectsOnEveryDraw() {
    assertDrawsTheSameGeometryObjectsOnEveryDraw(insetShadow(roundedBy(8f)))
  }

  @Test
  fun rectangularInsetShadowDrawsTheSameGeometryObjectsOnEveryDraw() {
    assertDrawsTheSameGeometryObjectsOnEveryDraw(insetShadow(null))
  }

  @Test
  fun blurredRoundedInsetShadowDrawsTheSamePathOnEveryDraw() {
    assertDrawsTheSamePathOnEveryDraw(insetShadow(roundedBy(8f), blurRadius = 4f))
  }

  @Test
  fun blurredRectangularInsetShadowDrawsTheSamePathOnEveryDraw() {
    assertDrawsTheSamePathOnEveryDraw(insetShadow(null, blurRadius = 4f))
  }

  @Test
  fun unblurredInsetShadowDrawsADoubleRoundRect() {
    val calls =
        RecordingCanvas()
            .also { insetShadow(roundedBy(8f)).withBounds(Rect(0, 0, 100, 50)).draw(it) }
            .calls

    assertThat(calls).anyMatch { it.startsWith("drawDoubleRoundRect") }
    assertThat(calls).noneMatch { it.startsWith("drawPath") }
  }

  @Test
  fun roundedOutsetShadowDrawsTheSameGeometryObjectsOnEveryDraw() {
    assertDrawsTheSameGeometryObjectsOnEveryDraw(outsetShadow(roundedBy(8f)))
  }

  @Test
  fun rectangularOutsetShadowDrawsTheSameGeometryObjectsOnEveryDraw() {
    assertDrawsTheSameGeometryObjectsOnEveryDraw(outsetShadow(null))
  }

  @Test
  fun insetShadowFollowsBoundsThatGrowFromEmpty() {
    val drawable = insetShadow(roundedBy(8f))
    drawable.draw(RecordingCanvas())

    drawable.bounds = Rect(0, 0, 100, 50)

    assertDrawsLike(drawable, insetShadow(roundedBy(8f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun blurredInsetShadowFollowsBoundsThatGrowFromEmpty() {
    val drawable = insetShadow(roundedBy(8f), blurRadius = 4f)
    drawable.draw(RecordingCanvas())

    drawable.bounds = Rect(0, 0, 100, 50)

    assertDrawsLike(
        drawable,
        insetShadow(roundedBy(8f), blurRadius = 4f).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun blurredInsetShadowFollowsARadiusChangedInPlaceAndInvalidated() {
    val borderRadius = roundedBy(8f)
    val drawable = insetShadow(borderRadius, blurRadius = 4f).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_RADIUS, points(4f))
    drawable.invalidateSelf()

    assertDrawsLike(
        drawable,
        insetShadow(roundedBy(4f), blurRadius = 4f).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun outsetShadowFollowsBoundsThatGrowFromEmpty() {
    val drawable = outsetShadow(roundedBy(8f))
    drawable.draw(RecordingCanvas())

    drawable.bounds = Rect(0, 0, 100, 50)

    assertDrawsLike(drawable, outsetShadow(roundedBy(8f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun insetShadowFollowsARadiusChangedInPlaceAndReassigned() {
    val borderRadius = roundedBy(8f)
    val drawable = insetShadow(borderRadius).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_RADIUS, points(4f))
    drawable.borderRadius = borderRadius

    assertDrawsLike(drawable, insetShadow(roundedBy(4f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun outsetShadowFollowsARadiusChangedInPlaceAndReassigned() {
    val borderRadius = roundedBy(8f)
    val drawable = outsetShadow(borderRadius).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_RADIUS, points(4f))
    drawable.borderRadius = borderRadius

    assertDrawsLike(drawable, outsetShadow(roundedBy(4f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun insetShadowFollowsARadiusChangedInPlaceAndInvalidated() {
    val borderRadius = roundedBy(8f)
    val drawable = insetShadow(borderRadius).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_RADIUS, points(4f))
    drawable.invalidateSelf()

    assertDrawsLike(drawable, insetShadow(roundedBy(4f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun outsetShadowFollowsARadiusChangedInPlaceAndInvalidated() {
    val borderRadius = roundedBy(8f)
    val drawable = outsetShadow(borderRadius).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_RADIUS, points(4f))
    drawable.invalidateSelf()

    assertDrawsLike(drawable, outsetShadow(roundedBy(4f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun insetShadowFollowsBorderInsetsChangedInPlaceAndReassigned() {
    val borderInsets = BorderInsets()
    val drawable = insetShadow(null, borderInsets).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    borderInsets.setBorderWidth(LogicalEdge.ALL, 3f)
    drawable.borderInsets = borderInsets

    val expectedInsets = BorderInsets().apply { setBorderWidth(LogicalEdge.ALL, 3f) }
    assertDrawsLike(drawable, insetShadow(null, expectedInsets).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun insetShadowFollowsALayoutDirectionChange() {
    val drawable = insetShadow(startRoundedBy(8f)).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    drawable.layoutDirection = LayoutDirection.RTL

    val expected = insetShadow(startRoundedBy(8f)).withBounds(Rect(0, 0, 100, 50))
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun outsetShadowFollowsALayoutDirectionChange() {
    val drawable = outsetShadow(startRoundedBy(8f)).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    drawable.layoutDirection = LayoutDirection.RTL

    val expected = outsetShadow(startRoundedBy(8f)).withBounds(Rect(0, 0, 100, 50))
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  private fun insetShadow(
      borderRadius: BorderRadiusStyle?,
      borderInsets: BorderInsets? = null,
      blurRadius: Float = 0f,
  ): InsetBoxShadowDrawable =
      InsetBoxShadowDrawable(
          context = context,
          shadowColor = Color.BLACK,
          offsetX = 2f,
          offsetY = 3f,
          blurRadius = blurRadius,
          spread = 1f,
          borderInsets = borderInsets,
          borderRadius = borderRadius,
      )

  private fun outsetShadow(borderRadius: BorderRadiusStyle?): OutsetBoxShadowDrawable =
      OutsetBoxShadowDrawable(
          context = context,
          shadowColor = Color.BLACK,
          offsetX = 2f,
          offsetY = 3f,
          blurRadius = 0f,
          spread = 1f,
          borderRadius = borderRadius,
      )

  private fun points(value: Float): LengthPercentage =
      LengthPercentage(value, LengthPercentageType.POINT)

  private fun roundedBy(radius: Float): BorderRadiusStyle =
      BorderRadiusStyle().apply { set(BorderRadiusProp.BORDER_RADIUS, points(radius)) }

  private fun startRoundedBy(radius: Float): BorderRadiusStyle =
      BorderRadiusStyle().apply { set(BorderRadiusProp.BORDER_TOP_START_RADIUS, points(radius)) }

  private fun <T : Drawable> T.withBounds(bounds: Rect): T = apply { this.bounds = bounds }

  private fun assertDrawsTheSameGeometryObjectsOnEveryDraw(drawable: Drawable) {
    drawable.bounds = Rect(0, 0, 100, 50)

    val firstDraw = RecordingCanvas().also { drawable.draw(it) }.geometry
    val secondDraw = RecordingCanvas().also { drawable.draw(it) }.geometry

    assertThat(secondDraw).hasSameSizeAs(firstDraw)
    firstDraw.zip(secondDraw).forEach { (first, second) -> assertThat(second).isSameAs(first) }
  }

  private fun assertDrawsTheSamePathOnEveryDraw(drawable: Drawable) {
    drawable.bounds = Rect(0, 0, 100, 50)

    val firstDraw = RecordingCanvas().also { drawable.draw(it) }.drawnPaths
    val secondDraw = RecordingCanvas().also { drawable.draw(it) }.drawnPaths

    assertThat(firstDraw).hasSize(1)
    assertThat(secondDraw).hasSize(1)
    assertThat(secondDraw.single()).isSameAs(firstDraw.single())
    assertThat(firstDraw.single().fillType).isEqualTo(Path.FillType.EVEN_ODD)
  }

  private fun assertDrawsLike(drawable: Drawable, expected: Drawable) {
    assertThat(RecordingCanvas().also { drawable.draw(it) }.calls)
        .isEqualTo(RecordingCanvas().also { expected.draw(it) }.calls)
  }

  /** Records each call a drawable makes as text, and every geometry object it hands the canvas. */
  private class RecordingCanvas : Canvas() {
    val calls = mutableListOf<String>()
    val geometry = mutableListOf<Any>()
    val drawnPaths = mutableListOf<Path>()

    override fun clipPath(path: Path): Boolean {
      record("clipPath ${describe(path)}", path)
      return true
    }

    override fun clipOutPath(path: Path): Boolean {
      record("clipOutPath ${describe(path)}", path)
      return true
    }

    override fun clipRect(rect: RectF): Boolean {
      record("clipRect $rect", rect)
      return true
    }

    override fun clipOutRect(rect: Rect): Boolean {
      record("clipOutRect $rect", rect)
      return true
    }

    override fun drawPath(path: Path, paint: Paint) {
      drawnPaths.add(path)
      record("drawPath ${path.fillType} ${describe(path)}", path)
    }

    override fun drawRect(rect: RectF, paint: Paint) {
      record("drawRect $rect", rect)
    }

    override fun drawDoubleRoundRect(
        outer: RectF,
        outerRadii: FloatArray,
        inner: RectF,
        innerRadii: FloatArray,
        paint: Paint,
    ) {
      record(
          "drawDoubleRoundRect $outer ${outerRadii.toList()} $inner ${innerRadii.toList()}",
          outer,
          outerRadii,
          inner,
          innerRadii,
      )
    }

    private fun record(call: String, vararg drawnGeometry: Any) {
      calls.add(call)
      geometry.addAll(drawnGeometry)
    }

    private fun describe(path: Path): String = path.approximate(0.5f).toList().toString()
  }
}
