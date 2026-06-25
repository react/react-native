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
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import kotlin.math.roundToInt

internal const val MIN_INSET_BOX_SHADOW_SDK_VERSION = 29

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

private val ZERO_RADII = floatArrayOf(0f, 0f, 0f, 0f, 0f, 0f, 0f, 0f)

/** Draws an inner box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(MIN_INSET_BOX_SHADOW_SDK_VERSION)
internal class InsetBoxShadowDrawable(
    private val context: Context,
    private val shadowColor: Int,
    private val offsetX: Float,
    private val offsetY: Float,
    private val blurRadius: Float,
    private val spread: Float,
    /*
     * We assume borderRadius & borderInsets to be shared across multiple drawables
     * therefore user should invalidate this drawable when changing either of them
     */
    var borderInsets: BorderInsets? = null,
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
    val computedBorderRadii = computeBorderRadii()
    val computedBorderInsets = computeBorderInsets()

    val paddingBoxRect =
        RectF(
            bounds.left + (computedBorderInsets?.left ?: 0f),
            bounds.top + (computedBorderInsets?.top ?: 0f),
            bounds.right - (computedBorderInsets?.right ?: 0f),
            bounds.bottom - (computedBorderInsets?.bottom ?: 0f),
        )
    val paddingBoxRadii = computedBorderRadii?.let {
      floatArrayOf(
          innerRadius(it.topLeft.horizontal, computedBorderInsets?.left),
          innerRadius(it.topLeft.vertical, computedBorderInsets?.top),
          innerRadius(it.topRight.horizontal, computedBorderInsets?.right),
          innerRadius(it.topRight.vertical, computedBorderInsets?.top),
          innerRadius(it.bottomRight.horizontal, computedBorderInsets?.right),
          innerRadius(it.bottomRight.vertical, computedBorderInsets?.bottom),
          innerRadius(it.bottomLeft.horizontal, computedBorderInsets?.left),
          innerRadius(it.bottomLeft.vertical, computedBorderInsets?.bottom),
      )
    }

    val x = offsetX.dpToPx()
    val y = offsetY.dpToPx()
    val spreadExtent = spread.dpToPx()
    val innerRect =
        RectF(paddingBoxRect).apply {
          if (2 * spreadExtent > paddingBoxRect.width()) {
            setEmpty()
          } else {
            inset(spreadExtent, spreadExtent)
          }
          offset(x, y)
        }

    // Graciously stolen from Blink
    // https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/paint/box_painter_base.cc;l=338;drc=0a301506035e13015ea5c8dd39164d0d5954fa60
    val blurExtent = FilterHelper.sigmaToRadius(blurRadius)
    val outerRect =
        RectF(innerRect).apply {
          set(paddingBoxRect)
          inset(-blurExtent, -blurExtent)
          union(RectF(innerRect))
        }

    canvas.save().let { saveCount ->
      if (paddingBoxRadii != null) {
        canvas.clipPath(
            Path().apply { addRoundRect(paddingBoxRect, paddingBoxRadii, Path.Direction.CW) }
        )

        val innerRadii =
            paddingBoxRadii.map { adjustRadiusForSpread(it, -spreadExtent) }.toFloatArray()

        canvas.drawDoubleRoundRect(outerRect, ZERO_RADII, innerRect, innerRadii, shadowPaint)
      } else {
        canvas.clipRect(paddingBoxRect)
        canvas.drawDoubleRoundRect(outerRect, ZERO_RADII, innerRect, ZERO_RADII, shadowPaint)
      }

      canvas.restoreToCount(saveCount)
    }
  }

  private fun computeBorderRadii(): ComputedBorderRadius? {
    val resolvedBorderRadii =
        borderRadius?.resolve(
            layoutDirection,
            context,
            bounds.width().toFloat().pxToDp(),
            bounds.height().toFloat().pxToDp(),
        )

    return if (resolvedBorderRadii?.hasRoundedBorders() == true) {
      ComputedBorderRadius(
          topLeft =
              CornerRadii(
                  resolvedBorderRadii.topLeft.horizontal.dpToPx(),
                  resolvedBorderRadii.topLeft.vertical.dpToPx(),
              ),
          topRight =
              CornerRadii(
                  resolvedBorderRadii.topRight.horizontal.dpToPx(),
                  resolvedBorderRadii.topRight.vertical.dpToPx(),
              ),
          bottomLeft =
              CornerRadii(
                  resolvedBorderRadii.bottomLeft.horizontal.dpToPx(),
                  resolvedBorderRadii.bottomLeft.vertical.dpToPx(),
              ),
          bottomRight =
              CornerRadii(
                  resolvedBorderRadii.bottomRight.horizontal.dpToPx(),
                  resolvedBorderRadii.bottomRight.vertical.dpToPx(),
              ),
      )
    } else {
      null
    }
  }

  private fun computeBorderInsets(): RectF? =
      borderInsets?.resolve(layoutDirection, context)?.let {
        RectF(it.left.dpToPx(), it.top.dpToPx(), it.right.dpToPx(), it.bottom.dpToPx())
      }

  private fun innerRadius(radius: Float, borderInset: Float?): Float =
      (radius - (borderInset ?: 0f)).coerceAtLeast(0f)
}
