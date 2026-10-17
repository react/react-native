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
import android.graphics.Rect
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

private fun createBlurMaskFilter(blurRadius: Float): BlurMaskFilter? {
  val convertedBlurRadius = FilterHelper.sigmaToRadius(blurRadius * BLUR_RADIUS_SIGMA_SCALE)
  return if (convertedBlurRadius > 0) {
    BlurMaskFilter(convertedBlurRadius, BlurMaskFilter.Blur.NORMAL)
  } else {
    null
  }
}

/** Draws an outer box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(MIN_OUTSET_BOX_SHADOW_SDK_VERSION)
internal class OutsetBoxShadowDrawable(
    private val context: Context,
    shadowColor: Int,
    offsetX: Float,
    offsetY: Float,
    blurRadius: Float,
    spread: Float,
    borderRadius: BorderRadiusStyle? = null,
) : Drawable() {
  private val shadowPaint = Paint().apply { maskFilter = createBlurMaskFilter(blurRadius) }

  private var drawableAlpha = 255

  var shadowColor: Int = shadowColor
    set(value) {
      if (value != field) {
        field = value
        applyShadowColor()
        invalidateSelf()
      }
    }

  init {
    applyShadowColor()
  }

  var offsetX: Float = offsetX
    set(value) {
      if (value != field) {
        field = value
        invalidateSelf()
      }
    }

  var offsetY: Float = offsetY
    set(value) {
      if (value != field) {
        field = value
        invalidateSelf()
      }
    }

  var blurRadius: Float = blurRadius
    set(value) {
      if (value != field) {
        field = value
        shadowPaint.maskFilter = createBlurMaskFilter(value)
        invalidateSelf()
      }
    }

  var spread: Float = spread
    set(value) {
      if (value != field) {
        field = value
        invalidateSelf()
      }
    }

  private var needUpdatePath = true
  private val shadowRect = RectF()
  private var hasRoundedBorders = false
  private val subpixelInsetBounds = RectF()
  private val radii = FloatArray(8)
  private val clipOutPath = Path()
  private val shadowPath = Path()

  /*
   * We assume borderRadius to be shared across multiple drawables
   * therefore we should manually invalidate this drawable when changing it
   */
  var borderRadius: BorderRadiusStyle? = borderRadius
    set(value) {
      field = value
      needUpdatePath = true
    }

  override fun invalidateSelf() {
    needUpdatePath = true
    super.invalidateSelf()
  }

  override fun onBoundsChange(bounds: Rect) {
    super.onBoundsChange(bounds)
    needUpdatePath = true
  }

  override fun onLayoutDirectionChanged(layoutDirection: Int): Boolean {
    needUpdatePath = true
    return true
  }

  override fun setAlpha(alpha: Int) {
    drawableAlpha = alpha
    applyShadowColor()
    invalidateSelf()
  }

  private fun applyShadowColor() {
    shadowPaint.color = shadowColor
    shadowPaint.alpha =
        (((drawableAlpha / 255f) * (Color.alpha(shadowColor) / 255f)) * 255f).roundToInt()
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
    updatePath()

    canvas.save().let { saveCount ->
      if (hasRoundedBorders) {
        canvas.clipOutPath(clipOutPath)
        canvas.drawPath(shadowPath, shadowPaint)
      } else {
        canvas.clipOutRect(bounds)
        canvas.drawRect(shadowRect, shadowPaint)
      }
      canvas.restoreToCount(saveCount)
    }
  }

  private fun updatePath() {
    if (!needUpdatePath) {
      return
    }
    needUpdatePath = false

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
    shadowRect.set(bounds)
    shadowRect.inset(-spreadExtent, -spreadExtent)
    shadowRect.offset(offsetX.dpToPx(), offsetY.dpToPx())

    hasRoundedBorders = computedBorderRadii?.hasRoundedBorders() == true
    if (computedBorderRadii == null || !hasRoundedBorders) {
      return
    }

    // We inset the clip slightly, to avoid Skia artifacts with antialiased
    // clipping. This inset is only visible when no background is present.
    // https://neugierig.org/software/chromium/notes/2010/07/clipping.html
    subpixelInsetBounds.set(bounds)
    subpixelInsetBounds.inset(0.4f, 0.4f)
    radii[0] = computedBorderRadii.topLeft.horizontal
    radii[1] = computedBorderRadii.topLeft.vertical
    radii[2] = computedBorderRadii.topRight.horizontal
    radii[3] = computedBorderRadii.topRight.vertical
    radii[4] = computedBorderRadii.bottomRight.horizontal
    radii[5] = computedBorderRadii.bottomRight.vertical
    radii[6] = computedBorderRadii.bottomLeft.horizontal
    radii[7] = computedBorderRadii.bottomLeft.vertical
    clipOutPath.rewind()
    clipOutPath.addRoundRect(subpixelInsetBounds, radii, Path.Direction.CW)

    for (index in radii.indices) {
      radii[index] = adjustRadiusForSpread(radii[index], spreadExtent)
    }
    shadowPath.rewind()
    shadowPath.addRoundRect(shadowRect, radii, Path.Direction.CW)
  }
}
