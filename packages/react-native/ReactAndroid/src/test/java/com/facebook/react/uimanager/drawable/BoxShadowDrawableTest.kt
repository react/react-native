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
import android.graphics.MaskFilter
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

private val TRANSLUCENT_RED = Color.argb(128, 255, 0, 0)

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
  fun blurredInsetShadowFollowsARadiusChangedInPlaceAndReassigned() {
    val borderRadius = roundedBy(8f)
    val drawable = insetShadow(borderRadius, blurRadius = 4f).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    borderRadius.set(BorderRadiusProp.BORDER_RADIUS, points(4f))
    drawable.borderRadius = borderRadius

    assertDrawsLike(
        drawable,
        insetShadow(roundedBy(4f), blurRadius = 4f).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun blurredInsetShadowFollowsADensityChange() {
    val drawable = insetShadow(roundedBy(8f), blurRadius = 4f).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    setScreenDensity(3f)

    assertDrawsLike(
        drawable,
        insetShadow(roundedBy(8f), blurRadius = 4f).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun blurredInsetShadowFollowsTheLeftAndRightSwapPreferenceInRtl() {
    val drawable =
        insetShadow(topLeftRoundedBy(8f), leftEdgeBy(3f), blurRadius = 4f)
            .withBounds(Rect(0, 0, 100, 50))
    drawable.layoutDirection = LayoutDirection.RTL
    drawable.draw(RecordingCanvas())

    I18nUtil.instance.swapLeftAndRightInRTL(context, false)

    val expected =
        insetShadow(topLeftRoundedBy(8f), leftEdgeBy(3f), blurRadius = 4f)
            .withBounds(Rect(0, 0, 100, 50))
    expected.layoutDirection = LayoutDirection.RTL
    assertDrawsLike(drawable, expected)
  }

  @Test
  fun insetShadowWhoseSpreadPassesHalfItsHeightDrawsLikeOneWhoseSpreadPassesItsWidth() {
    assertDrawsLike(
        insetShadow(null, spread = 15f).withBounds(Rect(0, 0, 100, 50)),
        insetShadow(null, spread = 60f).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun blurredInsetShadowWhoseSpreadPassesHalfItsHeightDrawsLikeOneWhoseSpreadPassesItsWidth() {
    assertDrawsLike(
        insetShadow(null, blurRadius = 4f, spread = 15f).withBounds(Rect(0, 0, 100, 50)),
        insetShadow(null, blurRadius = 4f, spread = 60f).withBounds(Rect(0, 0, 100, 50)),
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
  fun insetShadowKeepsItsGeometryWhenItsColorAlphaOrColorFilterChanges() {
    assertKeepsItsGeometryThrough({ insetShadow(it) }) {
      it.setShadowValues(shadowColor = Color.RED)
      it.alpha = 128
      it.colorFilter = PorterDuffColorFilter(Color.BLUE, PorterDuff.Mode.SRC_IN)
    }
  }

  @Test
  fun blurredInsetShadowKeepsItsGeometryWhenItsColorAlphaOrColorFilterChanges() {
    assertKeepsItsGeometryThrough({ insetShadow(it, blurRadius = 4f) }) {
      it.setShadowValues(shadowColor = Color.RED)
      it.alpha = 128
      it.colorFilter = PorterDuffColorFilter(Color.BLUE, PorterDuff.Mode.SRC_IN)
    }
  }

  @Test
  fun outsetShadowKeepsItsGeometryWhenItsColorAlphaOrColorFilterChanges() {
    assertKeepsItsGeometryThrough({ outsetShadow(it, blurRadius = 4f) }) {
      it.setShadowValues(shadowColor = Color.RED)
      it.alpha = 128
      it.colorFilter = PorterDuffColorFilter(Color.BLUE, PorterDuff.Mode.SRC_IN)
    }
  }

  @Test
  fun outsetShadowKeepsItsGeometryWhenItsBlurChanges() {
    assertKeepsItsGeometryThrough({ outsetShadow(it, blurRadius = 4f) }) {
      it.setShadowValues(blurRadius = 6f)
    }
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

  @Test
  fun insetShadowFollowsEachShadowValueChangedAloneInPlace() {
    assertFollowsEachChangeAlone(
        { insetShadow(roundedBy(8f)) },
        InPlaceChange("shadowColor", { it.setShadowValues(shadowColor = Color.RED) }) {
          insetShadow(roundedBy(8f), shadowColor = Color.RED)
        },
        InPlaceChange("offsetX", { it.setShadowValues(offsetX = -4f) }) {
          insetShadow(roundedBy(8f), offsetX = -4f)
        },
        InPlaceChange("offsetY", { it.setShadowValues(offsetY = 5f) }) {
          insetShadow(roundedBy(8f), offsetY = 5f)
        },
        InPlaceChange("blurRadius", { it.setShadowValues(blurRadius = 4f) }) {
          insetShadow(roundedBy(8f), blurRadius = 4f)
        },
        InPlaceChange("spread", { it.setShadowValues(spread = 3f) }) {
          insetShadow(roundedBy(8f), spread = 3f)
        },
    )
  }

  @Test
  fun outsetShadowFollowsEachShadowValueChangedAloneInPlace() {
    assertFollowsEachChangeAlone(
        { outsetShadow(roundedBy(8f)) },
        InPlaceChange("shadowColor", { it.setShadowValues(shadowColor = Color.RED) }) {
          outsetShadow(roundedBy(8f), shadowColor = Color.RED)
        },
        InPlaceChange("offsetX", { it.setShadowValues(offsetX = -4f) }) {
          outsetShadow(roundedBy(8f), offsetX = -4f)
        },
        InPlaceChange("offsetY", { it.setShadowValues(offsetY = 5f) }) {
          outsetShadow(roundedBy(8f), offsetY = 5f)
        },
        InPlaceChange("blurRadius", { it.setShadowValues(blurRadius = 4f) }) {
          outsetShadow(roundedBy(8f), blurRadius = 4f)
        },
        InPlaceChange("spread", { it.setShadowValues(spread = 3f) }) {
          outsetShadow(roundedBy(8f), spread = 3f)
        },
    )
  }

  @Test
  fun insetShadowLosesItsBlurInPlace() {
    val drawable = insetShadow(roundedBy(8f), blurRadius = 4f).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    drawable.setShadowValues(blurRadius = 0f)

    assertDrawsLike(drawable, insetShadow(roundedBy(8f)).withBounds(Rect(0, 0, 100, 50)))
  }

  @Test
  fun insetShadowBlurFollowsADensityChange() {
    val drawable = insetShadow(roundedBy(8f), blurRadius = 0.4f).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    setScreenDensity(3f)

    assertDrawsLike(
        drawable,
        insetShadow(roundedBy(8f), blurRadius = 0.4f).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun outsetShadowBlurFollowsADensityChange() {
    val drawable = outsetShadow(roundedBy(8f), blurRadius = 0.4f).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    setScreenDensity(3f)

    assertDrawsLike(
        drawable,
        outsetShadow(roundedBy(8f), blurRadius = 0.4f).withBounds(Rect(0, 0, 100, 50)),
    )
  }

  @Test
  fun insetShadowKeepsItsMaskFilterAcrossDraws() {
    assertKeepsItsMaskFilterAcrossDraws(insetShadow(roundedBy(8f), blurRadius = 4f))
  }

  @Test
  fun outsetShadowKeepsItsMaskFilterAcrossDraws() {
    assertKeepsItsMaskFilterAcrossDraws(outsetShadow(roundedBy(8f), blurRadius = 4f))
  }

  @Test
  fun insetShadowRebuildsItsMaskFilterAfterADensityChange() {
    assertRebuildsItsMaskFilterAfterADensityChange(insetShadow(roundedBy(8f), blurRadius = 4f))
  }

  @Test
  fun outsetShadowRebuildsItsMaskFilterAfterADensityChange() {
    assertRebuildsItsMaskFilterAfterADensityChange(outsetShadow(roundedBy(8f), blurRadius = 4f))
  }

  @Test
  fun insetShadowColorChangedInPlaceKeepsTheDrawableAlpha() {
    val drawable = insetShadow(null).withBounds(Rect(0, 0, 100, 50)).apply { alpha = 102 }

    drawable.setShadowValues(shadowColor = TRANSLUCENT_RED)

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

    drawable.setShadowValues(shadowColor = TRANSLUCENT_RED)

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
    val callback = InvalidationCountingCallback()
    val drawable = insetShadow(roundedBy(8f), blurRadius = 4f).apply { this.callback = callback }

    drawable.setShadowValues(
        shadowColor = Color.BLACK,
        offsetX = 2f,
        offsetY = 3f,
        blurRadius = 4f,
        spread = 1f,
    )
    assertThat(callback.invalidations).isZero()

    drawable.setShadowValues(spread = 2f)
    assertThat(callback.invalidations).isEqualTo(1)
  }

  @Test
  fun insetShadowValuesChangedTogetherInvalidateOnce() {
    val callback = InvalidationCountingCallback()
    val drawable = insetShadow(roundedBy(8f), blurRadius = 4f).apply { this.callback = callback }

    drawable.setShadowValues(
        shadowColor = Color.RED,
        offsetX = -4f,
        offsetY = 5f,
        blurRadius = 6f,
        spread = 2f,
    )

    assertThat(callback.invalidations).isEqualTo(1)
  }

  @Test
  fun outsetShadowValuesSetToWhatTheyAlreadyAreDoNotInvalidate() {
    val callback = InvalidationCountingCallback()
    val drawable = outsetShadow(roundedBy(8f), blurRadius = 4f).apply { this.callback = callback }

    drawable.setShadowValues(
        shadowColor = Color.BLACK,
        offsetX = 2f,
        offsetY = 3f,
        blurRadius = 4f,
        spread = 1f,
    )
    assertThat(callback.invalidations).isZero()

    drawable.setShadowValues(spread = 2f)
    assertThat(callback.invalidations).isEqualTo(1)
  }

  @Test
  fun outsetShadowValuesChangedTogetherInvalidateOnce() {
    val callback = InvalidationCountingCallback()
    val drawable = outsetShadow(roundedBy(8f), blurRadius = 4f).apply { this.callback = callback }

    drawable.setShadowValues(
        shadowColor = Color.RED,
        offsetX = -4f,
        offsetY = 5f,
        blurRadius = 6f,
        spread = 2f,
    )

    assertThat(callback.invalidations).isEqualTo(1)
  }

  private fun setScreenDensity(density: Float) {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { this.density = density })
  }

  private fun insetShadow(
      borderRadius: BorderRadiusStyle?,
      borderInsets: BorderInsets? = null,
      blurRadius: Float = 0f,
      shadowColor: Int = Color.BLACK,
      offsetX: Float = 2f,
      offsetY: Float = 3f,
      spread: Float = 1f,
      drawableContext: Context = context,
  ): InsetBoxShadowDrawable =
      InsetBoxShadowDrawable(
          context = drawableContext,
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
      drawableContext: Context = context,
  ): OutsetBoxShadowDrawable =
      OutsetBoxShadowDrawable(
          context = drawableContext,
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

  private fun assertKeepsItsMaskFilterAcrossDraws(drawable: Drawable) {
    drawable.bounds = Rect(0, 0, 100, 50)

    val firstDraw = MaskFilterRecordingCanvas().also { drawable.draw(it) }.maskFilters
    val secondDraw = MaskFilterRecordingCanvas().also { drawable.draw(it) }.maskFilters

    assertThat(firstDraw.single()).isNotNull()
    assertThat(secondDraw.single()).isSameAs(firstDraw.single())
  }

  private fun assertRebuildsItsMaskFilterAfterADensityChange(drawable: Drawable) {
    drawable.bounds = Rect(0, 0, 100, 50)
    val beforeTheChange = MaskFilterRecordingCanvas().also { drawable.draw(it) }.maskFilters

    setScreenDensity(3f)

    val afterTheChange = MaskFilterRecordingCanvas().also { drawable.draw(it) }.maskFilters
    assertThat(afterTheChange.single()).isNotNull().isNotSameAs(beforeTheChange.single())
  }

  /** Records the mask filter of each paint a drawable draws with. */
  private class MaskFilterRecordingCanvas : Canvas() {
    val maskFilters = mutableListOf<MaskFilter?>()

    override fun clipPath(path: Path): Boolean = true

    override fun clipOutPath(path: Path): Boolean = true

    override fun clipRect(rect: RectF): Boolean = true

    override fun clipOutRect(rect: Rect): Boolean = true

    override fun drawPath(path: Path, paint: Paint) {
      maskFilters.add(paint.maskFilter)
    }

    override fun drawRect(rect: RectF, paint: Paint) {
      maskFilters.add(paint.maskFilter)
    }

    override fun drawDoubleRoundRect(
        outer: RectF,
        outerRadii: FloatArray,
        inner: RectF,
        innerRadii: FloatArray,
        paint: Paint,
    ) {
      maskFilters.add(paint.maskFilter)
    }
  }

  private class PreferenceCountingContext(base: Context) : ContextWrapper(base) {
    var preferenceReads = 0
      private set

    override fun getSharedPreferences(name: String?, mode: Int): SharedPreferences {
      preferenceReads += 1
      return super.getSharedPreferences(name, mode)
    }
  }

  private fun <T : Drawable> assertKeepsItsGeometryThrough(
      build: (BorderRadiusStyle) -> T,
      change: (T) -> Unit,
  ) {
    val borderRadius = spy(roundedBy(8f))
    val drawable = build(borderRadius).withBounds(Rect(0, 0, 100, 50))
    drawable.draw(RecordingCanvas())

    change(drawable)
    drawable.draw(RecordingCanvas())

    verify(borderRadius, times(1)).resolve(any(), any(), any(), any())
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
}
