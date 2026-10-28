/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // DisplayMetrics.scaledDensity, to simulate a system font scale

package com.facebook.react.views.text

import android.util.DisplayMetrics
import android.view.Gravity
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class TextAttributePropsTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun readableMapSetsFontVariationSettings() {
    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(JavaOnlyMap.of("fontVariationSettings", "'wght' 550")),
        )

    assertThat(textAttributes.fontVariationSettings).isEqualTo("'wght' 550")
  }

  @Test
  fun readableMapSetsDoubleQuotedFontVariationSettings() {
    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(JavaOnlyMap.of("fontVariationSettings", "\"wght\" 450")),
        )

    assertThat(textAttributes.fontVariationSettings).isEqualTo("\"wght\" 450")
  }

  @Test
  fun readableMapIgnoresInvalidFontVariationSettings() {
    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(JavaOnlyMap.of("fontVariationSettings", "invalid")),
        )

    assertThat(textAttributes.fontVariationSettings).isNull()
  }

  @Test
  fun readableMapTreatsNormalFontVariationSettingsAsExplicitReset() {
    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(JavaOnlyMap.of("fontVariationSettings", "NoRmAl")),
        )

    assertThat(textAttributes.fontVariationSettings).isEmpty()
  }

  @Test
  fun textAlignStartUsesStartSide() {
    assertThat(textAlignment("start", isRTL = false)).isEqualTo(Gravity.LEFT)
    assertThat(textAlignment("start", isRTL = true)).isEqualTo(Gravity.RIGHT)
  }

  @Test
  fun textAlignEndUsesEndSide() {
    assertThat(textAlignment("end", isRTL = false)).isEqualTo(Gravity.RIGHT)
    assertThat(textAlignment("end", isRTL = true)).isEqualTo(Gravity.LEFT)
  }

  @Test
  fun lineHeightIsCappedByMaxFontSizeMultiplier() {
    setFontScale(2f)

    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(
                JavaOnlyMap.of("fontSize", 14.0, "lineHeight", 20.0, "maxFontSizeMultiplier", 1.3)
            ),
        )

    assertThat(textAttributes.lineHeight).isCloseTo(20f * DENSITY * 1.3f, within(0.001f))
  }

  @Test
  fun lineHeightIsCappedByMaxFontSizeMultiplierFromMapBuffer() {
    setFontScale(2f)

    // Keys are iterated in ascending order, so lineHeight is set before maxFontSizeMultiplier.
    val textAttributes =
        TextAttributeProps.fromMapBuffer(
            WritableMapBuffer()
                .put(TextAttributeProps.TA_KEY_FONT_SIZE, 14.0)
                .put(TextAttributeProps.TA_KEY_LINE_HEIGHT, 20.0)
                .put(TextAttributeProps.TA_KEY_MAX_FONT_SIZE_MULTIPLIER, 1.3),
        )

    assertThat(textAttributes.lineHeight).isCloseTo(20f * DENSITY * 1.3f, within(0.001f))
  }

  @Test
  fun letterSpacingIsCappedByMaxFontSizeMultiplier() {
    setFontScale(2f)

    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(
                JavaOnlyMap.of("fontSize", 14.0, "letterSpacing", 2.0, "maxFontSizeMultiplier", 1.3)
            ),
        )

    assertThat(textAttributes.fontSize).isEqualTo(37) // ceil(14 * 2 * 1.3)
    assertThat(textAttributes.letterSpacing)
        .isCloseTo(2f * DENSITY * 1.3f / textAttributes.fontSize, within(0.001f))
  }

  @Test
  fun lineHeightScalesWithFontScaleWithoutMaxFontSizeMultiplier() {
    setFontScale(2f)

    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(JavaOnlyMap.of("fontSize", 14.0, "lineHeight", 20.0)),
        )

    assertThat(textAttributes.lineHeight).isCloseTo(20f * DENSITY * 2f, within(0.001f))
  }

  @Test
  fun lineHeightIsNotCappedWhenFontScaleIsBelowMaxFontSizeMultiplier() {
    setFontScale(1.2f)

    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(
                JavaOnlyMap.of("fontSize", 14.0, "lineHeight", 20.0, "maxFontSizeMultiplier", 1.5)
            ),
        )

    assertThat(textAttributes.lineHeight).isCloseTo(20f * DENSITY * 1.2f, within(0.001f))
  }

  @Test
  fun lineHeightIsNotCappedWhenMaxFontSizeMultiplierIsZero() {
    setFontScale(2f)

    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(
                JavaOnlyMap.of("fontSize", 14.0, "lineHeight", 20.0, "maxFontSizeMultiplier", 0.0)
            ),
        )

    assertThat(textAttributes.lineHeight).isCloseTo(20f * DENSITY * 2f, within(0.001f))
  }

  @Test
  fun lineHeightIgnoresFontScaleWhenFontScalingIsDisabled() {
    setFontScale(2f)

    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(
                JavaOnlyMap.of(
                    "fontSize",
                    14.0,
                    "lineHeight",
                    20.0,
                    "maxFontSizeMultiplier",
                    1.3,
                    "allowFontScaling",
                    false,
                )
            ),
        )

    assertThat(textAttributes.lineHeight).isCloseTo(20f * DENSITY, within(0.001f))
  }

  @Test
  fun mapBufferSetsTextDecorationLine() {
    assertThat(textDecorationLine("none")).isEqualTo(false to false)
    assertThat(textDecorationLine("underline")).isEqualTo(true to false)
    assertThat(textDecorationLine("strikethrough")).isEqualTo(false to true)
    assertThat(textDecorationLine("underline-strikethrough")).isEqualTo(true to true)
  }

  /** Returns whether underline and line-through are set for the given textDecorationLine. */
  private fun textDecorationLine(value: String): Pair<Boolean, Boolean> {
    val textAttributes =
        TextAttributeProps.fromMapBuffer(
            WritableMapBuffer().put(TextAttributeProps.TA_KEY_TEXT_DECORATION_LINE, value),
        )
    return textAttributes.isUnderlineTextDecorationSet to
        textAttributes.isLineThroughTextDecorationSet
  }

  private fun setFontScale(fontScale: Float) {
    DisplayMetricsHolder.setScreenDisplayMetrics(
        DisplayMetrics().apply {
          density = DENSITY
          scaledDensity = DENSITY * fontScale
        },
    )
  }

  private fun textAlignment(textAlign: String, isRTL: Boolean): Int {
    return TextAttributeProps.getTextAlignment(
        ReactStylesDiffMap(JavaOnlyMap.of("textAlign", textAlign)),
        isRTL,
        Gravity.CENTER_HORIZONTAL,
    )
  }

  private companion object {
    const val DENSITY = 2f
  }
}
