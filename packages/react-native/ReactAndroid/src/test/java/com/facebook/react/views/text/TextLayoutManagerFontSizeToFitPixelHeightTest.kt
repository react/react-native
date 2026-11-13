/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.graphics.text.LineBreakConfig
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.views.text.internal.span.CustomLineHeightSpan
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@SuppressLint("InlinedApi")
class TextLayoutManagerFontSizeToFitPixelHeightTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `AT_MOST height a floating point error short of the text height keeps the font size`() {
    val textHeight = layoutHeight(spannableWithFontSize(FONT_SIZE))

    for (height in listOf(Math.nextDown(textHeight.toFloat()), textHeight - 0.0004f)) {
      val text = spannableWithFontSize(FONT_SIZE)
      adjustToFitHeight(text, height)

      assertThat(fontSize(text)).isEqualTo(FONT_SIZE)
    }
  }

  @Test
  fun `AT_MOST height a fraction of a pixel short of the text height shrinks the font`() {
    val text = spannableWithFontSize(FONT_SIZE)
    adjustToFitHeight(text, layoutHeight(text) - 0.5f)

    assertThat(fontSize(text)).isLessThan(FONT_SIZE)
  }

  @Test
  fun `line heights rounded up to whole pixels still fit the height of their lines`() {
    for (lineCount in 1..2) {
      val text = spannableWithLineHeight(FRACTIONAL_LINE_HEIGHT, lineCount)
      adjustToFitHeight(text, lineCount * FRACTIONAL_LINE_HEIGHT)

      assertThat(fontSize(text)).isEqualTo(FONT_SIZE)
    }
  }

  @Test
  fun `line heights that do not fit the height of their lines shrink the font`() {
    val text = spannableWithLineHeight(FRACTIONAL_LINE_HEIGHT, lineCount = 2)
    adjustToFitHeight(text, 2 * FRACTIONAL_LINE_HEIGHT - 1f)

    assertThat(fontSize(text)).isLessThan(FONT_SIZE)
  }

  private fun spannableWithLineHeight(lineHeight: Float, lineCount: Int): SpannableString =
      SpannableString(List(lineCount) { "Add payment method" }.joinToString("\n")).apply {
        setSpan(ReactAbsoluteSizeSpan(FONT_SIZE), 0, length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
        setSpan(CustomLineHeightSpan(lineHeight), 0, length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
      }

  private fun spannableWithFontSize(fontSize: Int): SpannableString =
      SpannableString("Add payment method").apply {
        setSpan(ReactAbsoluteSizeSpan(fontSize), 0, length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
      }

  private fun paint(): TextPaint =
      TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = FONT_SIZE.toFloat() }

  private fun layoutHeight(text: SpannableString): Int =
      StaticLayout.Builder.obtain(text, 0, text.length, paint(), WIDTH.toInt())
          .setIncludePad(false)
          .build()
          .height

  private fun fontSize(text: SpannableString): Int =
      text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java).single().size

  private fun adjustToFitHeight(text: SpannableString, height: Float) {
    TextLayoutManager.adjustSpannableFontToFit(
        text,
        WIDTH,
        YogaMeasureMode.EXACTLY,
        height,
        YogaMeasureMode.AT_MOST,
        /* minimumFontSizeAttr = */ Float.NaN,
        /* minimumFontScale = */ Float.NaN,
        ReactConstants.UNSET,
        /* includeFontPadding = */ false,
        Layout.BREAK_STRATEGY_HIGH_QUALITY,
        Layout.HYPHENATION_FREQUENCY_NONE,
        LineBreakConfig.LINE_BREAK_STYLE_NONE,
        LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        /* justificationMode = */ 0,
        paint(),
    )
  }

  private companion object {
    const val FONT_SIZE = 40
    const val FRACTIONAL_LINE_HEIGHT = 52.5f
    const val WIDTH = 1000f
  }
}
