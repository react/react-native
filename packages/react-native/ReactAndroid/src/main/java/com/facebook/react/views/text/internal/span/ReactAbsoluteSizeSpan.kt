/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.TextPaint
import android.text.style.MetricAffectingSpan

internal class ReactAbsoluteSizeSpan(val size: Int) : MetricAffectingSpan(), ReactSpan {
  override fun updateDrawState(textPaint: TextPaint) {
    textPaint.textSize = size.toFloat()
  }

  override fun updateMeasureState(textPaint: TextPaint) {
    textPaint.textSize = size.toFloat()
  }
}
