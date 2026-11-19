/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/**
 * A Text whose style resolves to a font size of 0 or less, e.g. `fontSize: 0`, or a font size
 * computed from a width that is still 0 before the first layout.
 */
@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
class TextLayoutManagerZeroFontSizeTest {

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun `text with a font size of 0 can be measured`() {
    assertThat(measureWidth(fontSize = 0.0)).isLessThanOrEqualTo(100f)
  }

  @Test
  fun `text with a negative font size can be measured`() {
    assertThat(measureWidth(fontSize = -12.0)).isLessThanOrEqualTo(100f)
  }

  private fun measureWidth(fontSize: Double): Float {
    val textAttributes = WritableMapBuffer().put(TextAttributeProps.TA_KEY_FONT_SIZE, fontSize)
    val attributedString =
        WritableMapBuffer()
            .put(
                TextLayoutManager.AS_KEY_FRAGMENTS,
                WritableMapBuffer()
                    .put(
                        0,
                        WritableMapBuffer()
                            .put(TextLayoutManager.FR_KEY_STRING, "x")
                            .put(TextLayoutManager.FR_KEY_TEXT_ATTRIBUTES, textAttributes),
                    ),
            )
            .put(TextLayoutManager.AS_KEY_BASE_ATTRIBUTES, textAttributes)

    val measurement =
        TextLayoutManager.measureText(
            RuntimeEnvironment.getApplication().assets,
            attributedString,
            WritableMapBuffer()
                .put(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY, "simple")
                .put(TextLayoutManager.PA_KEY_HYPHENATION_FREQUENCY, "none"),
            100f,
            YogaMeasureMode.AT_MOST,
            100f,
            YogaMeasureMode.AT_MOST,
            null,
            null,
        )

    return YogaMeasureOutput.getWidth(measurement)
  }
}
