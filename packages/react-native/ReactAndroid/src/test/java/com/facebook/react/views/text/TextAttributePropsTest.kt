/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.Gravity
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.DisplayMetricsHolder
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

  private fun textAlignment(textAlign: String, isRTL: Boolean): Int {
    return TextAttributeProps.getTextAlignment(
        ReactStylesDiffMap(JavaOnlyMap.of("textAlign", textAlign)),
        isRTL,
        Gravity.CENTER_HORIZONTAL,
    )
  }
}
