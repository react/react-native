/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.Path
import android.graphics.Path.FillType
import android.graphics.RectF
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil

internal object ClipPathUtils {

  private fun resolveLengthPercentage(lengthPercentage: LengthPercentage, referenceDimension: Float): Float {
    return when (lengthPercentage.type) {
      LengthPercentageType.POINT -> PixelUtil.toPixelFromDIP(lengthPercentage.resolve(1f))
      LengthPercentageType.PERCENT -> lengthPercentage.resolve(referenceDimension)
    }
  }

  private fun addRectWithOptionalBorderRadius(
      path: Path,
      rect: RectF,
      borderRadius: LengthPercentage?,
  ) {
    if (borderRadius != null) {
      val referenceDimension = minOf(rect.width(), rect.height())
      val radius = resolveLengthPercentage(borderRadius, referenceDimension)
      path.addRoundRect(rect, radius, radius, Path.Direction.CW)
    } else {
      path.addRect(rect, Path.Direction.CW)
    }
  }

  public fun createPathFromBasicShape(basicShape: BasicShape, bounds: RectF): Path? {
    return when (basicShape) {
      is BasicShape.Circle -> createCirclePath(basicShape.shape, bounds)
      is BasicShape.Ellipse -> createEllipsePath(basicShape.shape, bounds)
      is BasicShape.Inset -> createInsetPath(basicShape.shape, bounds)
      is BasicShape.Polygon -> createPolygonPath(basicShape.shape, bounds)
      is BasicShape.Rect -> createRectPath(basicShape.shape, bounds)
      is BasicShape.Xywh -> createXywhPath(basicShape.shape, bounds)
    }
  }

  private fun createCirclePath(circle: CircleShape, bounds: RectF): Path {
    val path = Path()

    // Resolve radius (use smaller dimension as reference for percentages, matching CSS closest-side)
    // Default to 50% of closest-side if radius is not specified
    val referenceDimension = minOf(bounds.width(), bounds.height())
    val radius = if (circle.r != null) {
      resolveLengthPercentage(circle.r, referenceDimension)
    } else {
      // Default to 50% of closest-side (min(width, height) / 2)
      referenceDimension / 2.0f
    }

    // Resolve center (default to center of bounds)
    val cx =
        if (circle.cx != null) {
          bounds.left + resolveLengthPercentage(circle.cx, bounds.width())
        } else {
          bounds.centerX()
        }

    val cy =
        if (circle.cy != null) {
          bounds.top + resolveLengthPercentage(circle.cy, bounds.height())
        } else {
          bounds.centerY()
        }

    path.addCircle(cx, cy, radius, Path.Direction.CW)
    return path
  }

  private fun createEllipsePath(ellipse: EllipseShape, bounds: RectF): Path {
    val path = Path()

    // Resolve radii (default to 50% if not specified)
    val rx = if (ellipse.rx != null) {
      resolveLengthPercentage(ellipse.rx, bounds.width())
    } else {
      bounds.width() / 2.0f
    }
    val ry = if (ellipse.ry != null) {
      resolveLengthPercentage(ellipse.ry, bounds.height())
    } else {
      bounds.height() / 2.0f
    }

    // Resolve center (default to center of bounds)
    val cx =
        if (ellipse.cx != null) {
          bounds.left + resolveLengthPercentage(ellipse.cx, bounds.width())
        } else {
          bounds.centerX()
        }

    val cy =
        if (ellipse.cy != null) {
          bounds.top + resolveLengthPercentage(ellipse.cy, bounds.height())
        } else {
          bounds.centerY()
        }

    val oval = RectF(cx - rx, cy - ry, cx + rx, cy + ry)
    path.addOval(oval, Path.Direction.CW)
    return path
  }

  private fun createInsetPath(inset: InsetShape, bounds: RectF): Path? {
    val path = Path()

    val top = bounds.top + resolveLengthPercentage(inset.top, bounds.height())
    val right = bounds.right - resolveLengthPercentage(inset.right, bounds.width())
    val bottom = bounds.bottom - resolveLengthPercentage(inset.bottom, bounds.height())
    val left = bounds.left + resolveLengthPercentage(inset.left, bounds.width())

    val rect = RectF(left, top, right, bottom)
    if (rect.width() < 0f || rect.height() < 0f) {
      return null
    }

    addRectWithOptionalBorderRadius(path, rect, inset.borderRadius)
    return path
  }

  private fun createPolygonPath(polygon: PolygonShape, bounds: RectF): Path? {
    val path = Path()

    if (polygon.points.isEmpty()) {
      return null
    }

    when (polygon.fillRule) {
      FillRule.EvenOdd -> path.fillType = FillType.EVEN_ODD
      FillRule.NonZero,
      null -> path.fillType = FillType.WINDING
    }

    val firstPoint = polygon.points[0]
    val firstX = bounds.left + resolveLengthPercentage(firstPoint.first, bounds.width())
    val firstY = bounds.top + resolveLengthPercentage(firstPoint.second, bounds.height())
    path.moveTo(firstX, firstY)

    for (i in 1 until polygon.points.size) {
      val point = polygon.points[i]
      val x = bounds.left + resolveLengthPercentage(point.first, bounds.width())
      val y = bounds.top + resolveLengthPercentage(point.second, bounds.height())
      path.lineTo(x, y)
    }

    path.close()
    return path
  }

  private fun createRectPath(rect: RectShape, bounds: RectF): Path? {
    val path = Path()

    val top = bounds.top + resolveLengthPercentage(rect.top, bounds.height())
    val right = bounds.left + resolveLengthPercentage(rect.right, bounds.width())
    val bottom = bounds.top + resolveLengthPercentage(rect.bottom, bounds.height())
    val left = bounds.left + resolveLengthPercentage(rect.left, bounds.width())

    val rectF = RectF(left, top, right, bottom)
    if (rectF.width() < 0f || rectF.height() < 0f) {
      return null
    }

    addRectWithOptionalBorderRadius(path, rectF, rect.borderRadius)
    return path
  }

  private fun createXywhPath(xywh: XywhShape, bounds: RectF): Path? {
    val path = Path()

    val x = bounds.left + resolveLengthPercentage(xywh.x, bounds.width())
    val y = bounds.top + resolveLengthPercentage(xywh.y, bounds.height())
    val width = resolveLengthPercentage(xywh.width, bounds.width())
    val height = resolveLengthPercentage(xywh.height, bounds.height())

    val rect = RectF(x, y, x + width, y + height)
    if (rect.width() < 0f || rect.height() < 0f) {
      return null
    }

    addRectWithOptionalBorderRadius(path, rect, xywh.borderRadius)
    return path
  }

  public fun createRoundedRectPath(bounds: RectF, borderRadius: ComputedBorderRadius): Path {
    val path = Path()

    val topLeftRadii = borderRadius.topLeft.toPixelFromDIP()
    val topRightRadii = borderRadius.topRight.toPixelFromDIP()
    val bottomRightRadii = borderRadius.bottomRight.toPixelFromDIP()
    val bottomLeftRadii = borderRadius.bottomLeft.toPixelFromDIP()

    val radii = floatArrayOf(
        topLeftRadii.horizontal, topLeftRadii.vertical,
        topRightRadii.horizontal, topRightRadii.vertical,
        bottomRightRadii.horizontal, bottomRightRadii.vertical,
        bottomLeftRadii.horizontal, bottomLeftRadii.vertical
    )

    path.addRoundRect(bounds, radii, Path.Direction.CW)
    return path
  }
}
