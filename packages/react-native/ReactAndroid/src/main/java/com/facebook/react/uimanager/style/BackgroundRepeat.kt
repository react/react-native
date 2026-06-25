/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

/**
 * Enum representing the possible repeat behavior keywords for background images.
 *
 * These values correspond to CSS background-repeat keywords.
 */
internal enum class BackgroundRepeatKeyword {
  /** The image is repeated as much as needed to cover the background area. */
  Repeat,
  /** The image is repeated as much as possible without clipping, with space distributed evenly. */
  Space,
  /** The image is repeated as much as possible without clipping, scaling to fit evenly. */
  Round,
  /** The image is not repeated and only shown once. */
  NoRepeat,
}

/**
 * Represents the background repeat behavior for both horizontal and vertical axes.
 *
 * This class models the CSS background-repeat property, specifying how background images should be
 * repeated in each direction.
 *
 * @property x The repeat behavior for the horizontal axis
 * @property y The repeat behavior for the vertical axis
 */
internal class BackgroundRepeat(
    public val x: BackgroundRepeatKeyword,
    public val y: BackgroundRepeatKeyword,
) {
  public companion object {
    /**
     * Parses a ReadableMap into a BackgroundRepeat.
     *
     * The map should contain "x" and/or "y" keys with string values matching the
     * BackgroundRepeatKeyword values. Missing values default to Repeat.
     *
     * @param backgroundRepeatMap The map containing repeat values
     * @return A BackgroundRepeat instance, or null if the map is null
     */
    public fun parse(backgroundRepeatMap: ReadableMap?): BackgroundRepeat? {
      if (backgroundRepeatMap == null) return null

      val x = parseRepeatStyle(backgroundRepeatMap, "x") ?: BackgroundRepeatKeyword.Repeat
      val y = parseRepeatStyle(backgroundRepeatMap, "y") ?: BackgroundRepeatKeyword.Repeat

      return BackgroundRepeat(x, y)
    }

    private fun parseRepeatStyle(map: ReadableMap, key: String): BackgroundRepeatKeyword? {
      if (!map.hasKey(key) || map.getType(key) != ReadableType.String) return null

      return when (map.getString(key)) {
        "repeat" -> BackgroundRepeatKeyword.Repeat
        "space" -> BackgroundRepeatKeyword.Space
        "round" -> BackgroundRepeatKeyword.Round
        "no-repeat" -> BackgroundRepeatKeyword.NoRepeat
        else -> null
      }
    }
  }
}
