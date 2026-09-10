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
import android.graphics.PointF
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Region
import android.graphics.drawable.Drawable
import android.os.Build
import com.facebook.react.uimanager.FloatUtil.floatsEqual
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.style.BorderColors
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.ColorEdges
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import com.facebook.react.uimanager.style.LogicalEdge
import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sqrt
import kotlin.properties.ObservableProperty
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

// 0.inv() == 0xFFFFFFFF, all bits set to 1.
private const val ALL_BITS_SET = 0.inv()
// 0 == 0x00000000, all bits set to 0.
private const val ALL_BITS_UNSET = 0

internal class BorderDrawable(
    private val context: Context,
    val borderWidth: Spacing?,
    /*
     * We assume borderRadius & borderInsets to be shared across multiple drawables
     * therefore user should invalidate this drawable when changing either of them
     */
    var borderRadius: BorderRadiusStyle?,
    var borderInsets: BorderInsets?,
    borderStyle: BorderStyle?,
) : Drawable() {
  private fun <T> invalidatingAndPathChange(initialValue: T): ReadWriteProperty<Any?, T> =
      object : ObservableProperty<T>(initialValue) {
        override fun afterChange(property: KProperty<*>, oldValue: T, newValue: T) {
          if (oldValue != newValue) {
            needUpdatePath = true
            invalidateSelf()
          }
        }
      }

  /** Border Properties */
  var borderStyle: BorderStyle? by invalidatingAndPathChange(borderStyle)

  private var borderColors: BorderColors? = null
  private var computedBorderColors: ColorEdges = ColorEdges()
  private var computedBorderRadius: ComputedBorderRadius? = null
  private var borderAlpha: Int = 255

  /**
   * There is a small gap between the edges of adjacent paths, such as between its Border and its
   * Outline. The smallest amount (found to be 0.8f) is used to shrink outline's path, overlapping
   * them and closing the visible gap.
   */
  private val gapBetweenPaths = 0.8f
  private var pathForBorder: Path? = null

  private val borderPaint: Paint = Paint(Paint.ANTI_ALIAS_FLAG)

  private var needUpdatePath: Boolean = true

  private var pathForSingleBorder: Path? = null
  private var pathForOutline: Path? = null

  private var centerDrawPath: Path? = null
  private var outerClipPathForBorderRadius: Path? = null
  var innerClipPathForBorderRadius: Path? = null
    private set

  /**
   * Points that represent the inner point of the quadrilateral gotten from the intersection of L
   * with the border-radius forming ellipse
   */
  private var innerBottomLeftCorner: PointF? = null
  private var innerBottomRightCorner: PointF? = null
  private var innerTopLeftCorner: PointF? = null
  private var innerTopRightCorner: PointF? = null

  private var innerClipTempRectForBorderRadius: RectF? = null
  private var outerClipTempRectForBorderRadius: RectF? = null
  private var tempRectForCenterDrawPath: RectF? = null

  override fun invalidateSelf() {
    needUpdatePath = true
    super.invalidateSelf()
  }

  override fun onBoundsChange(bounds: Rect) {
    super.onBoundsChange(bounds)
    needUpdatePath = true
  }

  override fun setAlpha(alpha: Int) {
    /*
     * borderAlpha proportionally affects the alpha each borderColor edge
     * for example if borderColor's alpha originally is 255 and borderAlpha is set to 128
     * then the resulting alpha for that borderColor will be 128
     */
    borderAlpha = alpha
    invalidateSelf()
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    // do nothing
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int {
    val maxBorderAlpha =
        maxOf(
            (Color.alpha(multiplyColorAlpha(computedBorderColors.left, borderAlpha))),
            (Color.alpha(multiplyColorAlpha(computedBorderColors.top, borderAlpha))),
            (Color.alpha(multiplyColorAlpha(computedBorderColors.right, borderAlpha))),
            (Color.alpha(multiplyColorAlpha(computedBorderColors.bottom, borderAlpha))),
        )

    // If the highest alpha value of all border edges is 0, then the drawable is TRANSPARENT.
    if (maxBorderAlpha == 0) {
      return PixelFormat.TRANSPARENT
    }

    val minBorderAlpha =
        minOf(
            (Color.alpha(multiplyColorAlpha(computedBorderColors.left, borderAlpha))),
            (Color.alpha(multiplyColorAlpha(computedBorderColors.top, borderAlpha))),
            (Color.alpha(multiplyColorAlpha(computedBorderColors.right, borderAlpha))),
            (Color.alpha(multiplyColorAlpha(computedBorderColors.bottom, borderAlpha))),
        )

    /*
     * If the lowest alpha value of all border edges is 255, then the drawable is OPAQUE.
     * else the drawable is TRANSLUCENT.
     */
    return when (minBorderAlpha) {
      255 -> PixelFormat.OPAQUE
      else -> PixelFormat.TRANSLUCENT
    }
  }

  override fun draw(canvas: Canvas) {
    updatePathEffect()
    computedBorderColors = borderColors?.resolve(layoutDirection, context) ?: computedBorderColors
    if (borderRadius?.hasRoundedBorders() == true) {
      drawRoundedBorders(canvas)
    } else {
      drawRectangularBorders(canvas)
    }
  }

  /**
   * Here, "inner" refers to the border radius on the inside of the border. So it ends up being the
   * "outer" border radius inset by the respective width.
   */
  private fun getInnerBorderRadius(computedRadius: Float, borderWidth: Float): Float {
    return (computedRadius - borderWidth).coerceAtLeast(0f)
  }

  fun setBorderWidth(position: Int, width: Float) {
    if (!floatsEqual(this.borderWidth?.getRaw(position), width)) {
      this.borderWidth?.set(position, width)
      when (position) {
        Spacing.ALL,
        Spacing.LEFT,
        Spacing.BOTTOM,
        Spacing.RIGHT,
        Spacing.TOP,
        Spacing.START,
        Spacing.END -> needUpdatePath = true
      }
      invalidateSelf()
    }
  }

  fun setBorderRadius(property: BorderRadiusProp, radius: LengthPercentage?) {
    if (radius != borderRadius?.get(property)) {
      borderRadius?.set(property, radius)
      needUpdatePath = true
      invalidateSelf()
    }
  }

  fun setBorderStyle(style: String?) {
    val borderStyle = if (style == null) null else BorderStyle.valueOf(style.uppercase())
    this.borderStyle = borderStyle
    needUpdatePath = true
    invalidateSelf()
  }

  fun setBorderColor(position: LogicalEdge, color: Int?) {
    borderColors = borderColors ?: BorderColors()

    borderColors?.edgeColors?.set(position.ordinal, color)
    needUpdatePath = true
    invalidateSelf()
  }

  fun getBorderColor(position: LogicalEdge): Int {
    return borderColors?.edgeColors?.get(position.ordinal) ?: Color.BLACK
  }

  private fun drawRectangularBorders(canvas: Canvas) {
    val borderWidth = computeBorderInsets()
    val borderLeft = borderWidth.left.roundToInt()
    val borderTop = borderWidth.top.roundToInt()
    val borderRight = borderWidth.right.roundToInt()
    val borderBottom = borderWidth.bottom.roundToInt()

    // maybe draw borders?
    if (borderLeft > 0 || borderRight > 0 || borderTop > 0 || borderBottom > 0) {
      val bounds = bounds
      val left = bounds.left
      val top = bounds.top

      // Check for fast path to border drawing.
      val fastBorderColor =
          fastBorderCompatibleColorOrZero(
              borderLeft,
              borderTop,
              borderRight,
              borderBottom,
              computedBorderColors.left,
              computedBorderColors.top,
              computedBorderColors.right,
              computedBorderColors.bottom,
          )
      if (fastBorderColor != 0) {
        if (Color.alpha(fastBorderColor) != 0) {
          // Border color is not transparent.
          val right = bounds.right
          val bottom = bounds.bottom
          borderPaint.color = multiplyColorAlpha(fastBorderColor, borderAlpha)
          borderPaint.style = Paint.Style.STROKE
          pathForSingleBorder = Path()
          if (borderLeft > 0) {
            pathForSingleBorder?.reset()
            val width = borderWidth.left.roundToInt()
            updatePathEffect(width)
            borderPaint.strokeWidth = width.toFloat()
            pathForSingleBorder?.moveTo((left + width / 2).toFloat(), top.toFloat())
            pathForSingleBorder?.lineTo((left + width / 2).toFloat(), bottom.toFloat())
            pathForSingleBorder?.let { canvas.drawPath(it, borderPaint) }
          }
          if (borderTop > 0) {
            pathForSingleBorder?.reset()
            val width = borderWidth.top.roundToInt()
            updatePathEffect(width)
            borderPaint.strokeWidth = width.toFloat()
            pathForSingleBorder?.moveTo(left.toFloat(), (top + width / 2).toFloat())
            pathForSingleBorder?.lineTo(right.toFloat(), (top + width / 2).toFloat())
            pathForSingleBorder?.let { canvas.drawPath(it, borderPaint) }
          }
          if (borderRight > 0) {
            pathForSingleBorder?.reset()
            val width = borderWidth.right.roundToInt()
            updatePathEffect(width)
            borderPaint.strokeWidth = width.toFloat()
            pathForSingleBorder?.moveTo((right - width / 2).toFloat(), top.toFloat())
            pathForSingleBorder?.lineTo((right - width / 2).toFloat(), bottom.toFloat())
            pathForSingleBorder?.let { canvas.drawPath(it, borderPaint) }
          }
          if (borderBottom > 0) {
            pathForSingleBorder?.reset()
            val width = borderWidth.bottom.roundToInt()
            updatePathEffect(width)
            borderPaint.strokeWidth = width.toFloat()
            pathForSingleBorder?.moveTo(left.toFloat(), (bottom - width / 2).toFloat())
            pathForSingleBorder?.lineTo(right.toFloat(), (bottom - width / 2).toFloat())
            pathForSingleBorder?.let { canvas.drawPath(it, borderPaint) }
          }
        }
      } else {
        /**
         * If the path drawn previously is of the same color, there would be a slight white space
         * between borders with anti-alias set to true. Therefore we need to disable anti-alias, and
         * after drawing is done, we will re-enable it.
         */
        borderPaint.isAntiAlias = false
        val width = bounds.width()
        val height = bounds.height()
        if (borderLeft > 0) {
          val x1 = left.toFloat()
          val y1 = top.toFloat()
          val x2 = (left + borderLeft).toFloat()
          val y2 = (top + borderTop).toFloat()
          val x3 = (left + borderLeft).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = left.toFloat()
          val y4 = (top + height).toFloat()
          drawQuadrilateral(canvas, computedBorderColors.left, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderTop > 0) {
          val x1 = left.toFloat()
          val y1 = top.toFloat()
          val x2 = (left + borderLeft).toFloat()
          val y2 = (top + borderTop).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + borderTop).toFloat()
          val x4 = (left + width).toFloat()
          val y4 = top.toFloat()
          drawQuadrilateral(canvas, computedBorderColors.top, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderRight > 0) {
          val x1 = (left + width).toFloat()
          val y1 = top.toFloat()
          val x2 = (left + width).toFloat()
          val y2 = (top + height).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = (left + width - borderRight).toFloat()
          val y4 = (top + borderTop).toFloat()
          drawQuadrilateral(canvas, computedBorderColors.right, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderBottom > 0) {
          val x1 = left.toFloat()
          val y1 = (top + height).toFloat()
          val x2 = (left + width).toFloat()
          val y2 = (top + height).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = (left + borderLeft).toFloat()
          val y4 = (top + height - borderBottom).toFloat()
          drawQuadrilateral(canvas, computedBorderColors.bottom, x1, y1, x2, y2, x3, y3, x4, y4)
        }

        // re-enable anti alias
        borderPaint.isAntiAlias = true
      }
    }
  }

  private fun drawRoundedBorders(canvas: Canvas) {
    updatePath()
    canvas.save()

    // Clip outer border
    canvas.clipPath(checkNotNull(outerClipPathForBorderRadius))

    val borderWidth = computeBorderInsets()
    if (
        borderWidth.top > 0 ||
            borderWidth.bottom > 0 ||
            borderWidth.left > 0 ||
            borderWidth.right > 0
    ) {

      // If it's a full and even border draw inner rect path with stroke
      val fullBorderWidth: Float = getFullBorderWidth()
      val borderColor = getBorderColor(LogicalEdge.ALL)

      if (
          borderWidth.top == fullBorderWidth &&
              borderWidth.bottom == fullBorderWidth &&
              borderWidth.left == fullBorderWidth &&
              borderWidth.right == fullBorderWidth &&
              computedBorderColors.left == borderColor &&
              computedBorderColors.top == borderColor &&
              computedBorderColors.right == borderColor &&
              computedBorderColors.bottom == borderColor
      ) {
        if (fullBorderWidth > 0) {
          borderPaint.color = multiplyColorAlpha(borderColor, borderAlpha)
          borderPaint.style = Paint.Style.STROKE
          borderPaint.strokeWidth = fullBorderWidth
          if (computedBorderRadius?.isUniform() == true) {
            tempRectForCenterDrawPath?.let {
              canvas.drawRoundRect(
                  it,
                  ((computedBorderRadius?.topLeft?.toPixelFromDIP()?.horizontal ?: 0f) -
                      borderWidth.left * 0.5f),
                  ((computedBorderRadius?.topLeft?.toPixelFromDIP()?.vertical ?: 0f) -
                      borderWidth.top * 0.5f),
                  borderPaint,
              )
            }
          } else {
            canvas.drawPath(checkNotNull(centerDrawPath), borderPaint)
          }
        }
      }
      // In the case of uneven border widths/colors draw quadrilateral in each direction
      else {
        borderPaint.style = Paint.Style.FILL

        // Clip inner border
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          canvas.clipOutPath(checkNotNull(innerClipPathForBorderRadius))
        } else {
          @Suppress("DEPRECATION")
          canvas.clipPath(checkNotNull(innerClipPathForBorderRadius), Region.Op.DIFFERENCE)
        }
        val outerClipTempRect = checkNotNull(outerClipTempRectForBorderRadius)
        val left = outerClipTempRect.left
        val right = outerClipTempRect.right
        val top = outerClipTempRect.top
        val bottom = outerClipTempRect.bottom

        val innerTopLeftCorner = checkNotNull(this.innerTopLeftCorner)
        val innerTopRightCorner = checkNotNull(this.innerTopRightCorner)
        val innerBottomLeftCorner = checkNotNull(this.innerBottomLeftCorner)
        val innerBottomRightCorner = checkNotNull(this.innerBottomRightCorner)

        /**
         * gapBetweenPaths is used to close the gap between the diagonal edges of the quadrilaterals
         * on adjacent sides of the rectangle
         */
        if (borderWidth.left > 0) {
          val x1 = left
          val y1: Float = top - gapBetweenPaths
          val x2 = innerTopLeftCorner.x
          val y2: Float = innerTopLeftCorner.y - gapBetweenPaths
          val x3 = innerBottomLeftCorner.x
          val y3: Float = innerBottomLeftCorner.y + gapBetweenPaths
          val x4 = left
          val y4: Float = bottom + gapBetweenPaths
          drawQuadrilateral(canvas, computedBorderColors.left, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderWidth.top > 0) {
          val x1: Float = left - gapBetweenPaths
          val y1 = top
          val x2: Float = innerTopLeftCorner.x - gapBetweenPaths
          val y2 = innerTopLeftCorner.y
          val x3: Float = innerTopRightCorner.x + gapBetweenPaths
          val y3 = innerTopRightCorner.y
          val x4: Float = right + gapBetweenPaths
          val y4 = top
          drawQuadrilateral(canvas, computedBorderColors.top, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderWidth.right > 0) {
          val x1 = right
          val y1: Float = top - gapBetweenPaths
          val x2 = innerTopRightCorner.x
          val y2: Float = innerTopRightCorner.y - gapBetweenPaths
          val x3 = innerBottomRightCorner.x
          val y3: Float = innerBottomRightCorner.y + gapBetweenPaths
          val x4 = right
          val y4: Float = bottom + gapBetweenPaths
          drawQuadrilateral(canvas, computedBorderColors.right, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderWidth.bottom > 0) {
          val x1: Float = left - gapBetweenPaths
          val y1 = bottom
          val x2: Float = innerBottomLeftCorner.x - gapBetweenPaths
          val y2 = innerBottomLeftCorner.y
          val x3: Float = innerBottomRightCorner.x + gapBetweenPaths
          val y3 = innerBottomRightCorner.y
          val x4: Float = right + gapBetweenPaths
          val y4 = bottom
          drawQuadrilateral(canvas, computedBorderColors.bottom, x1, y1, x2, y2, x3, y3, x4, y4)
        }
      }
    }
    canvas.restore()
  }

  private fun fastBorderCompatibleColorOrZero(
      borderLeft: Int,
      borderTop: Int,
      borderRight: Int,
      borderBottom: Int,
      colorLeft: Int,
      colorTop: Int,
      colorRight: Int,
      colorBottom: Int,
  ): Int {
    // If any of the border colors are translucent then we can't use the fast path.
    if (
        Color.alpha(colorLeft) < 255 ||
            Color.alpha(colorTop) < 255 ||
            Color.alpha(colorRight) < 255 ||
            Color.alpha(colorBottom) < 255
    ) {
      return 0
    }

    val andSmear =
        ((if (borderLeft > 0) colorLeft else ALL_BITS_SET) and
            (if (borderTop > 0) colorTop else ALL_BITS_SET) and
            (if (borderRight > 0) colorRight else ALL_BITS_SET) and
            if (borderBottom > 0) colorBottom else ALL_BITS_SET)
    val orSmear =
        ((if (borderLeft > 0) colorLeft else ALL_BITS_UNSET) or
            (if (borderTop > 0) colorTop else ALL_BITS_UNSET) or
            (if (borderRight > 0) colorRight else ALL_BITS_UNSET) or
            if (borderBottom > 0) colorBottom else ALL_BITS_UNSET)
    return if (andSmear == orSmear) andSmear else 0
  }

  private fun drawQuadrilateral(
      canvas: Canvas,
      fillColor: Int,
      x1: Float,
      y1: Float,
      x2: Float,
      y2: Float,
      x3: Float,
      y3: Float,
      x4: Float,
      y4: Float,
  ) {
    if (fillColor == Color.TRANSPARENT) {
      return
    }

    if (this.pathForBorder == null) {
      this.pathForBorder = Path()
    }

    borderPaint.color = multiplyColorAlpha(fillColor, borderAlpha)
    this.pathForBorder?.reset()
    this.pathForBorder?.moveTo(x1, y1)
    this.pathForBorder?.lineTo(x2, y2)
    this.pathForBorder?.lineTo(x3, y3)
    this.pathForBorder?.lineTo(x4, y4)
    this.pathForBorder?.lineTo(x1, y1)
    this.pathForBorder?.let { canvas.drawPath(it, borderPaint) }
  }

  private fun computeBorderInsets(): RectF {
    borderInsets?.resolve(layoutDirection, context)?.let {
      return RectF(
          if (it.left.isNaN()) 0f else it.left.dpToPx(),
          if (it.top.isNaN()) 0f else it.top.dpToPx(),
          if (it.right.isNaN()) 0f else it.right.dpToPx(),
          if (it.bottom.isNaN()) 0f else it.bottom.dpToPx(),
      )
    }
    return RectF(0f, 0f, 0f, 0f)
  }

  /** For rounded borders we use default "borderWidth" property. */
  private fun getFullBorderWidth(): Float {
    val borderWidth = this.borderWidth?.getRaw(Spacing.ALL) ?: Float.NaN
    return if (!borderWidth.isNaN()) borderWidth else 0f
  }

  private fun updatePathEffect() {
    /** Used for rounded border and rounded background. */
    this.borderStyle?.let { style ->
      val pathEffectForBorderStyle =
          if (this.borderStyle != null) getPathEffect(style, getFullBorderWidth()) else null
      borderPaint.setPathEffect(pathEffectForBorderStyle)
    }
  }

  private fun updatePathEffect(borderWidth: Int) {
    this.borderStyle?.let { style ->
      val pathEffectForBorderStyle =
          if (this.borderStyle != null) getPathEffect(style, borderWidth.toFloat()) else null
      borderPaint.setPathEffect(pathEffectForBorderStyle)
    }
  }

  private fun getPathEffect(style: BorderStyle, borderWidth: Float): PathEffect? {
    return when (style) {
      BorderStyle.SOLID -> null
      BorderStyle.DASHED ->
          DashPathEffect(
              floatArrayOf(borderWidth * 3, borderWidth * 3, borderWidth * 3, borderWidth * 3),
              0f,
          )
      BorderStyle.DOTTED ->
          DashPathEffect(floatArrayOf(borderWidth, borderWidth, borderWidth, borderWidth), 0f)
    }
  }

  private fun getEllipseIntersectionWithLine(
      ellipseBoundsLeft: Double,
      ellipseBoundsTop: Double,
      ellipseBoundsRight: Double,
      ellipseBoundsBottom: Double,
      lineStartX: Double,
      lineStartY: Double,
      lineEndX: Double,
      lineEndY: Double,
      result: PointF,
  ) {
    var _lineStartX = lineStartX
    var _lineStartY = lineStartY
    var _lineEndX = lineEndX
    var _lineEndY = lineEndY
    val ellipseCenterX = (ellipseBoundsLeft + ellipseBoundsRight) / 2
    val ellipseCenterY = (ellipseBoundsTop + ellipseBoundsBottom) / 2
    /**
     * Step 1:
     *
     * Translate the line so that the ellipse is at the origin.
     *
     * Why? It makes the math easier by changing the ellipse equation from ((x -
     * ellipseCenterX)/a)^2 + ((y - ellipseCenterY)/b)^2 = 1 to (x/a)^2 + (y/b)^2 = 1.
     */
    _lineStartX -= ellipseCenterX
    _lineStartY -= ellipseCenterY
    _lineEndX -= ellipseCenterX
    _lineEndY -= ellipseCenterY
    /**
     * Step 2:
     *
     * Ellipse equation: (x/a)^2 + (y/b)^2 = 1 Line equation: y = mx + c
     */
    val a = abs(ellipseBoundsRight - ellipseBoundsLeft) / 2
    val b = abs(ellipseBoundsBottom - ellipseBoundsTop) / 2
    val m = (_lineEndY - _lineStartY) / (_lineEndX - _lineStartX)
    val c = _lineStartY - m * _lineStartX // Just a point on the line
    /**
     * Step 3:
     *
     * Substitute the Line equation into the Ellipse equation. Solve for x. Eventually, you'll have
     * to use the quadratic formula.
     *
     * Quadratic formula: Ax^2 + Bx + C = 0
     */
    val A = b * b + a * a * m * m
    val B = 2 * a * a * c * m
    val C = a * a * (c * c - b * b)
    /**
     * Step 4:
     *
     * Apply Quadratic formula. D = determinant / 2A
     */
    val D = sqrt(-C / A + (B / (2 * A)).pow(2.0))
    val x2 = -B / (2 * A) - D
    val y2 = m * x2 + c
    /**
     * Step 5:
     *
     * Undo the space transformation in Step 5.
     */
    val x = x2 + ellipseCenterX
    val y = y2 + ellipseCenterY
    if (!x.isNaN() && !y.isNaN()) {
      result.x = x.toFloat()
      result.y = y.toFloat()
    }
  }

  private fun updatePath() {
    if (!needUpdatePath) {
      return
    }

    needUpdatePath = false

    // Path
    innerClipPathForBorderRadius = innerClipPathForBorderRadius ?: Path()
    outerClipPathForBorderRadius = outerClipPathForBorderRadius ?: Path()
    pathForOutline = Path()

    // RectF
    innerClipTempRectForBorderRadius = innerClipTempRectForBorderRadius ?: RectF()
    outerClipTempRectForBorderRadius = outerClipTempRectForBorderRadius ?: RectF()
    tempRectForCenterDrawPath = tempRectForCenterDrawPath ?: RectF()

    innerClipPathForBorderRadius?.reset()
    outerClipPathForBorderRadius?.reset()

    innerClipTempRectForBorderRadius?.set(bounds)
    outerClipTempRectForBorderRadius?.set(bounds)
    tempRectForCenterDrawPath?.set(bounds)

    val borderWidth = computeBorderInsets()

    // Clip border ONLY if at least one edge is non-transparent
    if (
        Color.alpha(computedBorderColors.left) != 0 ||
            Color.alpha(computedBorderColors.top) != 0 ||
            Color.alpha(computedBorderColors.right) != 0 ||
            Color.alpha(computedBorderColors.bottom) != 0
    ) {
      innerClipTempRectForBorderRadius?.top =
          innerClipTempRectForBorderRadius?.top?.plus(borderWidth.top) ?: 0f
      innerClipTempRectForBorderRadius?.bottom =
          innerClipTempRectForBorderRadius?.bottom?.minus(borderWidth.bottom) ?: 0f
      innerClipTempRectForBorderRadius?.left =
          innerClipTempRectForBorderRadius?.left?.plus(borderWidth.left) ?: 0f
      innerClipTempRectForBorderRadius?.right =
          innerClipTempRectForBorderRadius?.right?.minus(borderWidth.right) ?: 0f
    }

    tempRectForCenterDrawPath?.top =
        tempRectForCenterDrawPath?.top?.plus(borderWidth.top * 0.5f) ?: 0f
    tempRectForCenterDrawPath?.bottom =
        tempRectForCenterDrawPath?.bottom?.minus(borderWidth.bottom * 0.5f) ?: 0f
    tempRectForCenterDrawPath?.left =
        tempRectForCenterDrawPath?.left?.plus(borderWidth.left * 0.5f) ?: 0f
    tempRectForCenterDrawPath?.right =
        tempRectForCenterDrawPath?.right?.minus(borderWidth.right * 0.5f) ?: 0f

    computedBorderRadius =
        this.borderRadius?.resolve(
            layoutDirection,
            this.context,
            outerClipTempRectForBorderRadius?.width()?.pxToDp() ?: 0f,
            outerClipTempRectForBorderRadius?.height()?.pxToDp() ?: 0f,
        )

    val topLeftRadius = computedBorderRadius?.topLeft?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val topRightRadius = computedBorderRadius?.topRight?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val bottomLeftRadius = computedBorderRadius?.bottomLeft?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val bottomRightRadius =
        computedBorderRadius?.bottomRight?.toPixelFromDIP() ?: CornerRadii(0f, 0f)

    val innerTopLeftRadiusX: Float =
        getInnerBorderRadius(topLeftRadius.horizontal, borderWidth.left)
    val innerTopLeftRadiusY: Float = getInnerBorderRadius(topLeftRadius.vertical, borderWidth.top)
    val innerTopRightRadiusX: Float =
        getInnerBorderRadius(topRightRadius.horizontal, borderWidth.right)
    val innerTopRightRadiusY: Float = getInnerBorderRadius(topRightRadius.vertical, borderWidth.top)
    val innerBottomRightRadiusX: Float =
        getInnerBorderRadius(bottomRightRadius.horizontal, borderWidth.right)
    val innerBottomRightRadiusY: Float =
        getInnerBorderRadius(bottomRightRadius.vertical, borderWidth.bottom)
    val innerBottomLeftRadiusX: Float =
        getInnerBorderRadius(bottomLeftRadius.horizontal, borderWidth.left)
    val innerBottomLeftRadiusY: Float =
        getInnerBorderRadius(bottomLeftRadius.vertical, borderWidth.bottom)

    innerClipTempRectForBorderRadius?.let {
      innerClipPathForBorderRadius?.addRoundRect(
          it,
          floatArrayOf(
              innerTopLeftRadiusX,
              innerTopLeftRadiusY,
              innerTopRightRadiusX,
              innerTopRightRadiusY,
              innerBottomRightRadiusX,
              innerBottomRightRadiusY,
              innerBottomLeftRadiusX,
              innerBottomLeftRadiusY,
          ),
          Path.Direction.CW,
      )
    }

    outerClipTempRectForBorderRadius?.let {
      outerClipPathForBorderRadius?.addRoundRect(
          it,
          floatArrayOf(
              topLeftRadius.horizontal,
              topLeftRadius.vertical,
              topRightRadius.horizontal,
              topRightRadius.vertical,
              bottomRightRadius.horizontal,
              bottomRightRadius.vertical,
              bottomLeftRadius.horizontal,
              bottomLeftRadius.vertical,
          ),
          Path.Direction.CW,
      )
    }

    var extraRadiusForOutline = 0f

    if (this.borderWidth != null) {
      extraRadiusForOutline = this.borderWidth[Spacing.ALL] / 2f
    }

    pathForOutline?.addRoundRect(
        RectF(bounds),
        floatArrayOf(
            topLeftRadius.horizontal + extraRadiusForOutline,
            topLeftRadius.vertical + extraRadiusForOutline,
            topRightRadius.horizontal + extraRadiusForOutline,
            topRightRadius.vertical + extraRadiusForOutline,
            bottomRightRadius.horizontal + extraRadiusForOutline,
            bottomRightRadius.vertical + extraRadiusForOutline,
            bottomLeftRadius.horizontal + extraRadiusForOutline,
            bottomLeftRadius.vertical + extraRadiusForOutline,
        ),
        Path.Direction.CW,
    )

    if (computedBorderRadius?.isUniform() != true) {
      centerDrawPath = centerDrawPath ?: Path()
      centerDrawPath?.reset()
      tempRectForCenterDrawPath?.let {
        centerDrawPath?.addRoundRect(
            it,
            floatArrayOf(
                topLeftRadius.horizontal - borderWidth.left * 0.5f,
                topLeftRadius.vertical - borderWidth.top * 0.5f,
                topRightRadius.horizontal - borderWidth.right * 0.5f,
                topRightRadius.vertical - borderWidth.top * 0.5f,
                bottomRightRadius.horizontal - borderWidth.right * 0.5f,
                bottomRightRadius.vertical - borderWidth.bottom * 0.5f,
                bottomLeftRadius.horizontal - borderWidth.left * 0.5f,
                bottomLeftRadius.vertical - borderWidth.bottom * 0.5f,
            ),
            Path.Direction.CW,
        )
      }
    }

    /**
     * Rounded Multi-Colored Border Algorithm:
     *
     * <p>Let O (for outer) = (top, left, bottom, right) be the rectangle that represents the size
     * and position of a view V. Since the box-sizing of all React Native views is border-box, any
     * border of V will render inside O.
     *
     * <p>Let BorderWidth = (borderTop, borderLeft, borderBottom, borderRight).
     *
     * <p>Let I (for inner) = O - BorderWidth.
     *
     * <p>Then, remembering that O and I are rectangles and that I is inside O, O - I gives us the
     * border of V. Therefore, we can use canvas.clipPath/clipOutPath to draw V's border.
     *
     * <p>canvas.clipPath(O);
     *
     * <p>canvas.clipOutPath(I);
     *
     * <p>canvas.drawRect(O, paint);
     *
     * <p>This lets us draw non-rounded single-color borders.
     *
     * <p>To extend this algorithm to rounded single-color borders, we:
     *
     * <p>1. Curve the corners of O by the (border radii of V) using Path#addRoundRect.
     *
     * <p>2. Curve the corners of I by (border radii of V - border widths of V) using
     * Path#addRoundRect.
     *
     * <p>Let O' = curve(O, border radii of V).
     *
     * <p>Let I' = curve(I, border radii of V - border widths of V)
     *
     * <p>The rationale behind this decision is the (first sentence of the) following section in the
     * CSS Backgrounds and Borders Module Level 3:
     * https://www.w3.org/TR/css3-background/#the-border-radius.
     *
     * <p>After both O and I have been curved, we can execute the following lines once again to
     * render curved single-color borders:
     *
     * <p>canvas.clipPath(O);
     *
     * <p>canvas.clipOutPath(I);
     *
     * <p>canvas.drawRect(O, paint);
     *
     * <p>To extend this algorithm to rendering multi-colored rounded borders, we render each side
     * of the border as its own quadrilateral. Suppose that we were handling the case where all the
     * border radii are 0. Then, the four quadrilaterals would be:
     *
     * <p>Left: (O.left, O.top), (I.left, I.top), (I.left, I.bottom), (O.left, O.bottom)
     *
     * <p>Top: (O.left, O.top), (I.left, I.top), (I.right, I.top), (O.right, O.top)
     *
     * <p>Right: (O.right, O.top), (I.right, I.top), (I.right, I.bottom), (O.right, O.bottom)
     *
     * <p>Bottom: (O.right, O.bottom), (I.right, I.bottom), (I.left, I.bottom), (O.left, O.bottom)
     *
     * <p>Now, lets consider what happens when we render a rounded border (radii != 0). For the sake
     * of simplicity, let's focus on the top edge of the Left border:
     *
     * <p>Let borderTopLeftRadius = 5. Let borderLeftWidth = 1. Let borderTopWidth = 2.
     *
     * <p>We know that O is curved by the ellipse E_O (a = 5, b = 5). We know that I is curved by
     * the ellipse E_I (a = 5 - 1, b = 5 - 2).
     *
     * <p>Since we have clipping, it should be safe to set the top-left point of the Left
     * quadrilateral's top edge to (O.left, O.top).
     *
     * <p>But, what should the top-right point be?
     *
     * <p>The fact that the border is curved shouldn't change the slope (nor the position) of the
     * line connecting the top-left and top-right points of the Left quadrilateral's top edge.
     * Therefore, The top-right point should lie somewhere on the line L = (1 - a) * (O.left, O.top)
     * + a * (I.left, I.top).
     *
     * <p>a != 0, because then the top-left and top-right points would be the same and
     * borderLeftWidth = 1. a != 1, because then the top-right point would not touch an edge of the
     * ellipse E_I. We want the top-right point to touch an edge of the inner ellipse because the
     * border curves with E_I on the top-left corner of V.
     *
     * <p>Therefore, it must be the case that a > 1. Two natural locations of the top-right point
     * exist: 1. The first intersection of L with E_I. 2. The second intersection of L with E_I.
     *
     * <p>We choose the top-right point of the top edge of the Left quadrilateral to be an arbitrary
     * intersection of L with E_I.
     */
    /**
     * Rounded Multi-Colored Border Algorithm:
     *
     * Let O (for outer) = (top, left, bottom, right) be the rectangle that represents the size and
     * position of a view V. Since the box-sizing of all React Native views is border-box, any
     * border of V will render inside O.
     *
     * Let BorderWidth = (borderTop, borderLeft, borderBottom, borderRight).
     *
     * Let I (for inner) = O - BorderWidth.
     *
     * Then, remembering that O and I are rectangles and that I is inside O, O - I gives us the
     * border of V. Therefore, we can use canvas.clipPath to draw V's border.
     *
     * canvas.clipPath(O, Region.OP.INTERSECT);
     *
     * canvas.clipPath(I, Region.OP.DIFFERENCE);
     *
     * canvas.drawRect(O, paint);
     *
     * This lets us draw non-rounded single-color borders.
     *
     * To extend this algorithm to rounded single-color borders, we:
     * 1. Curve the corners of O by the (border radii of V) using Path#addRoundRect.
     * 2. Curve the corners of I by (border radii of V - border widths of V) using
     *    Path#addRoundRect.
     *
     * Let O' = curve(O, border radii of V).
     *
     * Let I' = curve(I, border radii of V - border widths of V)
     *
     * The rationale behind this decision is the (first sentence of the) following section in the
     * CSS Backgrounds and Borders Module Level 3:
     * https://www.w3.org/TR/css3-background/#the-border-radius.
     *
     * After both O and I have been curved, we can execute the following lines once again to render
     * curved single-color borders:
     *
     * canvas.clipPath(O);
     *
     * canvas.clipOutPath(I);
     *
     * canvas.drawRect(O, paint);
     *
     * To extend this algorithm to rendering multi-colored rounded borders, we render each side of
     * the border as its own quadrilateral. Suppose that we were handling the case where all the
     * border radii are 0. Then, the four quadrilaterals would be:
     *
     * Left: (O.left, O.top), (I.left, I.top), (I.left, I.bottom), (O.left, O.bottom)
     *
     * Top: (O.left, O.top), (I.left, I.top), (I.right, I.top), (O.right, O.top)
     *
     * Right: (O.right, O.top), (I.right, I.top), (I.right, I.bottom), (O.right, O.bottom)
     *
     * Bottom: (O.right, O.bottom), (I.right, I.bottom), (I.left, I.bottom), (O.left, O.bottom)
     *
     * Now, lets consider what happens when we render a rounded border (radii != 0). For the sake of
     * simplicity, let's focus on the top edge of the Left border:
     *
     * Let borderTopLeftRadius = 5. Let borderLeftWidth = 1. Let borderTopWidth = 2.
     *
     * We know that O is curved by the ellipse E_O (a = 5, b = 5). We know that I is curved by the
     * ellipse E_I (a = 5 - 1, b = 5 - 2).
     *
     * Since we have clipping, it should be safe to set the top-left point of the Left
     * quadrilateral's top edge to (O.left, O.top).
     *
     * But, what should the top-right point be?
     *
     * The fact that the border is curved shouldn't change the slope (nor the position) of the line
     * connecting the top-left and top-right points of the Left quadrilateral's top edge. Therefore,
     * The top-right point should lie somewhere on the line L = (1 - a) * (O.left, O.top)
     * + a * (I.left, I.top).
     *
     * a != 0, because then the top-left and top-right points would be the same and borderLeftWidth
     * = 1. a != 1, because then the top-right point would not touch an edge of the ellipse E_I. We
     * want the top-right point to touch an edge of the inner ellipse because the border curves with
     * E_I on the top-left corner of V.
     *
     * Therefore, it must be the case that a > 1. Two natural locations of the top-right point
     * exist: 1. The first intersection of L with E_I. 2. The second intersection of L with E_I.
     *
     * We choose the top-right point of the top edge of the Left quadrilateral to be an arbitrary
     * intersection of L with E_I.
     */
    val innerRect = innerClipTempRectForBorderRadius
    val outerRect = outerClipTempRectForBorderRadius

    if (innerRect != null && outerRect != null) {
      /** Compute innerTopLeftCorner */
      innerTopLeftCorner = innerTopLeftCorner ?: PointF()

      innerTopLeftCorner?.x = innerRect.left
      innerTopLeftCorner?.y = innerRect.top

      innerTopLeftCorner?.let {
        getEllipseIntersectionWithLine( // Ellipse Bounds
            innerRect.left.toDouble(),
            innerRect.top.toDouble(),
            (innerRect.left + 2 * innerTopLeftRadiusX).toDouble(),
            (innerRect.top + 2 * innerTopLeftRadiusY).toDouble(), // Line Start
            outerRect.left.toDouble(),
            outerRect.top.toDouble(), // Line End
            innerRect.left.toDouble(),
            innerRect.top.toDouble(), // Result
            it,
        )
      }

      /** Compute innerBottomLeftCorner */
      innerBottomLeftCorner = innerBottomLeftCorner ?: PointF()

      innerBottomLeftCorner?.x = innerRect.left
      innerBottomLeftCorner?.y = innerRect.bottom
      innerBottomLeftCorner?.let {
        getEllipseIntersectionWithLine( // Ellipse Bounds
            innerRect.left.toDouble(),
            (innerRect.bottom - 2 * innerBottomLeftRadiusY).toDouble(),
            (innerRect.left + 2 * innerBottomLeftRadiusX).toDouble(),
            innerRect.bottom.toDouble(), // Line Start
            outerRect.left.toDouble(),
            outerRect.bottom.toDouble(), // Line End
            innerRect.left.toDouble(),
            innerRect.bottom.toDouble(), // Result
            it,
        )
      }

      /** Compute innerTopRightCorner */
      innerTopRightCorner = innerTopRightCorner ?: PointF()

      innerTopRightCorner?.x = innerRect.right
      innerTopRightCorner?.y = innerRect.top

      innerTopRightCorner?.let {
        getEllipseIntersectionWithLine( // Ellipse Bounds
            (innerRect.right - 2 * innerTopRightRadiusX).toDouble(),
            innerRect.top.toDouble(),
            innerRect.right.toDouble(),
            (innerRect.top + 2 * innerTopRightRadiusY).toDouble(), // Line Start
            outerRect.right.toDouble(),
            outerRect.top.toDouble(), // Line End
            innerRect.right.toDouble(),
            innerRect.top.toDouble(), // Result
            it,
        )
      }

      /** Compute innerBottomRightCorner */
      innerBottomRightCorner = innerBottomRightCorner ?: PointF()

      innerBottomRightCorner?.x = innerRect.right
      innerBottomRightCorner?.y = innerRect.bottom

      innerBottomRightCorner?.let {
        getEllipseIntersectionWithLine( // Ellipse Bounds
            (innerRect.right - 2 * innerBottomRightRadiusX).toDouble(),
            (innerRect.bottom - 2 * innerBottomRightRadiusY).toDouble(),
            innerRect.right.toDouble(),
            innerRect.bottom.toDouble(), // Line Start
            outerRect.right.toDouble(),
            outerRect.bottom.toDouble(), // Line End
            innerRect.right.toDouble(),
            innerRect.bottom.toDouble(), // Result
            it,
        )
      }
    }
  }

  /**
   * Multiplies the color with the given alpha.
   *
   * @param color color to be multiplied
   * @param rawAlpha value between 0 and 255
   * @return multiplied color
   */
  private fun multiplyColorAlpha(color: Int, rawAlpha: Int): Int {
    if (rawAlpha == 255) {
      return color
    }
    if (rawAlpha == 0) {
      return color and 0x00FFFFFF
    }
    val alpha = rawAlpha + (rawAlpha shr 7) // make it 0..256
    val colorAlpha = color ushr 24
    val multipliedAlpha = colorAlpha * (alpha shr 7) shr 8
    return (multipliedAlpha shl 24) or (color and 0x00FFFFFF)
  }
}
