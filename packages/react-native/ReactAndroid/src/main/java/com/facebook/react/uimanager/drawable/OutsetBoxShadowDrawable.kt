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
import android.util.LayoutDirection
import androidx.annotation.RequiresApi
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import kotlin.math.roundToInt

internal const val MIN_OUTSET_BOX_SHADOW_SDK_VERSION = 28

/** Draws an outer box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(MIN_OUTSET_BOX_SHADOW_SDK_VERSION)
internal class OutsetBoxShadowDrawable(
    private val context: Context,
    private var shadowColor: Int,
    private var offsetX: Float,
    private var offsetY: Float,
    private var blurRadius: Float,
    private var spread: Float,
    borderRadius: BorderRadiusStyle? = null,
) : Drawable() {
  private val shadowPaint = Paint()
  private var needUpdateMaskFilter = true
  private var maskFilterDensity = 0f

  private var drawableAlpha = 255

  private var needUpdatePath = true
  private var pathDensity = 0f
  private var pathSwapsLeftAndRight = false
  private val shadowRect = RectF()
  private var hasRoundedBorders = false
  private val subpixelInsetBounds = RectF()
  private val radii = FloatArray(8)
  private val clipOutPath = Path()
  private val shadowPath = Path()

  /*
   * We assume borderRadius to be shared across multiple drawables
   * therefore we should assign it to this drawable again when changing it
   */
  var borderRadius: BorderRadiusStyle? = borderRadius
    set(value) {
      field = value
      needUpdatePath = true
    }

  init {
    applyShadowColor()
  }

  override fun onBoundsChange(bounds: Rect) {
    super.onBoundsChange(bounds)
    needUpdatePath = true
  }

  override fun onLayoutDirectionChanged(layoutDirection: Int): Boolean {
    needUpdatePath = true
    return true
  }

  fun setShadowValues(
      shadowColor: Int = this.shadowColor,
      offsetX: Float = this.offsetX,
      offsetY: Float = this.offsetY,
      blurRadius: Float = this.blurRadius,
      spread: Float = this.spread,
  ) {
    val colorChanged = shadowColor != this.shadowColor
    val blurChanged = blurRadius != this.blurRadius
    val geometryChanged =
        offsetX != this.offsetX || offsetY != this.offsetY || spread != this.spread
    if (!colorChanged && !blurChanged && !geometryChanged) {
      return
    }
    this.shadowColor = shadowColor
    this.offsetX = offsetX
    this.offsetY = offsetY
    this.blurRadius = blurRadius
    this.spread = spread
    if (colorChanged) {
      applyShadowColor()
    }
    if (blurChanged) {
      needUpdateMaskFilter = true
    }
    if (geometryChanged) {
      needUpdatePath = true
    }
    invalidateSelf()
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
    updateMaskFilter()
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

  private fun updateMaskFilter() {
    val density = PixelUtil.getDisplayMetricDensity()
    if (!needUpdateMaskFilter && density == maskFilterDensity) {
      return
    }
    needUpdateMaskFilter = false
    maskFilterDensity = density
    shadowPaint.maskFilter = createBoxShadowMaskFilter(blurRadius)
  }

  private fun updatePath() {
    // Neither the density nor the RTL left/right swap preference notifies the drawable
    val density = PixelUtil.getDisplayMetricDensity()
    val swapsLeftAndRight =
        layoutDirection == LayoutDirection.RTL &&
            borderRadius != null &&
            I18nUtil.instance.doLeftAndRightSwapInRTL(context)
    if (!needUpdatePath && density == pathDensity && swapsLeftAndRight == pathSwapsLeftAndRight) {
      return
    }
    needUpdatePath = false
    pathDensity = density
    pathSwapsLeftAndRight = swapsLeftAndRight

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
