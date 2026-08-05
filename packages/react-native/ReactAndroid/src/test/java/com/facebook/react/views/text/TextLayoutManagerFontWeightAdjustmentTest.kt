/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.text.TextPaint
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.views.text.internal.span.CustomStyleSpan
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.inOrder
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RequiresApi(Build.VERSION_CODES.O)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class TextLayoutManagerFontWeightAdjustmentTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `plain text paint applies Android font weight adjustment`() {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    val textAttributes = TextAttributeProps.fromReadableMap(ReactStylesDiffMap(JavaOnlyMap()))

    TextLayoutManager.updateTextPaint(
        paint,
        textAttributes,
        RuntimeEnvironment.getApplication().assets,
        FONT_WEIGHT_ADJUSTMENT_BOLD_TEXT,
    )

    assertThat(paint.typeface).isNotNull
  }

  @Test
  fun `plain text paint keeps default typeface unset without font weight adjustment`() {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    val textAttributes = TextAttributeProps.fromReadableMap(ReactStylesDiffMap(JavaOnlyMap()))

    TextLayoutManager.updateTextPaint(
        paint,
        textAttributes,
        RuntimeEnvironment.getApplication().assets,
        0,
    )

    assertThat(paint.typeface).isNull()
  }

  @Test
  fun `plain text paint ignores invalid font variation settings`() {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    val textAttributes =
        TextAttributeProps.fromReadableMap(
            ReactStylesDiffMap(JavaOnlyMap.of("fontVariationSettings", "invalid"))
        )

    TextLayoutManager.updateTextPaint(
        paint,
        textAttributes,
        RuntimeEnvironment.getApplication().assets,
        0,
    )

    assertThat(paint.fontVariationSettings).isNull()
  }

  @Test
  fun `custom style applies font variation settings after high level font properties`() {
    val paint = mock<TextPaint>()
    val span = CustomStyleSpan(
        Typeface.NORMAL,
        700,
        null,
        "'wght' 450",
        "sans-serif",
        RuntimeEnvironment.getApplication().assets,
    )

    span.updateMeasureState(paint)

    inOrder(paint) {
      verify(paint).setTypeface(any())
      verify(paint).setFontVariationSettings("'wght' 450")
    }
  }

  @Test
  fun `invalid font variation settings defensively clear a reused paint`() {
    val paint = mock<Paint>()
    val invalidSettings = "invalid-reused-paint-test"
    whenever(paint.setFontVariationSettings(invalidSettings)).thenThrow(IllegalArgumentException())

    ReactTypefaceUtils.applyFontVariationSettings(paint, "'wght' 700")
    ReactTypefaceUtils.applyFontVariationSettings(paint, invalidSettings)

    verify(paint).setFontVariationSettings("'wght' 700")
    verify(paint).setFontVariationSettings(invalidSettings)
    verify(paint).setFontVariationSettings(null)
  }

  private companion object {
    const val FONT_WEIGHT_ADJUSTMENT_BOLD_TEXT = 300
  }
}
