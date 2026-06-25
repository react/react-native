/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.Matrix
import android.graphics.RadialGradient as AndroidRadialGradient
import android.graphics.Shader
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.FloatUtil
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.dpToPx
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sqrt

/**
 * Represents a CSS radial gradient for background rendering.
 *
 * This class implements the CSS radial-gradient specification, supporting circular and elliptical
 * shapes, various sizing keywords, and custom positioning. It generates an Android Shader for
 * rendering.
 *
 * @property shape The shape of the gradient (circle or ellipse)
 * @property size The sizing specification (keyword or explicit dimensions)
 * @property position The center position of the gradient
 * @property colorStops The list of color stops defining the gradient colors
 * @see <a href="https://www.w3.org/TR/css-images-3/#radial-gradients">CSS Radial Gradients</a>
 */
internal class RadialGradient(
    val shape: Shape,
    val size: GradientSize,
    val position: Position,
    val colorStops: List<ColorStop>,
) : Gradient {
  companion object {
    fun parse(gradientMap: ReadableMap, context: Context): Gradient? {
      val shape =
          gradientMap
              .takeIf { it.hasKey("shape") }
              ?.let { map ->
                map.getString("shape")?.let { shapeString -> Shape.fromString(shapeString) }
              }
      val size: GradientSize? =
          gradientMap
              .takeIf { it.hasKey("size") }
              ?.let { map ->
                when (map.getType("size")) {
                  ReadableType.String ->
                      GradientSize.KeywordType.fromString(map.getString("size"))?.let { keywordType
                        ->
                        GradientSize.Keyword(keywordType)
                      }
                  ReadableType.Map ->
                      map.getMap("size")
                          ?.takeIf { it.hasKey("x") && it.hasKey("y") }
                          ?.let { sizeMap ->
                            val x = LengthPercentage.setFromDynamic(sizeMap.getDynamic("x"))
                            val y = LengthPercentage.setFromDynamic(sizeMap.getDynamic("y"))
                            if (x != null && y != null) {
                              GradientSize.Dimensions(x, y)
                            } else null
                          }
                  else -> null
                }
              }

      val position =
          gradientMap
              .takeIf { it.hasKey("position") }
              ?.let { map ->
                val positionMap = map.getMap("position") ?: return null

                var top: LengthPercentage? = null
                var left: LengthPercentage? = null
                var right: LengthPercentage? = null
                var bottom: LengthPercentage? = null

                if (positionMap.hasKey("top")) {
                  val rawTop = positionMap.getDynamic("top")
                  top = LengthPercentage.setFromDynamic(rawTop)
                } else if (positionMap.hasKey("bottom")) {
                  val rawBottom = positionMap.getDynamic("bottom")
                  bottom = LengthPercentage.setFromDynamic(rawBottom)
                } else {
                  return null
                }

                if (positionMap.hasKey("left")) {
                  val rawLeft = positionMap.getDynamic("left")
                  left = LengthPercentage.setFromDynamic(rawLeft)
                } else if (positionMap.hasKey("right")) {
                  val rawRight = positionMap.getDynamic("right")
                  right = LengthPercentage.setFromDynamic(rawRight)
                } else {
                  return null
                }

                Position(top, left, right, bottom)
              }

      val colorStops =
          gradientMap
              .takeIf { it.hasKey("colorStops") }
              ?.let { map ->
                val colorStopsArray = map.getArray("colorStops") ?: return null

                val stops = ArrayList<ColorStop>(colorStopsArray.size())
                for (i in 0 until colorStopsArray.size()) {
                  val colorStop = colorStopsArray.getMap(i) ?: continue
                  val color: Int? =
                      when {
                        !colorStop.hasKey("color") || colorStop.isNull("color") -> {
                          null
                        }
                        colorStop.getType("color") == ReadableType.Map -> {
                          ColorPropConverter.getColor(colorStop.getMap("color"), context)
                        }
                        else -> colorStop.getInt("color")
                      }
                  val colorStopPosition =
                      LengthPercentage.setFromDynamic(colorStop.getDynamic("position"))
                  stops.add(ColorStop(color, colorStopPosition))
                }
                stops
              }

      if (shape != null && size != null && position != null && colorStops != null) {
        return RadialGradient(shape, size, position, colorStops)
      }

      return null
    }
  }

  /**
   * Enum representing the shape of a radial gradient.
   *
   * @see <a href="https://www.w3.org/TR/css-images-3/#valdef-radial-gradient-circle">CSS circle</a>
   */
  internal enum class Shape {
    /** A circular gradient with equal horizontal and vertical radii. */
    CIRCLE,
    /** An elliptical gradient that can have different horizontal and vertical radii. */
    ELLIPSE;

    companion object {
      fun fromString(value: String): Shape? {
        return when (value) {
          "circle" -> CIRCLE
          "ellipse" -> ELLIPSE
          else -> null
        }
      }
    }
  }

  /**
   * Sealed class representing the sizing specification for a radial gradient.
   *
   * Sizes can be specified using keywords (closest-side, farthest-corner, etc.) or explicit
   * dimensions.
   */
  sealed class GradientSize {
    /**
     * Represents a size specified using a CSS keyword.
     *
     * @property keyword The sizing keyword
     */
    class Keyword(val keyword: KeywordType) : GradientSize()

    /**
     * Represents a size specified using explicit horizontal and vertical dimensions.
     *
     * @property x The horizontal radius
     * @property y The vertical radius
     */
    class Dimensions(val x: LengthPercentage, val y: LengthPercentage) : GradientSize()

    /**
     * Enum of CSS radial gradient sizing keywords.
     *
     * @property value The CSS string value
     */
    enum class KeywordType(val value: String) {
      CLOSEST_SIDE("closest-side"),
      FARTHEST_SIDE("farthest-side"),
      CLOSEST_CORNER("closest-corner"),
      FARTHEST_CORNER("farthest-corner");

      companion object {
        fun fromString(value: String?) = enumValues<KeywordType>().find { it.value == value }
      }
    }
  }

  internal class Position(
      val top: LengthPercentage? = null,
      val left: LengthPercentage? = null,
      val right: LengthPercentage? = null,
      val bottom: LengthPercentage? = null,
  )

  override fun getShader(width: Float, height: Float): Shader {
    var centerX: Float = width / 2f
    var centerY: Float = height / 2f
    if (position.top != null) {
      centerY =
          if (position.top.type == LengthPercentageType.PERCENT) position.top.resolve(height)
          else position.top.resolve(height).dpToPx()
    } else if (position.bottom != null) {
      centerY =
          if (position.bottom.type == LengthPercentageType.PERCENT)
              height - position.bottom.resolve(height)
          else height - position.bottom.resolve(height).dpToPx()
    }

    if (position.left != null) {
      centerX =
          if (position.left.type == LengthPercentageType.PERCENT) position.left.resolve(width)
          else position.left.resolve(width).dpToPx()
    } else if (position.right != null) {
      centerX =
          if (position.right.type == LengthPercentageType.PERCENT)
              width - position.right.resolve(width)
          else width - position.right.resolve(width).dpToPx()
    }

    val (radiusX, radiusY) = calculateRadius(centerX, centerY, width, height)

    val finalStops = ColorStopUtils.getFixedColorStops(colorStops, max(radiusX, radiusY))
    val colors = IntArray(finalStops.size)
    val positions = FloatArray(finalStops.size)

    finalStops.forEachIndexed { i, colorStop ->
      val color = colorStop.color
      if (color != null && colorStop.position != null) {
        colors[i] = color
        positions[i] = colorStop.position
      }
    }

    // max is used to handle 0 radius user input. Radius has to be a positive float
    val radius = max(radiusX, 0.00001f)

    val shader =
        AndroidRadialGradient(centerX, centerY, radius, colors, positions, Shader.TileMode.CLAMP)

    val isCircle = shape == Shape.CIRCLE

    // If not a circle and radiusX != radiusY, apply transformation to make it elliptical
    if (!isCircle && !FloatUtil.floatsEqual(radiusX, radiusY)) {
      val matrix = Matrix()
      matrix.setScale(1f, radiusY / radiusX, centerX, centerY)
      shader.setLocalMatrix(matrix)
    }

    return shader
  }

  private fun radiusToSide(
      centerX: Float,
      centerY: Float,
      width: Float,
      height: Float,
      sizeKeyword: GradientSize.KeywordType,
  ): Pair<Float, Float> {
    val radiusXFromLeftSide = centerX
    val radiusYFromTopSide = centerY
    val radiusXFromRightSide = width - centerX
    val radiusYFromBottomSide = height - centerY
    val radiusX: Float
    val radiusY: Float

    if (sizeKeyword == GradientSize.KeywordType.CLOSEST_SIDE) {
      radiusX = min(radiusXFromLeftSide, radiusXFromRightSide)
      radiusY = min(radiusYFromTopSide, radiusYFromBottomSide)
    } else { // FARTHEST_SIDE
      radiusX = max(radiusXFromLeftSide, radiusXFromRightSide)
      radiusY = max(radiusYFromTopSide, radiusYFromBottomSide)
    }
    val isCircle = shape == Shape.CIRCLE
    if (isCircle) {
      val radius =
          if (sizeKeyword == GradientSize.KeywordType.CLOSEST_SIDE) {
            min(radiusX, radiusY)
          } else {
            max(radiusX, radiusY)
          }
      return Pair(radius, radius)
    }

    return Pair(radiusX, radiusY)
  }

  private fun calculateEllipseRadius(
      offsetX: Float,
      offsetY: Float,
      aspectRatio: Float,
  ): Pair<Float, Float> {
    if (aspectRatio == 0f || !aspectRatio.isFinite()) {
      return Pair(0f, 0f)
    }

    // Ellipse that passes through a point formula: (x-h)^2/a^2 + (y-k)^2/b^2 = 1
    // a = semi major axis length
    // b = semi minor axis length = a / aspectRatio
    // x - h = offsetX
    // y - k = offsetY
    val a = sqrt(offsetX * offsetX + offsetY * offsetY * aspectRatio * aspectRatio)
    return Pair(a, a / aspectRatio)
  }

  private fun radiusToCorner(
      centerX: Float,
      centerY: Float,
      width: Float,
      height: Float,
      sizeKeyword: GradientSize.KeywordType,
  ): Pair<Float, Float> {
    val corners =
        arrayOf(
            Pair(0f, 0f), // top-left
            Pair(width, 0f), // top-right
            Pair(width, height), // bottom-right
            Pair(0f, height), // bottom-left
        )

    var cornerIndex = 0
    var distance =
        sqrt(
            (centerX - corners[cornerIndex].first).pow(2) +
                (centerY - corners[cornerIndex].second).pow(2)
        )
    val isClosestCorner = sizeKeyword == GradientSize.KeywordType.CLOSEST_CORNER

    for (i in 1 until corners.size) {
      val newDistance =
          sqrt((centerX - corners[i].first).pow(2) + (centerY - corners[i].second).pow(2))
      if (isClosestCorner) {
        if (newDistance < distance) {
          distance = newDistance
          cornerIndex = i
        }
      } else {
        if (newDistance > distance) {
          distance = newDistance
          cornerIndex = i
        }
      }
    }

    val isCircle = shape == Shape.CIRCLE
    if (isCircle) {
      return Pair(distance, distance)
    }

    // https://www.w3.org/TR/css-images-3/#typedef-radial-size
    // Aspect ratio of corner size ellipse is same as the respective side size ellipse
    val sideKeyword =
        if (isClosestCorner) GradientSize.KeywordType.CLOSEST_SIDE
        else GradientSize.KeywordType.FARTHEST_SIDE
    val sideRadius = radiusToSide(centerX, centerY, width, height, sideKeyword)

    // Calculate ellipse radii based on the aspect ratio of the side ellipse
    return calculateEllipseRadius(
        corners[cornerIndex].first - centerX,
        corners[cornerIndex].second - centerY,
        sideRadius.first / sideRadius.second,
    )
  }

  private fun calculateRadius(
      centerX: Float,
      centerY: Float,
      width: Float,
      height: Float,
  ): Pair<Float, Float> {
    if (size is GradientSize.Keyword) {
      return when (val keyword = size.keyword) {
        GradientSize.KeywordType.CLOSEST_SIDE,
        GradientSize.KeywordType.FARTHEST_SIDE -> {
          radiusToSide(centerX, centerY, width, height, keyword)
        }
        GradientSize.KeywordType.CLOSEST_CORNER,
        GradientSize.KeywordType.FARTHEST_CORNER -> {
          radiusToCorner(centerX, centerY, width, height, keyword)
        }
      }
    } else if (size is GradientSize.Dimensions) {
      val radiusX =
          if (size.x.type == LengthPercentageType.PERCENT) size.x.resolve(width)
          else size.x.resolve(width).dpToPx()
      val radiusY =
          if (size.y.type == LengthPercentageType.PERCENT) size.y.resolve(height)
          else size.y.resolve(height).dpToPx()

      val isCircle = shape == Shape.CIRCLE
      return if (isCircle) {
        val radius = max(radiusX, radiusY)
        Pair(radius, radius)
      } else {
        Pair(radiusX, radiusY)
      }
    } else {
      return radiusToCorner(
          centerX,
          centerY,
          width,
          height,
          GradientSize.KeywordType.FARTHEST_CORNER,
      )
    }
  }
}
