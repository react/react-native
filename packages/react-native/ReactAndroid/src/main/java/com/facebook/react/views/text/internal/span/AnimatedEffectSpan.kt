/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.text.Layout
import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * A span which draws an animated effect on top of text. Each frame, [onDraw] is called with the
 * time since the last frame. Return true to request another frame, false to stop animating.
 */
@UnstableReactNativeAPI
public interface AnimatedEffectSpan : StatefulSpan {
  /**
   * Called each frame to draw an animated effect on top of text.
   *
   * @param start the start offset of this span within the text
   * @param end the end offset of this span within the text
   * @param canvas the canvas to draw on
   * @param layout the text layout
   * @param deltaNanos nanoseconds since the last frame, or 0 on the first frame
   * @return true to request another frame, false to stop animating
   */
  public fun onDraw(
      start: Int,
      end: Int,
      canvas: Canvas,
      layout: Layout,
      deltaNanos: Long,
  ): Boolean
}
