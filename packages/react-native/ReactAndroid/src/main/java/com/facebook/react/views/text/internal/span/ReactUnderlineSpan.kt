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
 * Draws an underline whose color and style may differ from the text. The underline is painted in
 * `onDraw` (after the layout renders its text) so it lands on top of any descenders. We do NOT
 * extend [android.text.style.UnderlineSpan] here: the framework's `Layout.draw` reads `paint.color`
 * for underline color regardless of `paint.underlineColor`, so painting it ourselves is the only
 * way to get a distinct color or non-solid style.
 *
 * `color == Color.TRANSPARENT` falls back to the text foreground color.
 */
internal class ReactUnderlineSpan(
    private val color: Int = Color.TRANSPARENT,
    private val style: TextDecorationStyle = TextDecorationStyle.SOLID,
) : CanvasEffectSpan(), ReactSpan {

  override fun onDraw(start: Int, end: Int, canvas: Canvas, layout: Layout) {
    drawSpannedDecoration(start, end, canvas, layout, color, style) { _, baseline, thickness ->
      baseline + thickness + 1f
    }
  }
}
