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
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@SuppressLint("InlinedApi")
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
  fun `explicit minimumFontSize is used as the floor`() {
    val text = spannableWithFontSize(LARGE_FONT_SIZE)

    adjustToUnsatisfiableHeight(text, minimumFontSize = 12f, minimumFontScale = Float.NaN)

    assertThat(largestFontSize(text)).isEqualTo(12)
  }

  @Test
  fun `explicit minimumFontSize takes precedence over minimumFontScale`() {
    val text = spannableWithFontSize(LARGE_FONT_SIZE)

    adjustToUnsatisfiableHeight(text, minimumFontSize = 12f, minimumFontScale = 0.5f)

    assertThat(largestFontSize(text)).isEqualTo(12)
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
        Float.NaN,
        0.5f,
        ReactConstants.UNSET,
        true,
        Layout.BREAK_STRATEGY_SIMPLE,
        Layout.HYPHENATION_FREQUENCY_NONE,
        /* lineBreakStyle = */ LineBreakConfig.LINE_BREAK_STYLE_NONE,
        /* lineBreakWordStyle = */ LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        0,
        newPaint(),
    )

    assertThat(largestFontSize(text)).isEqualTo(LARGE_FONT_SIZE)
  }

  @Test
  fun `text that already fits keeps its font size at every size`() {
    val shrunkFontSizes =
        (8..120).filter { fontSize ->
          val text = spannableWithFontSize(fontSize)
          adjustToFit(text, height = 10_000f, minimumFontScale = Float.NaN)
          largestFontSize(text) != fontSize
        }

    assertThat(shrunkFontSizes).isEmpty()
  }

  @Test
  fun `smaller font sizes are kept when the text already fits`() {
    val text = spannableWithSmallAndLargeFontSizes()

    adjustToFit(text, height = 10_000f, minimumFontScale = Float.NaN)

    assertThat(fontSizes(text)).containsExactly(LARGE_FONT_SIZE, SMALL_FONT_SIZE)
  }

  @Test
  fun `minimumFontScale does not grow smaller font sizes`() {
    val text = spannableWithSmallAndLargeFontSizes()

    adjustToFit(text, height = 10_000f, minimumFontScale = 0.5f)

    assertThat(fontSizes(text)).containsExactly(LARGE_FONT_SIZE, SMALL_FONT_SIZE)
  }

  @Test
  @GraphicsMode(GraphicsMode.Mode.NATIVE) // Real font metrics, so the height depends on font size.
  fun `smaller font sizes shrink in proportion to the largest one`() {
    val text = spannableWithSmallAndLargeFontSizes(smallFontSize = 20)
    // The height of the text at half its font sizes, with a minimum well below that.
    val height =
        layoutHeight(spannableWithSmallAndLargeFontSizes(largeFontSize = 20, smallFontSize = 10))

    adjustToFit(text, height = height, minimumFontScale = 0.1f)

    assertThat(fontSizes(text)).containsExactly(20, 10)
  }

  @Test
  fun `shrunk font sizes are clamped to the minimum font size`() {
    val text = spannableWithSmallAndLargeFontSizes()

    adjustToUnsatisfiableHeight(text, minimumFontScale = 0.5f)

    // Like iOS, every font size is clamped to the minimum derived from the largest one.
    val minimumFontSize = (LARGE_FONT_SIZE * 0.5f).toInt()
    assertThat(fontSizes(text)).containsExactly(minimumFontSize, minimumFontSize)
  }

  // Uses a height no font size can satisfy so the text is shrunk all the way to the minimum.
  private fun adjustToUnsatisfiableHeight(
      text: SpannableString,
      minimumFontScale: Float,
      minimumFontSize: Float = Float.NaN,
  ) {
    TextLayoutManager.adjustSpannableFontToFit(
        text,
        10_000f,
        YogaMeasureMode.EXACTLY,
        1f,
        YogaMeasureMode.EXACTLY,
        minimumFontSize,
        minimumFontScale,
        ReactConstants.UNSET,
        true,
        Layout.BREAK_STRATEGY_SIMPLE,
        Layout.HYPHENATION_FREQUENCY_NONE,
        /* lineBreakStyle = */ LineBreakConfig.LINE_BREAK_STYLE_NONE,
        /* lineBreakWordStyle = */ LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        0,
        newPaint(),
    )
  }

  private fun adjustToFit(text: SpannableString, height: Float, minimumFontScale: Float) {
    TextLayoutManager.adjustSpannableFontToFit(
        text,
        10_000f,
        YogaMeasureMode.EXACTLY,
        height,
        YogaMeasureMode.EXACTLY,
        Float.NaN,
        minimumFontScale,
        ReactConstants.UNSET,
        true,
        Layout.BREAK_STRATEGY_SIMPLE,
        Layout.HYPHENATION_FREQUENCY_NONE,
        /* lineBreakStyle = */ LineBreakConfig.LINE_BREAK_STYLE_NONE,
        /* lineBreakWordStyle = */ LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
        Layout.Alignment.ALIGN_NORMAL,
        0,
        newPaint(),
    )
  }

  // "Total " at the large font size followed by "USD" at the small one.
  private fun spannableWithSmallAndLargeFontSizes(
      largeFontSize: Int = LARGE_FONT_SIZE,
      smallFontSize: Int = SMALL_FONT_SIZE,
  ): SpannableString {
    val text = SpannableString("Total USD")
    text.setSpan(ReactAbsoluteSizeSpan(largeFontSize), 0, 6, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(
        ReactAbsoluteSizeSpan(smallFontSize),
        6,
        text.length,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    return text
  }

  private fun layoutHeight(text: SpannableString): Float {
    val paint = newPaint().apply { textSize = largestFontSize(text).toFloat() }
    return StaticLayout.Builder.obtain(text, 0, text.length, paint, 10_000)
        .setIncludePad(true)
        .build()
        .height
        .toFloat()
  }

  // Font sizes in text order.
  private fun fontSizes(text: Spanned): List<Int> =
      text
          .getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java)
          .sortedBy { text.getSpanStart(it) }
          .map { it.size }

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
