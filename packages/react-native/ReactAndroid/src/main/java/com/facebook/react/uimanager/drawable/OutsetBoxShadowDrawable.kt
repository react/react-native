/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.Drawable
import androidx.annotation.RequiresApi
import com.facebook.react.uimanager.FilterHelper
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import kotlin.math.roundToInt

internal const val MIN_OUTSET_BOX_SHADOW_SDK_VERSION = 28

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

/** Draws an outer box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(MIN_OUTSET_BOX_SHADOW_SDK_VERSION)
internal class OutsetBoxShadowDrawable(
    private val context: Context,
    private val shadowColor: Int,
    private val offsetX: Float,
    private val offsetY: Float,
    private val blurRadius: Float,
    private val spread: Float,
    /*
     * We assume borderRadius to be shared across multiple drawables
     * therefore we should manually invalidate this drawable when changing it
     */
    var borderRadius: BorderRadiusStyle? = null,
) : Drawable() {
  private val shadowPaint =
      Paint().apply {
        color = shadowColor
        val convertedBlurRadius = FilterHelper.sigmaToRadius(blurRadius * BLUR_RADIUS_SIGMA_SCALE)
        if (convertedBlurRadius > 0) {
          maskFilter = BlurMaskFilter(convertedBlurRadius, BlurMaskFilter.Blur.NORMAL)
        }
      }

  override fun setAlpha(alpha: Int) {
    shadowPaint.alpha = (((alpha / 255f) * (Color.alpha(shadowColor) / 255f)) * 255f).roundToInt()
    invalidateSelf()
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    shadowPaint.colorFilter = colorFilter
    invalidateSelf()
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int {
    val alpha = shadowPaint.alpha
    return when (alpha) {
      255 -> PixelFormat.OPAQUE
      in 1..254 -> PixelFormat.TRANSLUCENT
      else -> PixelFormat.TRANSPARENT
    }
  }

  override fun draw(canvas: Canvas) {
    val resolutionWidth = bounds.width().toFloat().pxToDp()
    val resolutionHeight = bounds.height().toFloat().pxToDp()
    val computedBorderRadii =
        borderRadius?.resolve(layoutDirection, context, resolutionWidth, resolutionHeight)?.let {
          ComputedBorderRadius(
              topLeft = CornerRadii(it.topLeft.horizontal.dpToPx(), it.topLeft.vertical.dpToPx()),
              topRight =
                  CornerRadii(it.topRight.horizontal.dpToPx(), it.topRight.vertical.dpToPx()),
              bottomLeft =
                  CornerRadii(it.bottomLeft.horizontal.dpToPx(), it.bottomLeft.vertical.dpToPx()),
              bottomRight =
                  CornerRadii(it.bottomRight.horizontal.dpToPx(), it.bottomRight.vertical.dpToPx()),
          )
        }

    val spreadExtent = spread.dpToPx()
    val shadowRect =
        RectF(bounds).apply {
          inset(-spreadExtent, -spreadExtent)
          offset(offsetX.dpToPx(), offsetY.dpToPx())
        }

    canvas.save().let { saveCount ->
      if (computedBorderRadii?.hasRoundedBorders() == true) {
        drawShadowRoundRect(canvas, shadowRect, spreadExtent, computedBorderRadii)
      } else {
        drawShadowRect(canvas, shadowRect)
      }
      canvas.restoreToCount(saveCount)
    }
  }

  private fun drawShadowRoundRect(
      canvas: Canvas,
      shadowRect: RectF,
      spreadExtent: Float,
      computedBorderRadii: ComputedBorderRadius,
  ) {
    // We inset the clip slightly, to avoid Skia artifacts with antialiased
    // clipping. This inset is only visible when no background is present.
    // https://neugierig.org/software/chromium/notes/2010/07/clipping.html
    val subpixelInsetBounds = RectF(bounds).apply { inset(0.4f, 0.4f) }
    canvas.clipOutPath(
        Path().apply {
          addRoundRect(
              subpixelInsetBounds,
              floatArrayOf(
                  computedBorderRadii.topLeft.horizontal,
                  computedBorderRadii.topLeft.vertical,
                  computedBorderRadii.topRight.horizontal,
                  computedBorderRadii.topRight.vertical,
                  computedBorderRadii.bottomRight.horizontal,
                  computedBorderRadii.bottomRight.vertical,
                  computedBorderRadii.bottomLeft.horizontal,
                  computedBorderRadii.bottomLeft.vertical,
              ),
              Path.Direction.CW,
          )
        },
    )

    canvas.drawPath(
        Path().apply {
          addRoundRect(
              shadowRect,
              floatArrayOf(
                  adjustRadiusForSpread(computedBorderRadii.topLeft.horizontal, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.topLeft.vertical, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.topRight.horizontal, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.topRight.vertical, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.bottomRight.horizontal, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.bottomRight.vertical, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.bottomLeft.horizontal, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.bottomLeft.vertical, spreadExtent),
              ),
              Path.Direction.CW,
          )
        },
        shadowPaint,
    )
  }

  private fun drawShadowRect(canvas: Canvas, shadowRect: RectF) {
    canvas.clipOutRect(bounds)
    canvas.drawRect(shadowRect, shadowPaint)
  }
}
