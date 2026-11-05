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
import kotlin.math.ceil
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode
import org.robolectric.annotation.TextLayoutMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@TextLayoutMode(TextLayoutMode.Mode.REALISTIC)
class TextLayoutManagerPixelWidthTest {
  private val text = SpannableString("Add payment method")
  private val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 16f }
  private val measuredWidth = ceil(Layout.getDesiredWidth(text, paint)).toInt()

  @Test
  fun `AT_MOST width a floating point error short of the measured width keeps one line`() {
    val widths = listOf(Math.nextDown(measuredWidth.toFloat()), measuredWidth - 0.0004f)
    for (width in widths) {
      for (boring in listOf(BoringLayout.isBoring(text, paint), null)) {
        val layout = createLayout(width, boring)

        assertThat(layout.width).isEqualTo(measuredWidth)
        assertThat(layout.lineCount).isEqualTo(1)
      }
    }
  }

  @Test
  fun `AT_MOST width a fraction of a pixel short of the measured width wraps`() {
    for (boring in listOf(BoringLayout.isBoring(text, paint), null)) {
      val layout = createLayout(measuredWidth - 0.5f, boring)

      assertThat(layout.width).isEqualTo(measuredWidth - 1)
      assertThat(layout.lineCount).isGreaterThan(1)
    }
  }

  @SuppressLint("InlinedApi")
  private fun createLayout(width: Float, boring: BoringLayout.Metrics?): Layout =
      TextLayoutManager.createLayout(
          text,
          boring,
          width,
          YogaMeasureMode.AT_MOST,
          /* includeFontPadding = */ false,
          /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
          /* hyphenationFrequency = */ Layout.HYPHENATION_FREQUENCY_NONE,
          /* lineBreakStyle = */ LineBreakConfig.LINE_BREAK_STYLE_NONE,
          /* lineBreakWordStyle = */ LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
          Layout.Alignment.ALIGN_NORMAL,
          /* justificationMode = */ 0,
          /* ellipsizeMode = */ null,
          /* maxNumberOfLines = */ 0,
          paint,
      )
}
