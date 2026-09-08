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
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class TextLayoutManagerMinimumFontScaleTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `minimumFontScale limits how far the font shrinks relative to the largest font size`() {
    val text = spannableWithFontSize(LARGE_FONT_SIZE)

    adjustToUnsatisfiableHeight(text, minimumFontScale = 0.5f)

    assertThat(largestFontSize(text)).isEqualTo((LARGE_FONT_SIZE * 0.5f).toInt())
  }

  @Test
  fun `minimumFontScale is applied to the largest font size in the spannable`() {
    val text = SpannableString("Small text and LARGE TEXT")
    text.setSpan(ReactAbsoluteSizeSpan(SMALL_FONT_SIZE), 0, 14, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(
        ReactAbsoluteSizeSpan(LARGE_FONT_SIZE),
        15,
        text.length,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )

    adjustToUnsatisfiableHeight(text, minimumFontScale = 0.5f)

    assertThat(largestFontSize(text)).isEqualTo((LARGE_FONT_SIZE * 0.5f).toInt())
  }

  @Test
  fun `missing minimumFontScale shrinks down to the 4dp floor`() {
    val text = spannableWithFontSize(LARGE_FONT_SIZE)

    adjustToUnsatisfiableHeight(text, minimumFontScale = Float.NaN)

    assertThat(largestFontSize(text)).isEqualTo(4.dpToPx().toInt())
  }

  @Test
  fun `zero minimumFontScale shrinks down to the 4dp floor`() {
    val text = spannableWithFontSize(LARGE_FONT_SIZE)

    adjustToUnsatisfiableHeight(text, minimumFontScale = 0f)

    assertThat(largestFontSize(text)).isEqualTo(4.dpToPx().toInt())
  }

  @Test
  fun `minimumFontScale never shrinks below the 4dp floor`() {
    val text = spannableWithFontSize(LARGE_FONT_SIZE)

    adjustToUnsatisfiableHeight(text, minimumFontScale = 0.01f)

    assertThat(largestFontSize(text)).isEqualTo(4.dpToPx().toInt())
  }

  @Test
  fun `text that already fits is not shrunk`() {
    val text = spannableWithFontSize(LARGE_FONT_SIZE)

    TextLayoutManager.adjustSpannableFontToFit(
        text,
        10_000f,
        YogaMeasureMode.EXACTLY,
        10_000f,
        YogaMeasureMode.EXACTLY,
        0.5f,
        ReactConstants.UNSET,
        true,
        Layout.BREAK_STRATEGY_SIMPLE,
        Layout.HYPHENATION_FREQUENCY_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        0,
        newPaint(),
    )

    assertThat(largestFontSize(text)).isEqualTo(LARGE_FONT_SIZE)
  }

  // Uses a height no font size can satisfy so the text is shrunk all the way to the minimum.
  private fun adjustToUnsatisfiableHeight(text: SpannableString, minimumFontScale: Float) {
    TextLayoutManager.adjustSpannableFontToFit(
        text,
        10_000f,
        YogaMeasureMode.EXACTLY,
        1f,
        YogaMeasureMode.EXACTLY,
        minimumFontScale,
        ReactConstants.UNSET,
        true,
        Layout.BREAK_STRATEGY_SIMPLE,
        Layout.HYPHENATION_FREQUENCY_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        0,
        newPaint(),
    )
  }

  private fun spannableWithFontSize(fontSize: Int): SpannableString {
    val text = SpannableString("Hello")
    text.setSpan(ReactAbsoluteSizeSpan(fontSize), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    return text
  }

  private fun newPaint(): TextPaint =
      TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = LARGE_FONT_SIZE.toFloat() }

  private fun largestFontSize(text: Spanned): Int =
      text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java).maxOfOrNull { it.size } ?: 0

  private companion object {
    const val SMALL_FONT_SIZE = 10
    const val LARGE_FONT_SIZE = 40
  }
}
