/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import kotlin.math.roundToInt

internal open class BackgroundDrawable(
    private val context: Context,
    /*
     * We assume borderRadius & borderInsets to be shared across multiple drawables
     * therefore we should manually invalidate this drawable when changing either of them
     */
    var borderRadius: BorderRadiusStyle? = null,
    var borderInsets: BorderInsets? = null,
) : Drawable() {
  /**
   * There is a small gap between the edges of adjacent paths, such as between its Border and its
   * Outline. The smallest amount (found to be 0.8f) is used to shrink outline's path, overlapping
   * them and closing the visible gap.
   */
  private val pathAdjustment = 0.8f
  private var computedBorderInsets: RectF? = null
  private var computedBorderRadius: ComputedBorderRadius? = null
  private var needUpdatePath = true

  var backgroundColor: Int = Color.TRANSPARENT
    set(value) {
      if (field != value) {
        field = value
        backgroundPaint.color = value
        invalidateSelf()
      }
    }

  private var backgroundRect: RectF = RectF()
  private var backgroundRenderPath: Path? = null

  private val backgroundPaint: Paint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = backgroundColor
      }

  override fun invalidateSelf() {
    needUpdatePath = true
    super.invalidateSelf()
  }

  override fun onBoundsChange(bounds: Rect) {
    super.onBoundsChange(bounds)
    needUpdatePath = true
  }

  override fun setAlpha(alpha: Int) {
    backgroundPaint.alpha =
        (((alpha / 255f) * (Color.alpha(backgroundColor) / 255f)) * 255f).roundToInt()
    invalidateSelf()
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    // do nothing
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int {
    val alpha = backgroundPaint.alpha
    return when (alpha) {
      255 -> PixelFormat.OPAQUE
      in 1..254 -> PixelFormat.TRANSLUCENT
      else -> PixelFormat.TRANSPARENT
    }
  }

  override fun draw(canvas: Canvas) {
    updatePath()
    canvas.save()

    // Draws the View without its border first (with background color fill)
    if (backgroundPaint.alpha != 0) {
      if (computedBorderRadius?.isUniform() == true && borderRadius?.hasRoundedBorders() == true) {
        canvas.drawRoundRect(
            backgroundRect,
            computedBorderRadius?.topLeft?.horizontal?.dpToPx() ?: 0f,
            computedBorderRadius?.topLeft?.vertical?.dpToPx() ?: 0f,
            backgroundPaint,
        )
      } else if (borderRadius?.hasRoundedBorders() != true) {
        canvas.drawRect(backgroundRect, backgroundPaint)
      } else {
        canvas.drawPath(checkNotNull(backgroundRenderPath), backgroundPaint)
      }
    }

    canvas.restore()
  }

  private fun computeBorderInsets(): RectF =
      borderInsets?.resolve(layoutDirection, context).let {
        RectF(
            it?.left?.dpToPx() ?: 0f,
            it?.top?.dpToPx() ?: 0f,
            it?.right?.dpToPx() ?: 0f,
            it?.bottom?.dpToPx() ?: 0f,
        )
      }

  private fun updatePath() {
    if (!needUpdatePath) {
      return
    }
    needUpdatePath = false

    backgroundRect.set(bounds)

    computedBorderInsets = computeBorderInsets()
    computedBorderRadius =
        borderRadius?.resolve(
            layoutDirection,
            context,
            bounds.width().pxToDp(),
            bounds.height().pxToDp(),
        )
    val hasBorder =
        (computedBorderInsets?.left != 0f ||
            computedBorderInsets?.top != 0f ||
            computedBorderInsets?.right != 0f ||
            computedBorderInsets?.bottom != 0f)

    if (
        computedBorderRadius?.hasRoundedBorders() == true &&
            computedBorderRadius?.isUniform() == false
    ) {
      backgroundRenderPath = backgroundRenderPath ?: Path()
      backgroundRenderPath?.reset()
    }

    /**
     * The background bleeds a bit outside of the borderDrawable. pathAdjustment is used to slightly
     * shrink the rectangle (backgroundRect), ensuring the border can be drawn on top without the
     * gap.
     */
    if (hasBorder && borderRadius?.hasRoundedBorders() == true) {
      backgroundRect.left += pathAdjustment
      backgroundRect.top += pathAdjustment
      backgroundRect.right -= pathAdjustment
      backgroundRect.bottom -= pathAdjustment
    }

    if (borderRadius?.hasRoundedBorders() == true && computedBorderRadius?.isUniform() != true) {

      backgroundRenderPath?.addRoundRect(
          backgroundRect,
          floatArrayOf(
              computedBorderRadius?.topLeft?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.topLeft?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.topRight?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.topRight?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomRight?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomRight?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomLeft?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomLeft?.vertical?.dpToPx() ?: 0f,
          ),
          Path.Direction.CW,
      )
    }
  }
}
