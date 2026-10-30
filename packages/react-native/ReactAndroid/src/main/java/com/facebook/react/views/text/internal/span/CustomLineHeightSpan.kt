/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Paint.FontMetricsInt
import android.text.Spanned
import android.text.TextPaint
import android.text.style.LineHeightSpan
import android.text.style.MetricAffectingSpan
import android.text.style.ReplacementSpan
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/**
 * Implements a [LineHeightSpan] which follows web-like behavior for line height, unlike
 * LineHeightSpan.Standard which only effects space between the baselines of adjacent line boxes
 * (does not impact space before the first line or after the last).
 */
internal class CustomLineHeightSpan(height: Float) : LineHeightSpan.WithDensity, ReactSpan {
  val lineHeight: Int = ceil(height.toDouble()).toInt()

  override fun chooseHeight(
      text: CharSequence,
      start: Int,
      end: Int,
      spanstartv: Int,
      v: Int,
      fm: FontMetricsInt,
  ) {
    chooseHeight(text, start, end, spanstartv, v, fm, null)
  }

  override fun chooseHeight(
      text: CharSequence,
      start: Int,
      end: Int,
      spanstartv: Int,
      v: Int,
      fm: FontMetricsInt,
      paint: TextPaint?,
  ) {
    // The line metrics passed in already include the size of any inline views on the line, which
    // sit on the baseline with their full height as ascent. Derive the half-leading from the font
    // alone, then grow the line box to contain the inline views, as CSS does for inline replaced
    // elements. Otherwise a tall inline view moves the baseline below the bottom of the line box.
    val inlineViewHeight = maxInlineViewHeight(text, start, end)
    if (inlineViewHeight > 0 && paint != null) {
      val fontMetrics = fontMetricsAt(text as Spanned, start, end, paint)
      fm.ascent = fontMetrics.ascent
      fm.descent = fontMetrics.descent
    }

    // https://www.w3.org/TR/css-inline-3/#inline-height
    // When its computed line-height is not normal, its layout bounds are derived solely from
    // metrics of its first available font (ignoring glyphs from other fonts), and leading is used
    // to adjust the effective A and D to add up to the used line-height. Calculate the leading L as
    // L = line-height - (A + D). Half the leading (its half-leading) is added above A of the first
    // available font, and the other half below D of the first available font, giving an effective
    // ascent above the baseline of A′ = A + L/2, and an effective descent of D′ = D + L/2. However,
    // if line-fit-edge is not leading and this is not the root inline box, if the half-leading is
    // positive, treat it as zero. The layout bounds exactly encloses this effective A′ and D′.

    val leading = lineHeight - ((-fm.ascent) + fm.descent)
    fm.ascent -= ceil(leading / 2.0f).toInt()
    fm.descent += floor(leading / 2.0f).toInt()

    if (inlineViewHeight > 0) {
      fm.ascent = min(fm.ascent, -inlineViewHeight)
      fm.descent = max(fm.descent, 0)
    }

    // The top of the first line, and the bottom of the last line, may influence bounds of the
    // paragraph, so we match them to the text ascent/descent. It is otherwise desirable to allow
    // line boxes to overlap (to allow too large glyphs to be drawn outside them), so we do not
    // adjust the top/bottom of interior line-boxes.
    if (start == 0) {
      fm.top = fm.ascent
    }
    if (end == text.length) {
      fm.bottom = fm.descent
    }
  }

  private fun maxInlineViewHeight(text: CharSequence, start: Int, end: Int): Int {
    if (text !is Spanned) {
      return 0
    }
    var height = 0
    for (span in text.getSpans(start, end, TextInlineViewPlaceholderSpan::class.java)) {
      height = max(height, span.height)
    }
    return height
  }

  private fun fontMetricsAt(text: Spanned, start: Int, end: Int, paint: TextPaint): FontMetricsInt {
    val textPaint = TextPaint(paint)
    var offset = start
    while (
        offset < end &&
            text
                .getSpans(offset, offset + 1, TextInlineViewPlaceholderSpan::class.java)
                .isNotEmpty()
    ) {
      offset++
    }
    if (offset < end) {
      for (span in text.getSpans(offset, offset + 1, MetricAffectingSpan::class.java)) {
        if (span !is ReplacementSpan) {
          span.updateMeasureState(textPaint)
        }
      }
    }
    return textPaint.fontMetricsInt
  }
}
