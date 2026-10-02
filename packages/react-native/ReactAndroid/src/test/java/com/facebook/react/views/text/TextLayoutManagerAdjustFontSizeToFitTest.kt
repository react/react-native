/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
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
class TextLayoutManagerAdjustFontSizeToFitTest {

  @Test
  @SuppressLint("InlinedApi")
  fun `adjustSpannableFontToFit keeps original font size when text already fits`() {
    val text = spannableWithFontSize("Already fits", 22)
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 22f }

    adjustSpannableFontToFit(
        text,
        /* width = */ 1000f,
        /* height = */ 1000f,
        paint,
    )

    assertThat(paint.textSize).isEqualTo(22f)
    assertThat(text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java).single().size)
        .isEqualTo(22)
  }

  @Test
  @SuppressLint("InlinedApi")
  fun `adjustSpannableFontToFit does not compound rounding down while shrinking`() {
    var scaledFontSize = 22
    var previousFontSize = 22

    for (currentFontSize in listOf(13, 18, 20, 21, 22)) {
      val ratio = currentFontSize.toFloat() / previousFontSize.toFloat()
      scaledFontSize =
          TextLayoutManager.scaleFontSizeForFontSizeFit(scaledFontSize.toFloat(), ratio, 4)
      previousFontSize = currentFontSize
    }

    assertThat(scaledFontSize).isEqualTo(22)
  }

  private fun spannableWithFontSize(text: String, fontSize: Int): SpannableString =
      SpannableString(text).apply {
        setSpan(ReactAbsoluteSizeSpan(fontSize), 0, length, Spanned.SPAN_INCLUSIVE_EXCLUSIVE)
      }

  @SuppressLint("InlinedApi")
  private fun adjustSpannableFontToFit(
      text: SpannableString,
      width: Float,
      height: Float,
      paint: TextPaint,
  ) {
    TextLayoutManager.adjustSpannableFontToFit(
        text,
        width,
        YogaMeasureMode.EXACTLY,
        height,
        YogaMeasureMode.EXACTLY,
        /* minimumFontSizeAttr = */ 4f,
        ReactConstants.UNSET,
        /* includeFontPadding = */ false,
        Layout.BREAK_STRATEGY_HIGH_QUALITY,
        Layout.HYPHENATION_FREQUENCY_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        /* justificationMode = */ 0,
        paint,
    )
  }
}
