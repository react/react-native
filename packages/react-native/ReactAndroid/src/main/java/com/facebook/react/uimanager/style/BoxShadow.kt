/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import androidx.annotation.ColorInt
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.JSApplicationCausedNativeException
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

/**
 * Represents a box shadow effect that can be applied to a React Native view.
 *
 * This data class models the CSS box-shadow property, including offset, blur, spread, color, and
 * inset options.
 *
 * @property offsetX The horizontal offset of the shadow in pixels
 * @property offsetY The vertical offset of the shadow in pixels
 * @property color The color of the shadow, or null for default
 * @property blurRadius The blur radius of the shadow, or null for no blur
 * @property spreadDistance The spread distance of the shadow, or null for no spread
 * @property inset Whether the shadow is inset (inner shadow), or null for outer shadow
 */
public data class BoxShadow(
    val offsetX: Float,
    val offsetY: Float,
    @param:ColorInt val color: Int? = null,
    val blurRadius: Float? = null,
    val spreadDistance: Float? = null,
    val inset: Boolean? = null,
) {
  public companion object {
    /**
     * Parses a ReadableMap into a BoxShadow.
     *
     * The map must contain "offsetX" and "offsetY" keys. Optional keys include "color",
     * "blurRadius", "spreadDistance", and "inset".
     *
     * @param boxShadow The map containing box shadow configuration
     * @param context Android context for color resolution
     * @return A BoxShadow instance, or null if required fields are missing
     */
    @JvmStatic
    public fun parse(boxShadow: ReadableMap?, context: Context): BoxShadow? {
      if (boxShadow == null || !(boxShadow.hasKey("offsetX") && boxShadow.hasKey("offsetY"))) {
        return null
      }

      val offsetX = boxShadow.getDouble("offsetX").toFloat()
      val offsetY = boxShadow.getDouble("offsetY").toFloat()

      val color =
          if (boxShadow.hasKey("color")) {
            when (val type = boxShadow.getType("color")) {
              ReadableType.Number -> boxShadow.getInt("color")
              ReadableType.Map -> ColorPropConverter.getColor(boxShadow.getMap("color"), context)
              else -> throw JSApplicationCausedNativeException("Unsupported color type $type")
            }
          } else null
      val blurRadius =
          if (boxShadow.hasKey("blurRadius")) boxShadow.getDouble("blurRadius").toFloat() else null
      val spreadDistance =
          if (boxShadow.hasKey("spreadDistance")) boxShadow.getDouble("spreadDistance").toFloat()
          else null
      val inset = if (boxShadow.hasKey("inset")) boxShadow.getBoolean("inset") else null

      return BoxShadow(
          offsetX = offsetX,
          offsetY = offsetY,
          color = color,
          blurRadius = blurRadius,
          spreadDistance = spreadDistance,
          inset = inset,
      )
    }
  }
}
