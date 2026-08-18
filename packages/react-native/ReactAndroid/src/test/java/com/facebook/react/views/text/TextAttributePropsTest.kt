/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.Gravity
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactStylesDiffMap
import org.assertj.core.api.Assertions.assertThat
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

  // A surface on a secondary display is laid out at that display's density, while
  // DisplayMetricsHolder keeps describing the primary display. Attributes must follow the metrics
  // they are given, otherwise text is measured at one scale and drawn at another.
  @Test
  fun fromMapBuffer_resolvesFontSizeAgainstSuppliedMetrics() {
    DisplayMetricsHolder.setScreenDisplayMetrics(
        PixelUtil.displayMetricsFor(density = 3.0f, fontScale = 1.0f),
    )
    val surfaceMetrics = PixelUtil.displayMetricsFor(density = 1.5f, fontScale = 1.0f)

    val props =
        WritableMapBuffer()
            .put(TextAttributeProps.TA_KEY_FONT_SIZE, 16.0)
            .put(TextAttributeProps.TA_KEY_ALLOW_FONT_SCALING, true)

    assertThat(TextAttributeProps.fromMapBuffer(props, surfaceMetrics).fontSize).isEqualTo(24)
    // Unqualified, it still follows the holder.
    assertThat(TextAttributeProps.fromMapBuffer(props).fontSize).isEqualTo(48)
  }

  // TA_KEY_MAX_FONT_SIZE_MULTIPLIER (29) is parsed after TA_KEY_FONT_SIZE (4) and re-runs
  // setFontSize, so the metrics have to be in place before parsing begins, not applied afterwards.
  @Test
  fun fromMapBuffer_appliesSuppliedMetricsWhenMaxFontSizeMultiplierReTriggersFontSize() {
    val surfaceMetrics = PixelUtil.displayMetricsFor(density = 1.5f, fontScale = 3.0f)

    val props =
        WritableMapBuffer()
            .put(TextAttributeProps.TA_KEY_FONT_SIZE, 16.0)
            .put(TextAttributeProps.TA_KEY_ALLOW_FONT_SCALING, true)
            .put(TextAttributeProps.TA_KEY_MAX_FONT_SIZE_MULTIPLIER, 2.0)

    // Font scale 3.0 is clamped to the 2.0 multiplier: 16 * 1.5 * 2.0 = 48.
    assertThat(TextAttributeProps.fromMapBuffer(props, surfaceMetrics).fontSize).isEqualTo(48)
  }

  @Test
  fun fromMapBuffer_ignoresFontScaleWhenFontScalingIsDisabled() {
    val surfaceMetrics = PixelUtil.displayMetricsFor(density = 1.5f, fontScale = 2.0f)

    val props =
        WritableMapBuffer()
            .put(TextAttributeProps.TA_KEY_FONT_SIZE, 16.0)
            .put(TextAttributeProps.TA_KEY_ALLOW_FONT_SCALING, false)

    assertThat(TextAttributeProps.fromMapBuffer(props, surfaceMetrics).fontSize).isEqualTo(24)
  }

  private fun textAlignment(textAlign: String, isRTL: Boolean): Int {
    return TextAttributeProps.getTextAlignment(
        ReactStylesDiffMap(JavaOnlyMap.of("textAlign", textAlign)),
        isRTL,
        Gravity.CENTER_HORIZONTAL,
    )
  }
}
