/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Paint.FontMetricsInt
import android.text.style.LineHeightSpan
import kotlin.math.ceil
import kotlin.math.floor

/**
 * Implements a [LineHeightSpan] which follows web-like behavior for line height, unlike
 * LineHeightSpan.Standard which only effects space between the baselines of adjacent line boxes
 * (does not impact space before the first line or after the last).
 */
internal class CustomLineHeightSpan(height: Float) : LineHeightSpan, ReactSpan {
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
}
