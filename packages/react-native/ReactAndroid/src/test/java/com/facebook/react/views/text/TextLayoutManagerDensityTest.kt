/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.util.DisplayMetrics
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Text is measured in Java in physical pixels and reported back to Yoga in dp, and Fabric then
 * mounts the resulting frame using the surface's own `pointScaleFactor`. When a surface is on a
 * display whose density differs from the primary display's — Samsung DeX, desktop mode, an external
 * monitor, a freeform window — measuring against the process-wide [DisplayMetricsHolder] makes
 * those two scales disagree, and text overflows its box by exactly the ratio between them.
 *
 * These tests pin the measurement to the metrics it is handed rather than to the holder.
 */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
@OptIn(UnstableReactNativeAPI::class)
class TextLayoutManagerDensityTest {

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    // Stand in for the device's primary display.
    DisplayMetricsHolder.setScreenDisplayMetrics(
        PixelUtil.displayMetricsFor(density = PRIMARY_DENSITY, fontScale = 1.0f),
    )
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  // The sp -> px half of the pipeline. The spannable produced here is both what gets measured and
  // what gets drawn, so its absolute font size has to come from the surface's display.
  @Test
  fun spannable_sizesGlyphsWithTheSuppliedMetrics() {
    assertThat(fontSizePxAt(PixelUtil.displayMetricsFor(SECONDARY_DENSITY, 1.0f))).isEqualTo(24)
    assertThat(fontSizePxAt(PixelUtil.displayMetricsFor(PRIMARY_DENSITY, 1.0f))).isEqualTo(48)
    // Font scale applies on top of density.
    assertThat(fontSizePxAt(PixelUtil.displayMetricsFor(SECONDARY_DENSITY, 2.0f))).isEqualTo(48)
  }

  // The px -> dp half. Robolectric's layout width does not depend on text size, so the measured
  // pixel width is the same at both densities; that makes the ratio of the reported dp values
  // isolate the conversion, which must use the supplied density and not the holder's.
  @Test
  fun measureText_convertsToDpWithTheSuppliedDensity() {
    val atPrimary = measureAt(PixelUtil.displayMetricsFor(PRIMARY_DENSITY, 1.0f))
    val atSecondary = measureAt(PixelUtil.displayMetricsFor(SECONDARY_DENSITY, 1.0f))

    assertThat(atSecondary.first / atPrimary.first)
        .isCloseTo(PRIMARY_DENSITY / SECONDARY_DENSITY, WITHIN)
    assertThat(atSecondary.second / atPrimary.second)
        .isCloseTo(PRIMARY_DENSITY / SECONDARY_DENSITY, WITHIN)
  }

  @Test
  fun measureText_ignoresTheHolderWhenMetricsAreSupplied() {
    val supplied = PixelUtil.displayMetricsFor(SECONDARY_DENSITY, 1.0f)
    val before = measureAt(supplied)

    // Moving the "primary display" must not move a measurement taken against `supplied`.
    DisplayMetricsHolder.setScreenDisplayMetrics(PixelUtil.displayMetricsFor(1.0f, 1.0f))
    val after = measureAt(supplied)

    assertThat(after.first).isCloseTo(before.first, WITHIN)
    assertThat(after.second).isCloseTo(before.second, WITHIN)
  }

  // Inline views are laid out against a placeholder span sized in physical pixels, so that size has
  // to come from the surface's display too — otherwise the placeholder and the view Fabric mounts
  // into it disagree by the ratio between the two densities.
  @Test
  fun inlineViewSize_scalesWithTheSuppliedDensity() {
    val supplied = PixelUtil.displayMetricsFor(SECONDARY_DENSITY, 1.0f)

    assertThat(TextLayoutManager.inlineViewSizeToPixels(100.0, supplied)).isEqualTo(150)
    assertThat(
            TextLayoutManager.inlineViewSizeToPixels(
                100.0,
                PixelUtil.displayMetricsFor(PRIMARY_DENSITY, 1.0f),
            ),
        )
        .isEqualTo(300)

    // Moving the "primary display" must not move a size taken against `supplied`.
    DisplayMetricsHolder.setScreenDisplayMetrics(PixelUtil.displayMetricsFor(1.0f, 1.0f))
    assertThat(TextLayoutManager.inlineViewSizeToPixels(100.0, supplied)).isEqualTo(150)
  }

  /** Returns the absolute font size, in physical pixels, of the spannable built for [metrics]. */
  private fun fontSizePxAt(metrics: DisplayMetrics): Int {
    val spannable =
        TextLayoutManager.getOrCreateSpannableForText(
            RuntimeEnvironment.getApplication().assets,
            0,
            attributedString(),
            null,
            metrics,
        )
    val sizeSpans =
        spannable.getSpans(0, spannable.length, ReactAbsoluteSizeSpan::class.java)
    assertThat(sizeSpans).hasSize(1)
    return sizeSpans[0].size
  }

  /** Returns the measured (width, height) in dp. */
  private fun measureAt(metrics: DisplayMetrics): Pair<Float, Float> {
    val measurement =
        TextLayoutManager.measureText(
            RuntimeEnvironment.getApplication().assets,
            0,
            attributedString(),
            paragraphAttributes(),
            Float.POSITIVE_INFINITY,
            YogaMeasureMode.UNDEFINED,
            Float.POSITIVE_INFINITY,
            YogaMeasureMode.UNDEFINED,
            null,
            null,
            null,
            metrics,
        )
    return YogaMeasureOutput.getWidth(measurement) to YogaMeasureOutput.getHeight(measurement)
  }

  private fun paragraphAttributes(): MapBuffer =
      WritableMapBuffer()
          .put(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY, "highQuality")
          .put(TextLayoutManager.PA_KEY_HYPHENATION_FREQUENCY, "none")

  private fun attributedString(): MapBuffer {
    val textAttributes =
        WritableMapBuffer()
            .put(TextAttributeProps.TA_KEY_FONT_SIZE, FONT_SIZE_SP)
            .put(TextAttributeProps.TA_KEY_ALLOW_FONT_SCALING, true)

    val fragment =
        WritableMapBuffer()
            .put(TextLayoutManager.FR_KEY_STRING, "Components")
            .put(TextLayoutManager.FR_KEY_TEXT_ATTRIBUTES, textAttributes)

    return WritableMapBuffer()
        .put(TextLayoutManager.AS_KEY_STRING, "Components")
        .put(TextLayoutManager.AS_KEY_BASE_ATTRIBUTES, textAttributes)
        .put(TextLayoutManager.AS_KEY_FRAGMENTS, WritableMapBuffer().put(0, fragment))
  }

  private companion object {
    const val PRIMARY_DENSITY = 3.0f
    const val SECONDARY_DENSITY = 1.5f
    const val FONT_SIZE_SP = 16.0
    val WITHIN = org.assertj.core.data.Offset.offset(0.5f)
  }
}
