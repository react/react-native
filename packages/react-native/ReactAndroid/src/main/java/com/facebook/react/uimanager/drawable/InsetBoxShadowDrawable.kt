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
    borderInsets: BorderInsets? = null,
    borderRadius: BorderRadiusStyle? = null,
) : Drawable() {
  private val shadowPaint =
      Paint().apply {
        color = shadowColor
        val convertedBlurRadius = FilterHelper.sigmaToRadius(blurRadius * BLUR_RADIUS_SIGMA_SCALE)
        if (convertedBlurRadius > 0) {
          maskFilter = BlurMaskFilter(convertedBlurRadius, BlurMaskFilter.Blur.NORMAL)
        }
      }

  private val isBlurred = shadowPaint.maskFilter != null

  private var needUpdatePath = true
  private val paddingBoxRect = RectF()
  private val paddingBoxRadii = FloatArray(8)
  private var hasPaddingBoxRadii = false
  private val paddingBoxPath = Path()
  private val innerRect = RectF()
  private val innerRadii = FloatArray(8)
  private val outerRect = RectF()
  private val blurredShadowPath = Path()

  /*
   * We assume borderRadius & borderInsets to be shared across multiple drawables
   * therefore user should invalidate this drawable when changing either of them
   */
  var borderInsets: BorderInsets? = borderInsets
    set(value) {
      field = value
      needUpdatePath = true
    }

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
    updatePath()

    canvas.save().let { saveCount ->
      if (hasPaddingBoxRadii) {
        canvas.clipPath(paddingBoxPath)
      } else {
        canvas.clipRect(paddingBoxRect)
      }

      // Skia caches a blurred mask only for a path it can key, and a double round rect reaches it
      // as a new path on every draw.
      if (isBlurred) {
        canvas.drawPath(blurredShadowPath, shadowPaint)
      } else {
        canvas.drawDoubleRoundRect(
            outerRect,
            ZERO_RADII,
            innerRect,
            if (hasPaddingBoxRadii) innerRadii else ZERO_RADII,
            shadowPaint,
        )
      }

      canvas.restoreToCount(saveCount)
    }
  }

  private fun updatePath() {
    if (!needUpdatePath) {
      return
    }
    needUpdatePath = false

    val computedBorderRadii = computeBorderRadii()
    val computedBorderInsets = computeBorderInsets()

    paddingBoxRect.set(
        bounds.left + (computedBorderInsets?.left ?: 0f),
        bounds.top + (computedBorderInsets?.top ?: 0f),
        bounds.right - (computedBorderInsets?.right ?: 0f),
        bounds.bottom - (computedBorderInsets?.bottom ?: 0f),
    )
    hasPaddingBoxRadii = computedBorderRadii != null
    if (computedBorderRadii != null) {
      paddingBoxRadii[0] =
          innerRadius(computedBorderRadii.topLeft.horizontal, computedBorderInsets?.left)
      paddingBoxRadii[1] =
          innerRadius(computedBorderRadii.topLeft.vertical, computedBorderInsets?.top)
      paddingBoxRadii[2] =
          innerRadius(computedBorderRadii.topRight.horizontal, computedBorderInsets?.right)
      paddingBoxRadii[3] =
          innerRadius(computedBorderRadii.topRight.vertical, computedBorderInsets?.top)
      paddingBoxRadii[4] =
          innerRadius(computedBorderRadii.bottomRight.horizontal, computedBorderInsets?.right)
      paddingBoxRadii[5] =
          innerRadius(computedBorderRadii.bottomRight.vertical, computedBorderInsets?.bottom)
      paddingBoxRadii[6] =
          innerRadius(computedBorderRadii.bottomLeft.horizontal, computedBorderInsets?.left)
      paddingBoxRadii[7] =
          innerRadius(computedBorderRadii.bottomLeft.vertical, computedBorderInsets?.bottom)
    }

    val x = offsetX.dpToPx()
    val y = offsetY.dpToPx()
    val spreadExtent = spread.dpToPx()
    innerRect.set(paddingBoxRect)
    if (2 * spreadExtent > paddingBoxRect.width()) {
      innerRect.setEmpty()
    } else {
      innerRect.inset(spreadExtent, spreadExtent)
    }
    innerRect.offset(x, y)

    // Graciously stolen from Blink
    // https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/paint/box_painter_base.cc;l=338;drc=0a301506035e13015ea5c8dd39164d0d5954fa60
    val blurExtent = FilterHelper.sigmaToRadius(blurRadius)
    outerRect.set(paddingBoxRect)
    outerRect.inset(-blurExtent, -blurExtent)
    outerRect.union(innerRect)

    if (hasPaddingBoxRadii) {
      paddingBoxPath.rewind()
      paddingBoxPath.addRoundRect(paddingBoxRect, paddingBoxRadii, Path.Direction.CW)
      for (index in innerRadii.indices) {
        innerRadii[index] = adjustRadiusForSpread(paddingBoxRadii[index], -spreadExtent)
      }
    }

    if (isBlurred) {
      blurredShadowPath.rewind()
      blurredShadowPath.fillType = Path.FillType.EVEN_ODD
      blurredShadowPath.addRect(outerRect, Path.Direction.CW)
      if (!innerRect.isEmpty) {
        blurredShadowPath.addRoundRect(
            innerRect,
            if (hasPaddingBoxRadii) innerRadii else ZERO_RADII,
            Path.Direction.CW,
        )
      }
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
