/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.util.DisplayMetrics
import android.util.LayoutDirection
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.modules.i18nmanager.I18nUtil
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
import org.mockito.kotlin.any
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for [InsetBoxShadowDrawable] and [OutsetBoxShadowDrawable] */
@RunWith(RobolectricTestRunner::class)
class BoxShadowDrawableTest {

  private val context: Context = RuntimeEnvironment.getApplication()

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    setScreenDensity(2f)
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    I18nUtil.instance.swapLeftAndRightInRTL(context, true)
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
  fun insetShadowKeepsItsGeometryWhenItsAlphaOrColorFilterChanges() {
    val borderRadius = spy(roundedBy(8f))
    val drawable = insetShadow(borderRadius).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    drawable.alpha = 128
    drawable.colorFilter = PorterDuffColorFilter(Color.RED, PorterDuff.Mode.SRC_IN)
    drawable.draw(RecordingCanvas())

    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
  }

  @Test
  fun outsetShadowKeepsItsGeometryWhenItsAlphaOrColorFilterChanges() {
    val borderRadius = spy(roundedBy(8f))
    val drawable = outsetShadow(borderRadius).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    drawable.alpha = 128
    drawable.colorFilter = PorterDuffColorFilter(Color.RED, PorterDuff.Mode.SRC_IN)
    drawable.draw(RecordingCanvas())

    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
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

  @Test
  fun insetShadowFollowsADensityChange() {
    val drawable = insetShadow(roundedBy(8f), allEdgesBy(3f)).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    setScreenDensity(3f)

    val expected = insetShadow(roundedBy(8f), allEdgesBy(3f)).withBounds(Rect(0, 0, 100, 50))
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun outsetShadowFollowsADensityChange() {
    val drawable = outsetShadow(roundedBy(8f)).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    setScreenDensity(3f)

    assertDrawsLike(drawable, outsetShadow(roundedBy(8f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun insetShadowFollowsTheLeftAndRightSwapPreferenceInRtl() {
    val drawable = insetShadow(topLeftRoundedBy(8f), leftEdgeBy(3f)).withBounds(Rect(0, 0, 100, 50))
    drawable.layoutDirection = LayoutDirection.RTL
    drawable.draw(RecordingCanvas())

    I18nUtil.instance.swapLeftAndRightInRTL(context, false)

    val expected = insetShadow(topLeftRoundedBy(8f), leftEdgeBy(3f)).withBounds(Rect(0, 0, 100, 50))
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun outsetShadowFollowsTheLeftAndRightSwapPreferenceInRtl() {
    val drawable = outsetShadow(topLeftRoundedBy(8f)).withBounds(Rect(0, 0, 100, 50))
    drawable.layoutDirection = LayoutDirection.RTL
    drawable.draw(RecordingCanvas())

    I18nUtil.instance.swapLeftAndRightInRTL(context, false)

    val expected = outsetShadow(topLeftRoundedBy(8f)).withBounds(Rect(0, 0, 100, 50))
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun insetShadowInRtlKeepsItsGeometryAcrossDraws() {
    val borderRadius = spy(topLeftRoundedBy(8f))
    val drawable = insetShadow(borderRadius, leftEdgeBy(3f)).withBounds(Rect(0, 0, 100, 50))
    drawable.layoutDirection = LayoutDirection.RTL

    drawable.draw(RecordingCanvas())
    drawable.draw(RecordingCanvas())

    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
  }

  @Test
  fun outsetShadowInRtlKeepsItsGeometryAcrossDraws() {
    val borderRadius = spy(topLeftRoundedBy(8f))
    val drawable = outsetShadow(borderRadius).withBounds(Rect(0, 0, 100, 50))
    drawable.layoutDirection = LayoutDirection.RTL

    drawable.draw(RecordingCanvas())
    drawable.draw(RecordingCanvas())

    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
  }

  @Test
  fun rtlShadowsWithoutARadiusOrInsetsReadNoSwapPreference() {
    val countingContext = PreferenceCountingContext(context)
    val shadows =
        listOf(
            insetShadow(null, drawableContext = countingContext),
            outsetShadow(null, drawableContext = countingContext),
        )
    shadows.forEach {
      it.bounds = Rect(0, 0, 100, 50)
      it.layoutDirection = LayoutDirection.RTL
    }

    repeat(2) { shadows.forEach { it.draw(RecordingCanvas()) } }

    assertThat(countingContext.preferenceReads).isZero()
  }

  @Test
  fun ltrShadowsReadNoSwapPreference() {
    val countingContext = PreferenceCountingContext(context)
    val shadows =
        listOf(
            insetShadow(topLeftRoundedBy(8f), leftEdgeBy(3f), drawableContext = countingContext),
            outsetShadow(topLeftRoundedBy(8f), drawableContext = countingContext),
        )
    shadows.forEach { it.bounds = Rect(0, 0, 100, 50) }

    repeat(2) { shadows.forEach { it.draw(RecordingCanvas()) } }

    assertThat(countingContext.preferenceReads).isZero()
  }

  private fun setScreenDensity(density: Float) {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { this.density = density })
  }

  private fun insetShadow(
      borderRadius: BorderRadiusStyle?,
      borderInsets: BorderInsets? = null,
      drawableContext: Context = context,
  ): InsetBoxShadowDrawable =
      InsetBoxShadowDrawable(
          context = drawableContext,
          shadowColor = Color.BLACK,
          offsetX = 2f,
          offsetY = 3f,
          blurRadius = 0f,
          spread = 1f,
          borderInsets = borderInsets,
          borderRadius = borderRadius,
      )

  private fun outsetShadow(
      borderRadius: BorderRadiusStyle?,
      drawableContext: Context = context,
  ): OutsetBoxShadowDrawable =
      OutsetBoxShadowDrawable(
          context = drawableContext,
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

  private fun topLeftRoundedBy(radius: Float): BorderRadiusStyle =
      BorderRadiusStyle().apply { set(BorderRadiusProp.BORDER_TOP_LEFT_RADIUS, points(radius)) }

  private fun allEdgesBy(width: Float): BorderInsets =
      BorderInsets().apply { setBorderWidth(LogicalEdge.ALL, width) }

  private fun leftEdgeBy(width: Float): BorderInsets =
      BorderInsets().apply { setBorderWidth(LogicalEdge.LEFT, width) }

  private fun <T : Drawable> T.withBounds(bounds: Rect): T = apply { this.bounds = bounds }

  private fun assertDrawsTheSameGeometryObjectsOnEveryDraw(drawable: Drawable) {
    drawable.bounds = Rect(0, 0, 100, 50)

    val firstDraw = RecordingCanvas().also { drawable.draw(it) }.geometry
    val secondDraw = RecordingCanvas().also { drawable.draw(it) }.geometry

    assertThat(secondDraw).hasSameSizeAs(firstDraw)
    firstDraw.zip(secondDraw).forEach { (first, second) -> assertThat(second).isSameAs(first) }
  }

  private fun assertDrawsLike(drawable: Drawable, expected: Drawable) {
    assertThat(RecordingCanvas().also { drawable.draw(it) }.calls)
        .isEqualTo(RecordingCanvas().also { expected.draw(it) }.calls)
  }

  private class PreferenceCountingContext(base: Context) : ContextWrapper(base) {
    var preferenceReads = 0
      private set

    override fun getSharedPreferences(name: String?, mode: Int): SharedPreferences {
      preferenceReads += 1
      return super.getSharedPreferences(name, mode)
    }
  }

  /** Records each call a drawable makes as text, and every geometry object it hands the canvas. */
  private class RecordingCanvas : Canvas() {
    val calls = mutableListOf<String>()
    val geometry = mutableListOf<Any>()

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
      record("drawPath ${describe(path)}", path)
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
