/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.UpdateAppearance

internal class ReactBackgroundColorSpan(val backgroundColor: Int) :
    CharacterStyle(), UpdateAppearance, ReactSpan {
  override fun updateDrawState(textPaint: TextPaint) {
    textPaint.bgColor = backgroundColor
  }
}
