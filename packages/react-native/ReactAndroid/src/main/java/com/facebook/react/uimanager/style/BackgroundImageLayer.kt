/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.Shader
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

/**
 * Represents a single layer of a background image, typically containing a gradient.
 *
 * This class encapsulates gradient definitions (linear or radial) that can be applied as background
 * layers to React Native views. It provides parsing from React Native bridge data and shader
 * generation for rendering.
 *
 * @see LinearGradient
 * @see RadialGradient
 */
public class BackgroundImageLayer() {
  private lateinit var gradient: Gradient

  private constructor(gradient: Gradient) : this() {
    this.gradient = gradient
  }

  public companion object {
    /**
     * Parses a ReadableMap into a BackgroundImageLayer.
     *
     * The map should contain gradient configuration including a "type" key specifying either
     * "linear-gradient" or "radial-gradient".
     *
     * @param gradientMap The map containing gradient configuration
     * @param context Android context for resource resolution
     * @return A BackgroundImageLayer instance, or null if parsing fails
     */
    public fun parse(gradientMap: ReadableMap?, context: Context): BackgroundImageLayer? {
      if (gradientMap == null) {
        return null
      }
      val gradient = parseGradient(gradientMap, context) ?: return null
      return BackgroundImageLayer(gradient)
    }

    private fun parseGradient(gradientMap: ReadableMap, context: Context): Gradient? {
      if (!gradientMap.hasKey("type") || gradientMap.getType("type") != ReadableType.String) {
        return null
      }

      return when (gradientMap.getString("type")) {
        "linear-gradient" -> LinearGradient.parse(gradientMap, context)
        "radial-gradient" -> RadialGradient.parse(gradientMap, context)
        else -> null
      }
    }
  }

  /**
   * Creates a shader for rendering this background layer.
   *
   * @param width The width of the area to fill
   * @param height The height of the area to fill
   * @return A Shader instance for rendering the gradient
   */
  public fun getShader(width: Float, height: Float): Shader = gradient.getShader(width, height)
}
