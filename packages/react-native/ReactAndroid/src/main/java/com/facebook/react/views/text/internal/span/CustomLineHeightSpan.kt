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
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import kotlin.math.ceil
import kotlin.math.floor

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

  override fun chooseHeight(
      text: CharSequence,
      start: Int,
      end: Int,
      spanstartv: Int,
      v: Int,
      fm: FontMetricsInt,
      paint: TextPaint,
  ) {
    val spanned = text as? Spanned
    if (
        !ReactNativeFeatureFlags.fixTextInlineViewLineHeight() ||
            spanned == null ||
            !containsInlineView(spanned)
    ) {
      chooseHeight(text, start, end, spanstartv, v, fm)
      return
    }

    // If text contains an inline view anywhere, remeasure fm before calling chooseHeight() to avoid
    // clipping the view. StaticLayout seeds the next line's fm with this line's if a text run
    // wraps, so remeasurement is needed even if an inline view doesn't exist on the current line.
    val inlineViewHeight = maxInlineViewHeight(spanned, start, end)
    measureTextRuns(spanned, start, end, paint, fm)
    chooseHeight(text, start, end, spanstartv, v, fm)
    if (-fm.ascent < inlineViewHeight) {
      fm.ascent = -inlineViewHeight
      fm.top = minOf(fm.top, fm.ascent)
    }
  }

  /**
   * Sets [fm] to the combined font metrics of the text in [start, end), excluding inline views.
   *
   * The line is split into runs at each [MetricAffectingSpan] transition. Each run that is not an
   * inline view placeholder is measured with [basePaint] after applying that run's spans (font
   * size, typeface, etc.), and [fm] encloses the tallest ascent and deepest descent across runs. If
   * the line has no text runs (only inline views), [fm] falls back to the metrics of [basePaint],
   * matching the strut of a CSS line box.
   *
   * Only the primary font of each run is measured, so unlike StaticLayout, glyphs drawn with a
   * fallback font (such as emoji) do not contribute to the metrics.
   */
  private fun measureTextRuns(
      text: Spanned,
      start: Int,
      end: Int,
      basePaint: TextPaint,
      fm: FontMetricsInt,
  ) {
    val runPaint = TextPaint()
    val runFm = FontMetricsInt()
    fm.top = 0
    fm.ascent = 0
    fm.descent = 0
    fm.bottom = 0
    var hasTextRun = false
    var runStart = start
    while (runStart < end) {
      val runEnd = text.nextSpanTransition(runStart, end, MetricAffectingSpan::class.java)
      if (text.getSpans(runStart, runEnd, TextInlineViewPlaceholderSpan::class.java).isEmpty()) {
        hasTextRun = true
        runPaint.set(basePaint)
        text.getSpans(runStart, runEnd, MetricAffectingSpan::class.java).forEach {
          it.updateMeasureState(runPaint)
        }
        runPaint.getFontMetricsInt(runFm)
        fm.top = minOf(fm.top, runFm.top)
        fm.ascent = minOf(fm.ascent, runFm.ascent)
        fm.descent = maxOf(fm.descent, runFm.descent)
        fm.bottom = maxOf(fm.bottom, runFm.bottom)
      }
      runStart = runEnd
    }
    if (!hasTextRun) {
      basePaint.getFontMetricsInt(fm)
    }
  }

  /** Returns whether [text] contains an inline view anywhere, not just on the current line. */
  private fun containsInlineView(text: Spanned): Boolean {
    val firstTransition =
        text.nextSpanTransition(0, text.length, TextInlineViewPlaceholderSpan::class.java)
    return firstTransition < text.length
  }

  /** Returns the height of the tallest inline view in [start, end), or 0 if there are none. */
  private fun maxInlineViewHeight(text: Spanned, start: Int, end: Int): Int =
      text.getSpans(start, end, TextInlineViewPlaceholderSpan::class.java).maxOfOrNull { it.height }
          ?: 0
}
