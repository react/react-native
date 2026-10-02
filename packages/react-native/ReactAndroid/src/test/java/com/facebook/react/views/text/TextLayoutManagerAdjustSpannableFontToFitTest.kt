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
import com.facebook.react.common.ReactConstants
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TextLayoutManagerAdjustSpannableFontToFitTest {

  @Test
  fun `reports that the line limit is not exceeded when the text fits`() {
    val exceedsLineLimit = adjustToFit("Hello world", maximumNumberOfLines = 1)

    assertThat(exceedsLineLimit).isFalse()
  }

  @Test
  fun `reports that the line limit is exceeded when the text has more lines at the minimum size`() {
    val exceedsLineLimit = adjustToFit("Hello\nworld", maximumNumberOfLines = 1)

    assertThat(exceedsLineLimit).isTrue()
  }

  @Test
  fun `reports that the line limit is not exceeded when only the height is exceeded`() {
    val exceedsLineLimit =
        adjustToFit("Hello world", height = 1f, maximumNumberOfLines = ReactConstants.UNSET)

    assertThat(exceedsLineLimit).isFalse()
  }

  private fun adjustToFit(
      string: String,
      height: Float = 10_000f,
      maximumNumberOfLines: Int,
  ): Boolean {
    val text = SpannableString(string)
    text.setSpan(ReactAbsoluteSizeSpan(40), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

    return TextLayoutManager.adjustSpannableFontToFit(
        text,
        10_000f,
        YogaMeasureMode.EXACTLY,
        height,
        YogaMeasureMode.EXACTLY,
        20f,
        maximumNumberOfLines,
        true,
        Layout.BREAK_STRATEGY_SIMPLE,
        Layout.HYPHENATION_FREQUENCY_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        0,
        TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 40f },
    )
  }
}
