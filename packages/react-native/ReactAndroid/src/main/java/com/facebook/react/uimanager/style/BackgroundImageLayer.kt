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
 * Represents a single layer of a background image: a gradient, or an image loaded from a `url()`.
 *
 * This class encapsulates gradient definitions (linear or radial) and `url()` images that can be
 * applied as background layers to React Native views. It provides parsing from React Native bridge
 * data and shader generation for rendering gradients.
 *
 * @see LinearGradient
 * @see RadialGradient
 */
public class BackgroundImageLayer() {
  private lateinit var gradient: Gradient

  /** The source uri of a `url()` layer, or null for a gradient layer. */
  internal var uri: String? = null

  /** Natural size in DIPs, supplied for bundled assets. Null for a plain url. */
  internal var intrinsicWidth: Float? = null

  internal var intrinsicHeight: Float? = null

  private constructor(gradient: Gradient) : this() {
    this.gradient = gradient
  }

  public companion object {
    /**
     * Parses a ReadableMap into a BackgroundImageLayer.
     *
     * The map should contain a "type" key specifying either "linear-gradient", "radial-gradient",
     * or "url".
     *
     * @param gradientMap The map containing the background image configuration
     * @param context Android context for resource resolution
     * @return A BackgroundImageLayer instance, or null if parsing fails
     */
    public fun parse(gradientMap: ReadableMap?, context: Context): BackgroundImageLayer? {
      if (gradientMap == null) {
        return null
      }
      if (
          gradientMap.hasKey("type") &&
              gradientMap.getType("type") == ReadableType.String &&
              gradientMap.getString("type") == "url"
      ) {
        return parseURLImage(gradientMap)
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

    private fun parseURLImage(urlMap: ReadableMap): BackgroundImageLayer? {
      if (!urlMap.hasKey("uri") || urlMap.getType("uri") != ReadableType.String) {
        return null
      }
      val uri = urlMap.getString("uri") ?: return null
      return BackgroundImageLayer().apply {
        this.uri = uri
        intrinsicWidth = readDimension(urlMap, "intrinsicWidth")
        intrinsicHeight = readDimension(urlMap, "intrinsicHeight")
      }
    }

    private fun readDimension(map: ReadableMap, key: String): Float? =
        if (map.hasKey(key) && map.getType(key) == ReadableType.Number) {
          map.getDouble(key).toFloat()
        } else {
          null
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
