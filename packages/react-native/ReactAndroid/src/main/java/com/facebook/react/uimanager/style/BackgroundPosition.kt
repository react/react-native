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

/**
 * Represents the position of a background image within its container.
 *
 * This class models CSS-like background-position values, allowing specification of offsets from any
 * edge (top, left, right, bottom). Each offset can be a length or percentage value.
 *
 * @property top Offset from the top edge, or null if not specified
 * @property left Offset from the left edge, or null if not specified
 * @property right Offset from the right edge, or null if not specified
 * @property bottom Offset from the bottom edge, or null if not specified
 */
internal class BackgroundPosition(
    public val top: LengthPercentage?,
    public val left: LengthPercentage?,
    public val right: LengthPercentage?,
    public val bottom: LengthPercentage?,
) {
  public companion object {
    /**
     * Parses a ReadableMap into a BackgroundPosition.
     *
     * The map may contain "top", "left", "right", and/or "bottom" keys with length or percentage
     * values.
     *
     * @param backgroundPositionMap The map containing position values
     * @return A BackgroundPosition instance, or null if the map is null
     */
    public fun parse(backgroundPositionMap: ReadableMap?): BackgroundPosition? {
      if (backgroundPositionMap == null) return null

      val top =
          if (
              backgroundPositionMap.hasKey("top") &&
                  backgroundPositionMap.getType("top") != ReadableType.Null
          ) {
            LengthPercentage.setFromDynamic(backgroundPositionMap.getDynamic("top"), true)
          } else null

      val left =
          if (
              backgroundPositionMap.hasKey("left") &&
                  backgroundPositionMap.getType("left") != ReadableType.Null
          ) {
            LengthPercentage.setFromDynamic(backgroundPositionMap.getDynamic("left"), true)
          } else null

      val right =
          if (
              backgroundPositionMap.hasKey("right") &&
                  backgroundPositionMap.getType("right") != ReadableType.Null
          ) {
            LengthPercentage.setFromDynamic(backgroundPositionMap.getDynamic("right"), true)
          } else null

      val bottom =
          if (
              backgroundPositionMap.hasKey("bottom") &&
                  backgroundPositionMap.getType("bottom") != ReadableType.Null
          ) {
            LengthPercentage.setFromDynamic(backgroundPositionMap.getDynamic("bottom"), true)
          } else null

      return BackgroundPosition(top, left, right, bottom)
    }
  }
}
