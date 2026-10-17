/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Color
import android.graphics.Path
import android.graphics.Rect
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

private val TRANSLUCENT_RED = Color.argb(128, 255, 0, 0)

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

  @Test
  fun insetShadowFollowsEachShadowValueChangedAloneInPlace() {
    assertFollowsEachChangeAlone(
        { insetShadow(roundedBy(8f)) },
        InPlaceChange("shadowColor", { it.shadowColor = Color.RED }) {
          insetShadow(roundedBy(8f), shadowColor = Color.RED)
        },
        InPlaceChange("offsetX", { it.offsetX = -4f }) {
          insetShadow(roundedBy(8f), offsetX = -4f)
        },
        InPlaceChange("offsetY", { it.offsetY = 5f }) { insetShadow(roundedBy(8f), offsetY = 5f) },
        InPlaceChange("blurRadius", { it.blurRadius = 4f }) {
          insetShadow(roundedBy(8f), blurRadius = 4f)
        },
        InPlaceChange("spread", { it.spread = 3f }) { insetShadow(roundedBy(8f), spread = 3f) },
    )
  }

  @Test
  fun outsetShadowFollowsEachShadowValueChangedAloneInPlace() {
    assertFollowsEachChangeAlone(
        { outsetShadow(roundedBy(8f)) },
        InPlaceChange("shadowColor", { it.shadowColor = Color.RED }) {
          outsetShadow(roundedBy(8f), shadowColor = Color.RED)
        },
        InPlaceChange("offsetX", { it.offsetX = -4f }) {
          outsetShadow(roundedBy(8f), offsetX = -4f)
        },
        InPlaceChange("offsetY", { it.offsetY = 5f }) { outsetShadow(roundedBy(8f), offsetY = 5f) },
        InPlaceChange("blurRadius", { it.blurRadius = 4f }) {
          outsetShadow(roundedBy(8f), blurRadius = 4f)
        },
        InPlaceChange("spread", { it.spread = 3f }) { outsetShadow(roundedBy(8f), spread = 3f) },
    )
  }

  @Test
  fun insetShadowLosesItsBlurInPlace() {
    val drawable = insetShadow(roundedBy(8f), blurRadius = 4f).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    drawable.blurRadius = 0f

    assertDrawsLike(drawable, insetShadow(roundedBy(8f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun insetShadowColorChangedInPlaceKeepsTheDrawableAlpha() {
    val drawable = insetShadow(null).withBounds(Rect(0, 0, 100, 50)).apply { alpha = 102 }

    drawable.shadowColor = TRANSLUCENT_RED

    assertDrawsLike(
        drawable,
        insetShadow(null, shadowColor = TRANSLUCENT_RED).withBounds(Rect(0, 0, 100, 50)).apply {
          alpha = 102
        },
    )
    assertDrawsUnlike(
        drawable,
        insetShadow(null, shadowColor = TRANSLUCENT_RED).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun outsetShadowColorChangedInPlaceKeepsTheDrawableAlpha() {
    val drawable = outsetShadow(null).withBounds(Rect(0, 0, 100, 50)).apply { alpha = 102 }

    drawable.shadowColor = TRANSLUCENT_RED

    assertDrawsLike(
        drawable,
        outsetShadow(null, shadowColor = TRANSLUCENT_RED).withBounds(Rect(0, 0, 100, 50)).apply {
          alpha = 102
        },
    )
    assertDrawsUnlike(
        drawable,
        outsetShadow(null, shadowColor = TRANSLUCENT_RED).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun insetShadowValuesSetToWhatTheyAlreadyAreDoNotInvalidate() {
    val callback = CountingCallback()
    val drawable = insetShadow(roundedBy(8f), blurRadius = 4f).apply { this.callback = callback }

    drawable.shadowColor = Color.BLACK
    drawable.offsetX = 2f
    drawable.offsetY = 3f
    drawable.blurRadius = 4f
    drawable.spread = 1f
    assertThat(callback.invalidations).isZero()

    drawable.spread = 2f
    assertThat(callback.invalidations).isEqualTo(1)
  }

  @Test
  fun outsetShadowValuesSetToWhatTheyAlreadyAreDoNotInvalidate() {
    val callback = CountingCallback()
    val drawable = outsetShadow(roundedBy(8f), blurRadius = 4f).apply { this.callback = callback }

    drawable.shadowColor = Color.BLACK
    drawable.offsetX = 2f
    drawable.offsetY = 3f
    drawable.blurRadius = 4f
    drawable.spread = 1f
    assertThat(callback.invalidations).isZero()

    drawable.spread = 2f
    assertThat(callback.invalidations).isEqualTo(1)
  }

  private fun insetShadow(
      borderRadius: BorderRadiusStyle?,
      borderInsets: BorderInsets? = null,
      blurRadius: Float = 0f,
      shadowColor: Int = Color.BLACK,
      offsetX: Float = 2f,
      offsetY: Float = 3f,
      spread: Float = 1f,
  ): InsetBoxShadowDrawable =
      InsetBoxShadowDrawable(
          context = context,
          shadowColor = shadowColor,
          offsetX = offsetX,
          offsetY = offsetY,
          blurRadius = blurRadius,
          spread = spread,
          borderInsets = borderInsets,
          borderRadius = borderRadius,
      )

  private fun outsetShadow(
      borderRadius: BorderRadiusStyle?,
      blurRadius: Float = 0f,
      shadowColor: Int = Color.BLACK,
      offsetX: Float = 2f,
      offsetY: Float = 3f,
      spread: Float = 1f,
  ): OutsetBoxShadowDrawable =
      OutsetBoxShadowDrawable(
          context = context,
          shadowColor = shadowColor,
          offsetX = offsetX,
          offsetY = offsetY,
          blurRadius = blurRadius,
          spread = spread,
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

  private fun assertDrawsUnlike(drawable: Drawable, other: Drawable) {
    assertThat(RecordingCanvas().also { drawable.draw(it) }.calls)
        .isNotEqualTo(RecordingCanvas().also { other.draw(it) }.calls)
  }

  /** One shadow value set on a drawable that already drew, and a drawable built with it. */
  private class InPlaceChange<T : Drawable>(
      val value: String,
      val change: (T) -> Unit,
      val expected: () -> T,
  )

  private fun <T : Drawable> assertFollowsEachChangeAlone(
      build: () -> T,
      vararg changes: InPlaceChange<T>,
  ) {
    for (inPlaceChange in changes) {
      val drawable = build().withBounds(Rect(0, 0, 100, 50))
      drawable.draw(RecordingCanvas())

      inPlaceChange.change(drawable)

      val expected = inPlaceChange.expected().withBounds(Rect(0, 0, 100, 50))
      assertThat(RecordingCanvas().also { drawable.draw(it) }.calls)
          .describedAs(inPlaceChange.value)
          .isEqualTo(RecordingCanvas().also { expected.draw(it) }.calls)
    }
  }

  /** Counts the invalidations a drawable asks its callback for. */
  private class CountingCallback : Drawable.Callback {
    var invalidations = 0

    override fun invalidateDrawable(who: Drawable) {
      invalidations++
    }

    override fun scheduleDrawable(who: Drawable, what: Runnable, `when`: Long) = Unit

    override fun unscheduleDrawable(who: Drawable, what: Runnable) = Unit
  }
}
