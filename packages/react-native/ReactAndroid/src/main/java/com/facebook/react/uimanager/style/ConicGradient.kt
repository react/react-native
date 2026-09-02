/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.Matrix
import android.graphics.Shader
import android.graphics.SweepGradient
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.dpToPx

internal class ConicGradient(
    val from: Float,
    val position: RadialGradient.Position,
    val colorStops: List<ColorStop>,
) : Gradient {
  companion object {
    fun parse(gradientMap: ReadableMap, context: Context): Gradient? {
      if (!gradientMap.hasKey("from") || !gradientMap.hasKey("position")) {
        return null
      }
      val from = gradientMap.getDouble("from").toFloat()
      val positionMap = gradientMap.getMap("position") ?: return null
      var top: LengthPercentage? = null
      var left: LengthPercentage? = null
      var right: LengthPercentage? = null
      var bottom: LengthPercentage? = null

      if (positionMap.hasKey("top")) {
        top = LengthPercentage.setFromDynamic(positionMap.getDynamic("top"))
      } else if (positionMap.hasKey("bottom")) {
        bottom = LengthPercentage.setFromDynamic(positionMap.getDynamic("bottom"))
      }
      if (positionMap.hasKey("left")) {
        left = LengthPercentage.setFromDynamic(positionMap.getDynamic("left"))
      } else if (positionMap.hasKey("right")) {
        right = LengthPercentage.setFromDynamic(positionMap.getDynamic("right"))
      }

      val colorStopsArray = gradientMap.getArray("colorStops") ?: return null
      val colorStops = ArrayList<ColorStop>(colorStopsArray.size())
      for (i in 0 until colorStopsArray.size()) {
        val colorStop = colorStopsArray.getMap(i) ?: continue
        val color: Int? =
            when {
              !colorStop.hasKey("color") || colorStop.isNull("color") -> null
              colorStop.getType("color") == ReadableType.Map ->
                  ColorPropConverter.getColor(colorStop.getMap("color"), context)
              else -> colorStop.getInt("color")
            }
        val stopPosition = LengthPercentage.setFromDynamic(colorStop.getDynamic("position"))
        colorStops.add(ColorStop(color, stopPosition))
      }

      if (colorStops.size < 2) {
        return null
      }
      return ConicGradient(from, RadialGradient.Position(top, left, right, bottom), colorStops)
    }
  }

  override fun getShader(width: Float, height: Float): Shader {
    var centerX = width / 2f
    var centerY = height / 2f
    position.top?.let {
      centerY = if (it.type == LengthPercentageType.PERCENT) it.resolve(height) else it.resolve(height).dpToPx()
    }
    position.bottom?.let {
      centerY = if (it.type == LengthPercentageType.PERCENT) height - it.resolve(height) else height - it.resolve(height).dpToPx()
    }
    position.left?.let {
      centerX = if (it.type == LengthPercentageType.PERCENT) it.resolve(width) else it.resolve(width).dpToPx()
    }
    position.right?.let {
      centerX = if (it.type == LengthPercentageType.PERCENT) width - it.resolve(width) else width - it.resolve(width).dpToPx()
    }

    val finalStops = ColorStopUtils.getFixedColorStops(colorStops, 1f)
    val colors = IntArray(finalStops.size)
    val positions = FloatArray(finalStops.size)
    finalStops.forEachIndexed { index, colorStop ->
      colors[index] = colorStop.color ?: 0
      positions[index] = colorStop.position ?: 0f
    }

    val shader = SweepGradient(centerX, centerY, colors, positions)
    shader.setLocalMatrix(Matrix().apply { setRotate(from - 90f, centerX, centerY) })
    return shader
  }
}
