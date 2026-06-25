/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.graphics.Color
import android.text.Layout
import com.facebook.react.views.text.TextDecorationStyle
import com.facebook.react.views.text.drawSpannedDecoration

/**
 * Draws a strikethrough whose color and style may differ from the text. The line is painted in
 * `onDraw` after the layout renders its text. We do NOT extend
 * [android.text.style.StrikethroughSpan] here: the framework's `Layout.draw` paints the
 * strikethrough using `paint.color` with no field to override, so painting it ourselves is the only
 * way to get a distinct color or non-solid style.
 *
 * `color == Color.TRANSPARENT` falls back to the text foreground color.
 */
internal class ReactStrikethroughSpan(
    private val color: Int = Color.TRANSPARENT,
    private val style: TextDecorationStyle = TextDecorationStyle.SOLID,
) : CanvasEffectSpan(), ReactSpan {

  override fun onDraw(start: Int, end: Int, canvas: Canvas, layout: Layout) {
    drawSpannedDecoration(start, end, canvas, layout, color, style) { paint, baseline, _ ->
      // Strikethrough sits near the x-height midline. `fontMetrics.ascent`
      // is negative and `descent` is positive, so the sum / 2 gives a
      // small negative offset from the baseline; the trailing `+ 1f`
      // nudges it down to match the visual position users expect.
      val fm = paint.fontMetrics
      baseline + (fm.ascent + fm.descent) / 2f + 1f
    }
  }
}
