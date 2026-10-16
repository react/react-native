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
 * Represents a single layer of a background image, either a gradient or an image loaded from a URL.
 *
 * This class encapsulates the background image definitions (linear gradient, radial gradient, or
 * `url()`) that can be applied as background layers to React Native views. It provides parsing from
 * React Native bridge data and shader generation for rendering.
 *
 * @see LinearGradient
 * @see RadialGradient
 */
public sealed class BackgroundImageLayer {
  /** A layer rendered from a linear or radial gradient. */
  public class GradientLayer internal constructor(private val gradient: Gradient) :
      BackgroundImageLayer() {
    /**
     * Creates a shader for rendering this background layer.
     *
     * @param width The width of the area to fill
     * @param height The height of the area to fill
     * @return A Shader instance for rendering the gradient
     */
    public fun getShader(width: Float, height: Float): Shader = gradient.getShader(width, height)
  }

  /**
   * A layer rendered from an image fetched from [uri].
   *
   * @param uri The source URI of the image to draw
   * @param intrinsicWidth Natural width in DIPs, or null
   * @param intrinsicHeight Natural height in DIPs, or null
   */
  public class URLImageLayer(
      public val uri: String,
      public val intrinsicWidth: Float? = null,
      public val intrinsicHeight: Float? = null,
  ) : BackgroundImageLayer() {
    override fun equals(other: Any?): Boolean =
        other is URLImageLayer &&
            uri == other.uri &&
            intrinsicWidth == other.intrinsicWidth &&
            intrinsicHeight == other.intrinsicHeight
  }

  public companion object {
    /**
     * Parses a ReadableMap into a BackgroundImageLayer.
     *
     * The map should contain a "type" key specifying either "linear-gradient", "radial-gradient",
     * or "url".
     *
     * @param backgroundImageMap The map containing the background image configuration
     * @param context Android context for resource resolution
     * @return A BackgroundImageLayer instance, or null if parsing fails
     */
    public fun parse(backgroundImageMap: ReadableMap?, context: Context): BackgroundImageLayer? {
      if (backgroundImageMap == null) {
        return null
      }

      if (!backgroundImageMap.hasKey("type") ||
          backgroundImageMap.getType("type") != ReadableType.String) {
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
          URLImageLayer(
              uri,
              readDimension(backgroundImageMap, "intrinsicWidth"),
              readDimension(backgroundImageMap, "intrinsicHeight"),
          )
        }
        else -> null
      }
    }

    private fun readDimension(map: ReadableMap, key: String): Float? =
        if (map.hasKey(key) && map.getType(key) == ReadableType.Number) {
          map.getDouble(key).toFloat()
        } else {
          null
        }
  }
}
