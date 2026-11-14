/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.DrawableWrapper
import com.facebook.react.uimanager.style.BorderRadiusStyle

/** Mask for a bounded [android.graphics.drawable.RippleDrawable] that follows the border radius. */
internal class RippleMaskDrawable private constructor(private val background: BackgroundDrawable) :
    DrawableWrapper(background) {

  constructor(
      context: Context
  ) : this(BackgroundDrawable(context).apply { backgroundColor = Color.WHITE })

  var borderRadius: BorderRadiusStyle?
    get() = background.borderRadius
    set(value) {
      background.borderRadius = value
      background.invalidateSelf()
    }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int =
      // RippleDrawable clips to an opaque mask's bounds, but renders a translucent mask into a
      // bitmap to clip to its shape. Only pay for the bitmap when there are corners to round.
      if (borderRadius?.hasRoundedBorders() == true) PixelFormat.TRANSLUCENT else PixelFormat.OPAQUE
}
