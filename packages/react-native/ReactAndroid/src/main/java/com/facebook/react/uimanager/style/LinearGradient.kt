/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.LinearGradient as AndroidLinearGradient
import android.graphics.Shader
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.LengthPercentage
import kotlin.math.atan
import kotlin.math.sqrt
import kotlin.math.tan

/**
 * Represents a CSS linear gradient for background rendering.
 *
 * This class implements the CSS linear-gradient specification, supporting angle-based and
 * keyword-based directions along with color stops. It generates an Android Shader for rendering.
 *
 * @property direction The direction of the gradient (angle or keyword)
 * @property colorStops The list of color stops defining the gradient colors
 * @see <a href="https://www.w3.org/TR/css-images-3/#linear-gradients">CSS Linear Gradients</a>
 */
internal class LinearGradient(val direction: Direction, val colorStops: List<ColorStop>) :
    Gradient {
  companion object {
    fun parse(gradientMap: ReadableMap, context: Context): Gradient? {
      val direction =
          gradientMap
              .takeIf { it.hasKey("direction") }
              ?.let { map ->
                val directionMap = map.getMap("direction") ?: return null

                when (directionMap.getString("type")) {
                  "angle" -> {
                    val angle = directionMap.getDouble("value")
                    Direction.Angle(angle)
                  }
                  "keyword" ->
                      Direction.KeywordType.fromString(directionMap.getString("value"))?.let {
                          keywordType ->
                        Direction.Keyword(keywordType)
                      }
                  else -> null
                }
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

      if (direction != null && colorStops != null) {
        return LinearGradient(direction, colorStops)
      }

      return null
    }
  }

  /**
   * Sealed class representing the direction of a linear gradient.
   *
   * Directions can be specified using explicit angles or CSS keywords.
   */
  sealed class Direction {
    /**
     * Represents a direction specified as an angle in degrees.
     *
     * @property angle The angle in degrees (0 = to top, 90 = to right, etc.)
     */
    class Angle(val angle: Double) : Direction()

    /**
     * Represents a direction specified using a CSS keyword.
     *
     * @property keyword The direction keyword
     */
    class Keyword(val keyword: KeywordType) : Direction()

    /**
     * Enum of CSS linear gradient direction keywords.
     *
     * @property value The CSS string value
     */
    enum class KeywordType(val value: String) {
      /** Gradient runs toward the top-right corner. */
      TO_TOP_RIGHT("to top right"),
      /** Gradient runs toward the bottom-right corner. */
      TO_BOTTOM_RIGHT("to bottom right"),
      /** Gradient runs toward the top-left corner. */
      TO_TOP_LEFT("to top left"),
      /** Gradient runs toward the bottom-left corner. */
      TO_BOTTOM_LEFT("to bottom left");

      companion object {
        fun fromString(value: String?) = enumValues<KeywordType>().find { it.value == value }
      }
    }
  }

  override fun getShader(width: Float, height: Float): Shader {
    val angle =
        when (direction) {
          is Direction.Angle -> direction.angle
          is Direction.Keyword ->
              getAngleForKeyword(direction.keyword, width.toDouble(), height.toDouble())
        }
    val (startPoint, endPoint) = endPointsFromAngle(angle, height, width)
    val dx = endPoint[0] - startPoint[0]
    val dy = endPoint[1] - startPoint[1]
    val gradientLineLength = sqrt(dx * dx + dy * dy)
    val finalStops = ColorStopUtils.getFixedColorStops(colorStops, gradientLineLength)
    val colors = IntArray(finalStops.size)
    val positions = FloatArray(finalStops.size)

    finalStops.forEachIndexed { i, colorStop ->
      val color = colorStop.color
      if (color != null && colorStop.position != null) {
        colors[i] = color
        positions[i] = colorStop.position
      }
    }
    return AndroidLinearGradient(
        startPoint[0],
        startPoint[1],
        endPoint[0],
        endPoint[1],
        colors,
        positions,
        Shader.TileMode.CLAMP,
    )
  }

  // Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
  // Refer `using keywords` section
  private fun getAngleForKeyword(
      keyword: Direction.KeywordType,
      width: Double,
      height: Double,
  ): Double {
    return when (keyword) {
      Direction.KeywordType.TO_TOP_RIGHT -> {
        val angleDeg = Math.toDegrees(atan(width / height))
        90 - angleDeg
      }
      Direction.KeywordType.TO_BOTTOM_RIGHT -> Math.toDegrees(atan(width / height)) + 90
      Direction.KeywordType.TO_TOP_LEFT -> Math.toDegrees(atan(width / height)) + 270
      Direction.KeywordType.TO_BOTTOM_LEFT -> Math.toDegrees(atan(height / width)) + 180
    }
  }

  // Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
  // Reference:
  // https://github.com/chromium/chromium/blob/d32abbe13f5d52be7127fe25d5b778498165fab8/third_party/blink/renderer/core/css/css_gradient_value.cc#L1057
  private fun endPointsFromAngle(
      angle: Double,
      height: Float,
      width: Float,
  ): Pair<FloatArray, FloatArray> {
    var adjustedAngle = angle % 360
    if (adjustedAngle < 0) {
      adjustedAngle += 360
    }

    when (adjustedAngle) {
      0.0 -> return Pair(floatArrayOf(0f, height), floatArrayOf(0f, 0f))
      90.0 -> return Pair(floatArrayOf(0f, 0f), floatArrayOf(width, 0f))
      180.0 -> return Pair(floatArrayOf(0f, 0f), floatArrayOf(0f, height))
      270.0 -> return Pair(floatArrayOf(width, 0f), floatArrayOf(0f, 0f))
    }

    val slope = tan(Math.toRadians((90 - adjustedAngle))).toFloat()
    val perpendicularSlope = -1 / slope

    val halfHeight = height / 2
    val halfWidth = width / 2

    val endCorner =
        when {
          adjustedAngle < 90 -> floatArrayOf(halfWidth, halfHeight)
          adjustedAngle < 180 -> floatArrayOf(halfWidth, -halfHeight)
          adjustedAngle < 270 -> floatArrayOf(-halfWidth, -halfHeight)
          else -> floatArrayOf(-halfWidth, halfHeight)
        }

    val c = endCorner[1] - perpendicularSlope * endCorner[0]
    val endX = c / (slope - perpendicularSlope)
    val endY = perpendicularSlope * endX + c

    val secondPoint = floatArrayOf(halfWidth + endX, halfHeight - endY)
    val firstPoint = floatArrayOf(halfWidth - endX, halfHeight + endY)

    return Pair(firstPoint, secondPoint)
  }
}
