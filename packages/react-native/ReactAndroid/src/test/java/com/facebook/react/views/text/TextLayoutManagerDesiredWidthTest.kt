/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.graphics.text.LineBreakConfig
import android.text.BoringLayout
import android.text.Layout
import android.text.SpannableString
import android.text.TextPaint
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.CALLS_REAL_METHODS
import org.mockito.Mockito.mockStatic
import org.mockito.Mockito.never
import org.mockito.Mockito.times
import org.mockito.kotlin.any
import org.mockito.verification.VerificationMode
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@SuppressLint("NewApi")
@Config(sdk = [35])
class TextLayoutManagerDesiredWidthTest {

  @Test
  fun `EXACTLY mode does not measure the desired width`() {
    mockStatic(Layout::class.java, CALLS_REAL_METHODS).use { layoutStatic ->
      val layout = createLayout(YogaMeasureMode.EXACTLY, boring = null)

      layoutStatic.verifyDesiredWidthCalls(never())
      assertThat(layout.width).isEqualTo(LAYOUT_WIDTH.toInt())
    }
  }

  @Test
  fun `AT_MOST mode does not measure the desired width when boring text does not fit`() {
    mockStatic(Layout::class.java, CALLS_REAL_METHODS).use { layoutStatic ->
      val layout = createLayout(YogaMeasureMode.AT_MOST, boring = boringMetrics(width = 500))

      layoutStatic.verifyDesiredWidthCalls(never())
      assertThat(layout.width).isEqualTo(LAYOUT_WIDTH.toInt())
    }
  }

  @Test
  fun `AT_MOST mode measures the desired width when the text is not boring`() {
    mockStatic(Layout::class.java, CALLS_REAL_METHODS).use { layoutStatic ->
      val layout = createLayout(YogaMeasureMode.AT_MOST, boring = null)

      layoutStatic.verifyDesiredWidthCalls(times(1))
      assertThat(layout.width).isLessThanOrEqualTo(LAYOUT_WIDTH.toInt())
    }
  }

  @Test
  fun `UNDEFINED mode measures the desired width when the text is not boring`() {
    mockStatic(Layout::class.java, CALLS_REAL_METHODS).use { layoutStatic ->
      val layout = createLayout(YogaMeasureMode.UNDEFINED, boring = null)

      layoutStatic.verifyDesiredWidthCalls(times(1))
      assertThat(layout.lineCount).isEqualTo(1)
    }
  }

  private fun MockedStatic<Layout>.verifyDesiredWidthCalls(mode: VerificationMode) {
    verify({ Layout.getDesiredWidth(any<CharSequence>(), any<TextPaint>()) }, mode)
  }

  private fun boringMetrics(width: Int): BoringLayout.Metrics =
      BoringLayout.Metrics().apply {
        this.width = width
        ascent = -20
        descent = 5
        top = -22
        bottom = 6
      }

  private fun createLayout(
      widthMode: YogaMeasureMode,
      boring: BoringLayout.Metrics?,
      lineBreakStyle: Int = LineBreakConfig.LINE_BREAK_STYLE_NONE,
      lineBreakWordStyle: Int = LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
  ): Layout =
      TextLayoutManager.createLayout(
          text = SpannableString("hello world"),
          boring = boring,
          width = LAYOUT_WIDTH,
          widthYogaMeasureMode = widthMode,
          includeFontPadding = false,
          textBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY,
          hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE,
          lineBreakStyle = lineBreakStyle,
          lineBreakWordStyle = lineBreakWordStyle,
          alignment = Layout.Alignment.ALIGN_NORMAL,
          justificationMode = 0,
          ellipsizeMode = null,
          maxNumberOfLines = 2,
          paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 26f },
      )

  private companion object {
    const val LAYOUT_WIDTH = 200f
  }
}
