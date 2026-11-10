/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.annotation.SuppressLint
import android.graphics.Paint
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.MetricAffectingSpan
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@SuppressLint("NewApi")
@RunWith(RobolectricTestRunner::class)
class CustomLineHeightSpanTest {

  @Test
  fun tightLineHeightDoesNotClipFirstOrLastLineFontBounds() {
    val span = CustomLineHeightSpan(16f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -18
          ascent = -14
          descent = 6
          bottom = 8
        }

    span.chooseHeight("gjpqy", 0, 5, 0, 0, fm)

    assertThat(fm.ascent).isEqualTo(-12)
    assertThat(fm.descent).isEqualTo(4)
    assertThat(fm.top).isEqualTo(-12)
    assertThat(fm.bottom).isEqualTo(4)
  }

  @Test
  fun looseLineHeightStillExpandsFirstAndLastLineBounds() {
    val span = CustomLineHeightSpan(24f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -18
          ascent = -14
          descent = 6
          bottom = 8
        }

    span.chooseHeight("gjpqy", 0, 5, 0, 0, fm)

    assertThat(fm.ascent).isEqualTo(-16)
    assertThat(fm.descent).isEqualTo(8)
    assertThat(fm.top).isEqualTo(-16)
    assertThat(fm.bottom).isEqualTo(8)
  }

  @Test
  fun tightLineHeightDoesNotExpandStaticLayoutHeightWithFontPadding() {
    val layout = buildStaticLayout("gjpqy\ngjpqy\ngjpqy", lineHeight = 24)

    assertThat(layout.lineCount).isEqualTo(3)
    assertThat(layout.height).isEqualTo(72)
  }

  @Test
  fun tightLineHeightDoesNotExpandSingleLineStaticLayoutHeightWithFontPadding() {
    val layout = buildStaticLayout("gjpqy", lineHeight = 24)

    assertThat(layout.lineCount).isEqualTo(1)
    assertThat(layout.height).isEqualTo(24)
  }

  @Test
  fun inlineViewTallerThanLineHeightGrowsLineBoxAroundTextAndView() {
    val paint = TextPaint().apply { textSize = 24f }
    val text = SpannableString("ab\uFFFC")
    text.setSpan(
        CustomLineHeightSpan(24f, inlineViews = InlineViewHeights()),
        0,
        2,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    text.setSpan(
        TextInlineViewPlaceholderSpan(reactTag = 1, width = 40, height = 40),
        2,
        3,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    val fontMetrics = paint.fontMetricsInt
    val leading = 24 - (-fontMetrics.ascent + fontMetrics.descent)
    val textDescent = fontMetrics.descent + Math.floorDiv(leading, 2)

    val layout =
        StaticLayout.Builder.obtain(text, 0, text.length, paint, 400)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setIncludePad(true)
            .setLineSpacing(0f, 1f)
            .build()

    assertThat(layout.lineCount).isEqualTo(1)
    assertThat(layout.getLineBaseline(0) - layout.getLineTop(0)).isEqualTo(40)
    assertThat(layout.getLineBottom(0) - layout.getLineBaseline(0)).isEqualTo(maxOf(textDescent, 0))
  }

  @Test
  fun lineWithOnlyAnInlineViewMeasuresTheLineHeightTextFont() {
    val span = CustomLineHeightSpan(60f, inlineViews = InlineViewHeights())
    val textFont = RecordingMetricAffectingSpan()
    val text = SpannableString("ab\uFFFC")
    text.setSpan(textFont, 0, 2, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(span, 0, 2, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(
        TextInlineViewPlaceholderSpan(reactTag = 1, width = 80, height = 80),
        2,
        3,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    val fm =
        Paint.FontMetricsInt().apply {
          top = -80
          ascent = -80
          descent = 0
          bottom = 0
        }

    span.chooseHeight(text, 2, 3, 0, 0, fm, TextPaint())

    assertThat(textFont.measured).isTrue()
    assertThat(fm.ascent).isEqualTo(-80)
    assertThat(fm.descent).isGreaterThanOrEqualTo(0)
    assertThat(fm.bottom).isEqualTo(fm.descent)
  }

  @Test
  fun withoutPaintInlineViewKeepsTheLineHeightOfTextWithoutInlineViews() {
    val text = SpannableString("ab\uFFFC")
    val span = CustomLineHeightSpan(60f, inlineViews = InlineViewHeights())
    text.setSpan(span, 0, 2, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(
        TextInlineViewPlaceholderSpan(reactTag = 1, width = 80, height = 80),
        2,
        3,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    fun inlineViewMetrics() =
        Paint.FontMetricsInt().apply {
          top = -80
          ascent = -80
          descent = 0
          bottom = 0
        }
    val fm = inlineViewMetrics()
    val expected = inlineViewMetrics()

    span.chooseHeight(text, 0, 3, 0, 0, fm)
    CustomLineHeightSpan(60f).chooseHeight(text, 0, 3, 0, 0, expected)

    assertThat(fm.ascent).isEqualTo(expected.ascent)
    assertThat(fm.descent).isEqualTo(expected.descent)
    assertThat(fm.top).isEqualTo(expected.top)
    assertThat(fm.bottom).isEqualTo(expected.bottom)
  }

  @Test
  fun inlineViewStartingBeforeTheLineStillGrowsIt() {
    val span = CustomLineHeightSpan(24f, inlineViews = InlineViewHeights())
    val text = SpannableString("abc\uFFFC\uFFFC")
    text.setSpan(span, 0, 3, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(
        TextInlineViewPlaceholderSpan(reactTag = 1, width = 40, height = 40),
        3,
        5,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    val fm =
        Paint.FontMetricsInt().apply {
          top = -40
          ascent = -40
          descent = 0
          bottom = 0
        }

    span.chooseHeight(text, 4, 5, 0, 0, fm, TextPaint())

    assertThat(fm.ascent).isEqualTo(-40)
    assertThat(fm.descent).isGreaterThanOrEqualTo(0)
  }

  @Test
  fun inlineViewShorterThanLineHeightKeepsLineHeight() {
    val layout = buildStaticLayout("ab\uFFFC", lineHeight = 24, inlineViewHeight = 10)

    assertThat(layout.lineCount).isEqualTo(1)
    assertThat(layout.height).isEqualTo(24)
  }

  private fun buildStaticLayout(
      text: String,
      lineHeight: Int,
      inlineViewHeight: Int? = null,
  ): StaticLayout {
    val spannable = SpannableString(text)
    val textEnd = if (inlineViewHeight == null) text.length else text.length - 1
    spannable.setSpan(
        CustomLineHeightSpan(
            lineHeight.toFloat(),
            inlineViews = inlineViewHeight?.let { InlineViewHeights() },
        ),
        0,
        textEnd,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    if (inlineViewHeight != null) {
      spannable.setSpan(
          TextInlineViewPlaceholderSpan(reactTag = 1, width = 10, height = inlineViewHeight),
          textEnd,
          text.length,
          Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
      )
    }

    return StaticLayout.Builder.obtain(
            spannable,
            0,
            spannable.length,
            TextPaint().apply { textSize = 24f },
            400,
        )
        .setAlignment(Layout.Alignment.ALIGN_NORMAL)
        .setIncludePad(true)
        .setLineSpacing(0f, 1f)
        .build()
  }

  private class RecordingMetricAffectingSpan : MetricAffectingSpan() {
    var measured = false

    override fun updateMeasureState(textPaint: TextPaint) {
      measured = true
    }

    override fun updateDrawState(textPaint: TextPaint) = Unit
  }
}
