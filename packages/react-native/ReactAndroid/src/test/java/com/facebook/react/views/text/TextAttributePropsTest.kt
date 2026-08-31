/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.Gravity
import com.facebook.react.bridge.JavaOnlyArray
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

  @Test
  fun readableMapSetsFontFeatureSettings() {
    val textAttributes = fromStyles("fontFeatureSettings" to "'ss01', 'zero'")

    assertThat(textAttributes.fontFeatureSettings).isEqualTo("'ss01', 'zero'")
  }

  @Test
  fun readableMapTrimsFontFeatureSettings() {
    val textAttributes = fromStyles("fontFeatureSettings" to "  'ss01'  ")

    assertThat(textAttributes.fontFeatureSettings).isEqualTo("'ss01'")
  }

  // Per CSS, `normal` means "no author-specified features", not "clear everything". It is also the
  // initial value, so on its own it resolves the same as the property never having been set: null,
  // which keeps the platform default and keeps the run from taking a span it cannot use. It still
  // must not drop the `fontVariant` features composed alongside it, covered below.
  @Test
  fun readableMapTreatsNormalFontFeatureSettingsAsNoFeatures() {
    assertThat(fromStyles("fontFeatureSettings" to "normal").fontFeatureSettings).isNull()
    assertThat(fromStyles("fontFeatureSettings" to "NoRmAl").fontFeatureSettings).isNull()
  }

  @Test
  fun readableMapLeavesFontFeatureSettingsUnsetWhenAbsent() {
    assertThat(fromStyles("fontSize" to 16.0).fontFeatureSettings).isNull()
  }

  // Golden test for the legacy ReactStylesDiffMap path. This never passes through the shared C++,
  // so it composes in Kotlin and must produce the same tags the shared resolution does.
  @Test
  fun readableMapMapsEveryFontVariantTokenToItsTag() {
    val expected = mapOf(
        "small-caps" to "'smcp'",
        "oldstyle-nums" to "'onum'",
        "lining-nums" to "'lnum'",
        "tabular-nums" to "'tnum'",
        "proportional-nums" to "'pnum'",
        "common-ligatures" to "'liga', 'clig'",
        "no-common-ligatures" to "'liga' off, 'clig' off",
        "discretionary-ligatures" to "'dlig'",
        "no-discretionary-ligatures" to "'dlig' off",
        "historical-ligatures" to "'hlig'",
        "no-historical-ligatures" to "'hlig' off",
        "contextual" to "'calt'",
        "no-contextual" to "'calt' off",
        "stylistic-one" to "'ss01'",
        "stylistic-two" to "'ss02'",
        "stylistic-three" to "'ss03'",
        "stylistic-four" to "'ss04'",
        "stylistic-five" to "'ss05'",
        "stylistic-six" to "'ss06'",
        "stylistic-seven" to "'ss07'",
        "stylistic-eight" to "'ss08'",
        "stylistic-nine" to "'ss09'",
        "stylistic-ten" to "'ss10'",
        "stylistic-eleven" to "'ss11'",
        "stylistic-twelve" to "'ss12'",
        "stylistic-thirteen" to "'ss13'",
        "stylistic-fourteen" to "'ss14'",
        "stylistic-fifteen" to "'ss15'",
        "stylistic-sixteen" to "'ss16'",
        "stylistic-seventeen" to "'ss17'",
        "stylistic-eighteen" to "'ss18'",
        "stylistic-nineteen" to "'ss19'",
        "stylistic-twenty" to "'ss20'",
    )

    for ((token, tags) in expected) {
      val textAttributes = fromStyles("fontVariant" to JavaOnlyArray.of(token))

      assertThat(textAttributes.fontFeatureSettings).describedAs(token).isEqualTo(tags)
    }
  }

  @Test
  fun readableMapAppendsFontFeatureSettingsAfterFontVariant() {
    val textAttributes = fromStyles(
        "fontVariant" to JavaOnlyArray.of("small-caps", "tabular-nums"),
        "fontFeatureSettings" to "'smcp' 0",
    )

    assertThat(textAttributes.fontFeatureSettings).isEqualTo("'smcp', 'tnum', 'smcp' 0")
  }

  @Test
  fun readableMapKeepsFontVariantWhenFontFeatureSettingsIsNormal() {
    val textAttributes = fromStyles(
        "fontVariant" to JavaOnlyArray.of("small-caps"),
        "fontFeatureSettings" to "normal",
    )

    assertThat(textAttributes.fontFeatureSettings).isEqualTo("'smcp'")
  }

  private fun fromStyles(vararg styles: Pair<String, Any>): TextAttributeProps {
    val map = JavaOnlyMap()
    for ((key, value) in styles) {
      when (value) {
        is String -> map.putString(key, value)
        is Double -> map.putDouble(key, value)
        is JavaOnlyArray -> map.putArray(key, value)
        else -> throw IllegalArgumentException("Unsupported style value: $value")
      }
    }
    return TextAttributeProps.fromReadableMap(ReactStylesDiffMap(map))
  }

  private fun textAlignment(textAlign: String, isRTL: Boolean): Int {
    return TextAttributeProps.getTextAlignment(
        ReactStylesDiffMap(JavaOnlyMap.of("textAlign", textAlign)),
        isRTL,
        Gravity.CENTER_HORIZONTAL,
    )
  }
}
