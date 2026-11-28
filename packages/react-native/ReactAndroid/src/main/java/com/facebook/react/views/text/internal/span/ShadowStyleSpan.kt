/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.TextPaint
import android.text.style.CharacterStyle

internal class ShadowStyleSpan(
    private val dx: Float,
    private val dy: Float,
    private val radius: Float,
    val color: Int,
) : CharacterStyle(), ReactSpan {
  override fun updateDrawState(textPaint: TextPaint) {
    // A radius of 0 removes the shadow layer, so use the smallest positive radius to draw a sharp
    // shadow instead.
    textPaint.setShadowLayer(maxOf(radius, Float.MIN_VALUE), dx, dy, color)
  }
}
