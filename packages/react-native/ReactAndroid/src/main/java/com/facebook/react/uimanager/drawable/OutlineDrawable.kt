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
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PathEffect
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.Drawable
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import com.facebook.react.uimanager.style.OutlineStyle
import kotlin.math.roundToInt

/** Draws outline https://drafts.csswg.org/css-ui/#outline */
internal class OutlineDrawable(
    private val context: Context,
    /*
     * We assume borderRadius to be shared across multiple drawables
     * therefore we should manually invalidate this drawable when changing it
     */
    var borderRadius: BorderRadiusStyle? = null,
    outlineColor: Int,
    outlineOffset: Float,
    outlineStyle: OutlineStyle,
    outlineWidth: Float,
) : Drawable() {
  /**
   * There is a small gap between the edges of adjacent paths, such as between its Border and its
   * Outline. The smallest amount (found to be 0.8f) is used to shrink outline's path, overlapping
   * them and closing the visible gap.
   */
  private val gapBetweenPaths = 0.8f

  var outlineOffset: Float = outlineOffset
    set(value) {
      if (value != field) {
        field = value
        invalidateSelf()
      }
    }

  var outlineStyle: OutlineStyle = outlineStyle
    set(value) {
      if (value != field) {
        field = value
        outlinePaint.pathEffect = getPathEffect(value, outlineWidth)
        invalidateSelf()
      }
    }

  var outlineColor: Int = outlineColor
    set(value) {
      if (value != field) {
        field = value
        outlinePaint.color = value
        invalidateSelf()
      }
    }

  var outlineWidth: Float = outlineWidth
    set(value) {
      if (value != field) {
        field = value
        outlinePaint.strokeWidth = value
        outlinePaint.pathEffect = getPathEffect(outlineStyle, value)
        invalidateSelf()
      }
    }

  private val outlinePaint: Paint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        color = outlineColor
        strokeWidth = outlineWidth
        pathEffect = getPathEffect(outlineStyle, outlineWidth)
      }

  private var computedBorderRadius: ComputedBorderRadius? = null
  private var tempRectForOutline = RectF()

  private val pathForOutline = Path()

  override fun setAlpha(alpha: Int) {
    outlinePaint.alpha = (((alpha / 255f) * (Color.alpha(outlineColor) / 255f)) * 255f).roundToInt()
    invalidateSelf()
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    outlinePaint.colorFilter = colorFilter
    invalidateSelf()
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int {
    val alpha = outlinePaint.alpha
    return when (alpha) {
      255 -> PixelFormat.OPAQUE
      in 1..254 -> PixelFormat.TRANSLUCENT
      else -> PixelFormat.TRANSPARENT
    }
  }

  override fun draw(canvas: Canvas) {
    if (outlineWidth == 0f) {
      return
    }

    pathForOutline.reset()

    computedBorderRadius =
        borderRadius?.resolve(
            layoutDirection,
            bounds.width().pxToDp(),
            bounds.height().pxToDp(),
        )

    updateOutlineRect()
    if (computedBorderRadius != null && computedBorderRadius?.hasRoundedBorders() == true) {
      drawRoundedOutline(canvas)
    } else {
      drawRectangularOutline(canvas)
    }
  }

  private fun updateOutlineRect() {
    tempRectForOutline.set(bounds)

    tempRectForOutline.top -= outlineWidth * 0.5f + outlineOffset - gapBetweenPaths
    tempRectForOutline.bottom += outlineWidth * 0.5f + outlineOffset - gapBetweenPaths
    tempRectForOutline.left -= outlineWidth * 0.5f + outlineOffset - gapBetweenPaths
    tempRectForOutline.right += outlineWidth * 0.5f + outlineOffset - gapBetweenPaths
  }

  private fun getPathEffect(style: OutlineStyle, outlineWidth: Float): PathEffect? {
    return when (style) {
      OutlineStyle.SOLID -> null
      OutlineStyle.DASHED ->
          DashPathEffect(
              floatArrayOf(outlineWidth * 3, outlineWidth * 3, outlineWidth * 3, outlineWidth * 3),
              0f,
          )
      OutlineStyle.DOTTED ->
          DashPathEffect(floatArrayOf(outlineWidth, outlineWidth, outlineWidth, outlineWidth), 0f)
    }
  }

  private fun calculateRadius(radius: Float, outlineWidth: Float, outlineOffset: Float) =
      if (radius != 0f) radius + (outlineWidth * 0.5f) + outlineOffset else 0f

  private fun drawRectangularOutline(canvas: Canvas) {
    pathForOutline.addRect(tempRectForOutline, Path.Direction.CW)

    canvas.drawPath(pathForOutline, outlinePaint)
  }

  private fun drawRoundedOutline(canvas: Canvas) {
    val topLeftRadius = computedBorderRadius?.topLeft?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val topRightRadius = computedBorderRadius?.topRight?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val bottomLeftRadius = computedBorderRadius?.bottomLeft?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val bottomRightRadius =
        computedBorderRadius?.bottomRight?.toPixelFromDIP() ?: CornerRadii(0f, 0f)

    pathForOutline.addRoundRect(
        tempRectForOutline,
        floatArrayOf(
            calculateRadius(topLeftRadius.horizontal, outlineWidth, outlineOffset),
            calculateRadius(topLeftRadius.vertical, outlineWidth, outlineOffset),
            calculateRadius(topRightRadius.horizontal, outlineWidth, outlineOffset),
            calculateRadius(topRightRadius.vertical, outlineWidth, outlineOffset),
            calculateRadius(bottomRightRadius.horizontal, outlineWidth, outlineOffset),
            calculateRadius(bottomRightRadius.vertical, outlineWidth, outlineOffset),
            calculateRadius(bottomLeftRadius.horizontal, outlineWidth, outlineOffset),
            calculateRadius(bottomLeftRadius.vertical, outlineWidth, outlineOffset),
        ),
        Path.Direction.CW,
    )

    canvas.drawPath(pathForOutline, outlinePaint)
  }
}
