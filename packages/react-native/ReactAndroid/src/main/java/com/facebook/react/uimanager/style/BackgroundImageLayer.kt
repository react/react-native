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
public sealed class BackgroundImageLayer {
  public class GradientLayer internal constructor(private val gradient: Gradient) : BackgroundImageLayer() {
    public fun getShader(width: Float, height: Float): Shader = gradient.getShader(width, height)
  }

  public class URLImageLayer(public val uri: String) : BackgroundImageLayer()

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
    public fun parse(backgroundImageMap: ReadableMap?, context: Context): BackgroundImageLayer? {
      if (backgroundImageMap == null) {
        return null
      }

      if (!backgroundImageMap.hasKey("type") || backgroundImageMap.getType("type") != ReadableType.String) {
        return null
      }

      return when (backgroundImageMap.getString("type")) {
        "linear-gradient" -> {
          val gradient = LinearGradient.parse(backgroundImageMap, context) ?: return null
          GradientLayer(gradient)
        }
        "radial-gradient" -> {
          val gradient = RadialGradient.parse(backgroundImageMap, context) ?: return null
          GradientLayer(gradient)
        }
        "url" -> {
          val uri = backgroundImageMap.getString("uri") ?: return null
          URLImageLayer(uri)
        }
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
