/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Layout
import android.text.SpannableString
import android.text.StaticLayout
import android.text.TextPaint
import kotlin.math.ceil
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class TextLayoutManagerLongestLineWidthTest {

  @Test
  fun `longest line width tightens a wrapped layout without adding a line`() {
    val text = SpannableString("Sitting, Standing,\nRoomscale")
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 16f }
    val layout = createLayout(text, paint, 20)

    assertThat(layout.lineCount).isGreaterThan(1)

    val tightenedWidth = ceil(TextLayoutManager.longestLineWidth(layout, layout.lineCount)).toInt()
    val tightenedLayout = createLayout(text, paint, tightenedWidth)

    assertThat(tightenedWidth).isLessThan(layout.width)
    assertThat(tightenedLayout.lineCount).isEqualTo(layout.lineCount)
    assertThat(TextLayoutManager.longestLineWidth(tightenedLayout, tightenedLayout.lineCount))
        .isLessThanOrEqualTo(tightenedWidth.toFloat())
  }

  private fun createLayout(text: SpannableString, paint: TextPaint, width: Int): Layout =
      StaticLayout.Builder.obtain(text, 0, text.length, paint, width)
          .setBreakStrategy(Layout.BREAK_STRATEGY_HIGH_QUALITY)
          .setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NONE)
          .build()
}
