/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.LengthPercentage

private fun getOptionalLengthPercentage(map: ReadableMap, key: String): LengthPercentage? {
  return if (map.hasKey(key)) {
    LengthPercentage.setFromDynamic(map.getDynamic(key))
  } else {
    null
  }
}

internal data class CircleShape(
    val r: LengthPercentage? = null,
    val cx: LengthPercentage? = null,
    val cy: LengthPercentage? = null,
) {
  public companion object {
    public fun parse(map: ReadableMap): CircleShape? {
      val r = getOptionalLengthPercentage(map, "r")
      val cx = getOptionalLengthPercentage(map, "cx")
      val cy = getOptionalLengthPercentage(map, "cy")
      return CircleShape(r, cx, cy)
    }
  }
}

internal data class EllipseShape(
    val rx: LengthPercentage? = null,
    val ry: LengthPercentage? = null,
    val cx: LengthPercentage? = null,
    val cy: LengthPercentage? = null,
) {
  public companion object {
    public fun parse(map: ReadableMap): EllipseShape? {
      val rx = getOptionalLengthPercentage(map, "rx")
      val ry = getOptionalLengthPercentage(map, "ry")
      val cx = getOptionalLengthPercentage(map, "cx")
      val cy = getOptionalLengthPercentage(map, "cy")
      return EllipseShape(rx, ry, cx, cy)
    }
  }
}

internal data class InsetShape(
    val top: LengthPercentage,
    val right: LengthPercentage,
    val bottom: LengthPercentage,
    val left: LengthPercentage,
    val borderRadius: LengthPercentage? = null,
) {
  public companion object {
    public fun parse(map: ReadableMap): InsetShape? {
      val top = getOptionalLengthPercentage(map, "top") ?: return null
      val right = getOptionalLengthPercentage(map, "right") ?: return null
      val bottom = getOptionalLengthPercentage(map, "bottom") ?: return null
      val left = getOptionalLengthPercentage(map, "left") ?: return null
      val borderRadius = getOptionalLengthPercentage(map, "borderRadius")
      return InsetShape(top, right, bottom, left, borderRadius)
    }
  }
}

public enum class FillRule {
  NonZero,
  EvenOdd;

  public companion object {
    public fun fromString(value: String): FillRule {
      return when (value.lowercase()) {
        "nonzero" -> NonZero
        "evenodd" -> EvenOdd
        else -> NonZero
      }
    }
  }
}

internal data class PolygonShape(
    val points: List<Pair<LengthPercentage, LengthPercentage>>,
    val fillRule: FillRule? = null,
) {
  public companion object {
    public fun parse(map: ReadableMap): PolygonShape? {
      if (!map.hasKey("points")) return null
      val pointsArray = map.getArray("points") ?: return null
      val points = mutableListOf<Pair<LengthPercentage, LengthPercentage>>()

      for (i in 0 until pointsArray.size()) {
        val pointMap = pointsArray.getMap(i) ?: continue
        val x = getOptionalLengthPercentage(pointMap, "x") ?: continue
        val y = getOptionalLengthPercentage(pointMap, "y") ?: continue
        points.add(Pair(x, y))
      }

      val fillRule =
          if (map.hasKey("fillRule")) {
            FillRule.fromString(map.getString("fillRule") ?: "nonzero")
          } else {
            null
          }

      return PolygonShape(points, fillRule)
    }
  }
}

internal data class RectShape(
    val top: LengthPercentage,
    val right: LengthPercentage,
    val bottom: LengthPercentage,
    val left: LengthPercentage,
    val borderRadius: LengthPercentage? = null,
) {
  public companion object {
    public fun parse(map: ReadableMap): RectShape? {
      val top = getOptionalLengthPercentage(map, "top") ?: return null
      val right = getOptionalLengthPercentage(map, "right") ?: return null
      val bottom = getOptionalLengthPercentage(map, "bottom") ?: return null
      val left = getOptionalLengthPercentage(map, "left") ?: return null
      val borderRadius = getOptionalLengthPercentage(map, "borderRadius")
      return RectShape(top, right, bottom, left, borderRadius)
    }
  }
}

internal data class XywhShape(
    val x: LengthPercentage,
    val y: LengthPercentage,
    val width: LengthPercentage,
    val height: LengthPercentage,
    val borderRadius: LengthPercentage? = null,
) {
  public companion object {
    public fun parse(map: ReadableMap): XywhShape? {
      val x = getOptionalLengthPercentage(map, "x") ?: return null
      val y = getOptionalLengthPercentage(map, "y") ?: return null
      val width = getOptionalLengthPercentage(map, "width") ?: return null
      val height = getOptionalLengthPercentage(map, "height") ?: return null
      val borderRadius = getOptionalLengthPercentage(map, "borderRadius")
      return XywhShape(x, y, width, height, borderRadius)
    }
  }
}

public sealed class BasicShape {
  internal data class Circle(val shape: CircleShape) : BasicShape()

  internal data class Ellipse(val shape: EllipseShape) : BasicShape()

  internal data class Inset(val shape: InsetShape) : BasicShape()

  internal data class Polygon(val shape: PolygonShape) : BasicShape()

  internal data class Rect(val shape: RectShape) : BasicShape()

  internal data class Xywh(val shape: XywhShape) : BasicShape()

  public companion object {
    public fun parse(map: ReadableMap): BasicShape? {
      if (!map.hasKey("type")) return null
      val type = map.getString("type") ?: return null

      return when (type.lowercase()) {
        "circle" -> {
          val circle = CircleShape.parse(map) ?: return null
          Circle(circle)
        }
        "ellipse" -> {
          val ellipse = EllipseShape.parse(map) ?: return null
          Ellipse(ellipse)
        }
        "inset" -> {
          val inset = InsetShape.parse(map) ?: return null
          Inset(inset)
        }
        "polygon" -> {
          val polygon = PolygonShape.parse(map) ?: return null
          Polygon(polygon)
        }
        "rect" -> {
          val rect = RectShape.parse(map) ?: return null
          Rect(rect)
        }
        "xywh" -> {
          val xywh = XywhShape.parse(map) ?: return null
          Xywh(xywh)
        }
        else -> null
      }
    }
  }
}

public enum class GeometryBox {
  MarginBox,
  BorderBox,
  ContentBox,
  PaddingBox,
  FillBox,
  StrokeBox,
  ViewBox;

  public companion object {
    public fun fromString(value: String): GeometryBox {
      return when (value.lowercase()) {
        "margin-box" -> MarginBox
        "border-box" -> BorderBox
        "content-box" -> ContentBox
        "padding-box" -> PaddingBox
        "fill-box" -> FillBox
        "stroke-box" -> StrokeBox
        "view-box" -> ViewBox
        else -> BorderBox
      }
    }
  }
}

public data class ClipPath(
    val shape: BasicShape? = null,
    val geometryBox: GeometryBox? = null,
) {
  public companion object {
    public fun parse(map: ReadableMap?): ClipPath? {
      if (map == null) return null

      val shape =
          if (map.hasKey("shape") && map.getType("shape") == ReadableType.Map) {
            val shapeMap = map.getMap("shape")
            if (shapeMap != null) BasicShape.parse(shapeMap) else null
          } else {
            null
          }

      val geometryBox =
          if (map.hasKey("geometryBox")) {
            GeometryBox.fromString(map.getString("geometryBox") ?: "border-box")
          } else {
            null
          }

      return ClipPath(shape, geometryBox)
    }
  }
}
