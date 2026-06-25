/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.text.Layout

/**
 * A span which draws a static effect on top of text. [onPreDraw] and [onDraw] hooks are called
 * during [PreparedLayoutTextView] drawing, providing glyph layout information for custom rendering.
 */
public abstract class CanvasEffectSpan : TextEffectSpan {
  /**
   * Called before the text is drawn. This happens after the Paragraph component has drawn its
   * background, but may be called before text spans with their own background color are drawn.
   */
  public open fun onPreDraw(start: Int, end: Int, canvas: Canvas, layout: Layout): Unit = Unit

  /** Called after the text is drawn, including some effects like text shadows */
  public open fun onDraw(start: Int, end: Int, canvas: Canvas, layout: Layout): Unit = Unit
}
