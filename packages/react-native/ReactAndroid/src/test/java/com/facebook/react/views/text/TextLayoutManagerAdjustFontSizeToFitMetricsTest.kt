/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.TextPaint
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.uimanager.DisplayMetricsHolder
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

/**
 * A single-line label that fits its width but not its height is shrunk by adjustsFontSizeToFit. The
 * layout createLayout returns must use the line metrics of the fitted font size, not those of the
 * original, larger font: otherwise the line is taller than the height it was shrunk to fit, and its
 * baseline sits low. PreparedLayoutTextView draws this layout directly, so the label is drawn
 * off-center.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class TextLayoutManagerAdjustFontSizeToFitMetricsTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `text shrunk to fit a height is laid out with the fitted font metrics`() {
    val fullSizeLineHeight = layoutWithoutAdjusting().height
    val availableHeight = fullSizeLineHeight * 3f / 4f

    val text = spannableWithFontSize(FONT_SIZE)
    val paint = newPaint()
    val layout = createAdjustedLayout(text, paint, availableHeight)

    assertThat(largestFontSize(text)).isLessThan(FONT_SIZE)
    assertThat(layout.height.toFloat()).isLessThanOrEqualTo(availableHeight)
    assertThat(layout.getLineBaseline(0))
        .isEqualTo(layoutWithoutAdjusting(text, paint).getLineBaseline(0))
  }

  private fun createAdjustedLayout(text: SpannableString, paint: TextPaint, height: Float): Layout {
    return TextLayoutManager.createLayout(
            text,
            paint,
            WritableMapBuffer(),
            singleLineParagraph().put(TextLayoutManager.PA_KEY_ADJUST_FONT_SIZE_TO_FIT, true),
            WIDTH,
            YogaMeasureMode.EXACTLY,
            height,
            YogaMeasureMode.AT_MOST,
        )
        .layout
  }

  // The same text at whatever size its spans and paint hold, without adjustsFontSizeToFit.
  private fun layoutWithoutAdjusting(
      text: SpannableString = spannableWithFontSize(FONT_SIZE),
      paint: TextPaint = newPaint(),
  ): Layout =
      TextLayoutManager.createLayout(
              SpannableString(text),
              TextPaint(paint),
              WritableMapBuffer(),
              singleLineParagraph(),
              WIDTH,
              YogaMeasureMode.EXACTLY,
              Float.NaN,
              YogaMeasureMode.UNDEFINED,
          )
          .layout

  private fun singleLineParagraph(): WritableMapBuffer =
      WritableMapBuffer()
          .put(TextLayoutManager.PA_KEY_MAX_NUMBER_OF_LINES, 1)
          .put(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY, "simple")
          .put(TextLayoutManager.PA_KEY_HYPHENATION_FREQUENCY, "none")

  private fun spannableWithFontSize(fontSize: Int): SpannableString {
    val text = SpannableString("Done")
    text.setSpan(ReactAbsoluteSizeSpan(fontSize), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    return text
  }

  private fun newPaint(): TextPaint =
      TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = FONT_SIZE.toFloat() }

  private fun largestFontSize(text: Spanned): Int =
      text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java).maxOfOrNull { it.size } ?: 0

  private companion object {
    const val FONT_SIZE = 40
    const val WIDTH = 10_000f
  }
}
