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
 *
 * Pass [inlineViews] when the text contains [TextInlineViewPlaceholderSpan]s, so that lines holding
 * an inline view grow to contain it, as CSS does for inline replaced elements.
 */
internal class CustomLineHeightSpan(
    height: Float,
    private val inlineViews: InlineViewHeights? = null,
) : LineHeightSpan.WithDensity, ReactSpan {
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
    // Inline views sit on the baseline and are already merged into `fm` as ascent, so the
    // half-leading must come from the text's own font metrics. Without a paint those metrics are
    // unknown, so the line keeps the merged metrics and does not grow.
    var inlineViewHeight = 0
    if (paint != null && inlineViews != null && text is Spanned) {
      inlineViewHeight = inlineViews.maxHeight(text, start, end)
      if (inlineViewHeight > 0) {
        val fontMetrics = textFontMetrics(text, paint)
        fm.ascent = fontMetrics.ascent
        fm.descent = fontMetrics.descent
      }
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

  // This span covers exactly the text fragment that declared the line height, never an inline
  // view, so the metric spans over its range carry that fragment's font.
  private fun textFontMetrics(text: Spanned, paint: TextPaint): FontMetricsInt {
    val textPaint = TextPaint(paint)
    val spanStart = text.getSpanStart(this)
    val spanEnd = text.getSpanEnd(this)
    if (spanStart in 0 until spanEnd) {
      for (span in text.getSpans(spanStart, spanEnd, MetricAffectingSpan::class.java)) {
        if (span !is ReplacementSpan) {
          span.updateMeasureState(textPaint)
        }
      }
    }
    return textPaint.fontMetricsInt
  }
}

/**
 * The inline views of one text, shared by all of its [CustomLineHeightSpan]s so that the text is
 * scanned for them once rather than once per span per line.
 */
internal class InlineViewHeights {
  private var starts: IntArray? = null
  private var ends: IntArray = IntArray(0)
  private var heights: IntArray = IntArray(0)

  fun maxHeight(text: Spanned, start: Int, end: Int): Int {
    val starts = this.starts ?: load(text)
    var height = 0
    for (i in starts.indices) {
      if (starts[i] < end && ends[i] > start) {
        height = max(height, heights[i])
      }
    }
    return height
  }

  private fun load(text: Spanned): IntArray {
    val spans = text.getSpans(0, text.length, TextInlineViewPlaceholderSpan::class.java)
    heights = IntArray(spans.size) { spans[it].height }
    ends = IntArray(spans.size) { text.getSpanEnd(spans[it]) }
    return IntArray(spans.size) { text.getSpanStart(spans[it]) }.also { starts = it }
  }
}
