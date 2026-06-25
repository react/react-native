/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.LengthPercentage

/**
 * Represents a background size value with horizontal (x) and vertical (y) length/percentage
 * components.
 *
 * This class handles CSS-like background-size values where each dimension can be a length,
 * percentage, or "auto". A null value for x or y indicates "auto" sizing for that dimension.
 *
 * @property x The horizontal size component, or null for "auto"
 * @property y The vertical size component, or null for "auto"
 */
internal class BackgroundSizeLengthPercentage(
    public val x: LengthPercentage?,
    public val y: LengthPercentage?,
) {
  /**
   * Checks if the horizontal dimension is set to auto.
   *
   * @return true if x is null (auto), false otherwise
   */
  public fun isXAuto(): Boolean = x == null

  /**
   * Checks if the vertical dimension is set to auto.
   *
   * @return true if y is null (auto), false otherwise
   */
  public fun isYAuto(): Boolean = y == null

  public companion object {
    /**
     * Parses a ReadableMap into a BackgroundSizeLengthPercentage.
     *
     * The map should contain "x" and/or "y" keys with values that are either numbers (treated as
     * points), percentage strings (e.g., "50%"), or "auto".
     *
     * @param backgroundSizeMap The map containing x and y size values
     * @return A BackgroundSizeLengthPercentage instance, or null if the map is null
     */
    public fun parse(backgroundSizeMap: ReadableMap?): BackgroundSizeLengthPercentage? {
      if (backgroundSizeMap == null) return null

      val x =
          if (
              backgroundSizeMap.hasKey("x") && backgroundSizeMap.getType("x") != ReadableType.Null
          ) {
            when (backgroundSizeMap.getType("x")) {
              ReadableType.Number ->
                  LengthPercentage.setFromDynamic(backgroundSizeMap.getDynamic("x"))
              ReadableType.String -> {
                when (val xStr = backgroundSizeMap.getString("x")) {
                  "auto" -> null
                  else -> {
                    if (xStr != null && xStr.endsWith("%")) {
                      LengthPercentage.setFromDynamic(backgroundSizeMap.getDynamic(("x")))
                    } else {
                      null
                    }
                  }
                }
              }

              else -> null
            }
          } else null

      val y =
          if (
              backgroundSizeMap.hasKey("y") && backgroundSizeMap.getType("y") != ReadableType.Null
          ) {
            when (backgroundSizeMap.getType("y")) {
              ReadableType.Number ->
                  LengthPercentage.setFromDynamic(backgroundSizeMap.getDynamic("y"))
              ReadableType.String -> {
                val yStr = backgroundSizeMap.getString("y")
                when (yStr) {
                  "auto" -> null
                  else -> {
                    if (yStr != null && yStr.endsWith("%")) {
                      LengthPercentage.setFromDynamic(backgroundSizeMap.getDynamic("y"))
                    } else {
                      null
                    }
                  }
                }
              }

              else -> null
            }
          } else null

      return BackgroundSizeLengthPercentage(x, y)
    }
  }
}

/**
 * Sealed class representing CSS background-size property values.
 *
 * This class models the different ways a background size can be specified in CSS, currently
 * supporting length/percentage/auto values for both dimensions.
 *
 * @see BackgroundSizeLengthPercentage
 */
internal sealed class BackgroundSize {
  /**
   * Represents a background size specified using length, percentage, or auto values.
   *
   * @property lengthPercentage The parsed size values for x and y dimensions
   */
  public class LengthPercentageAuto(public val lengthPercentage: BackgroundSizeLengthPercentage) :
      BackgroundSize()

  public companion object {
    /**
     * Parses a Dynamic value into a BackgroundSize.
     *
     * Currently supports map values containing x/y dimensions.
     *
     * @param backgroundSizeValue The dynamic value to parse
     * @return A BackgroundSize instance, or null if parsing fails
     */
    public fun parse(backgroundSizeValue: Dynamic?): BackgroundSize? {
      if (backgroundSizeValue == null) return null

      return when (backgroundSizeValue.type) {
        ReadableType.Map -> {
          val backgroundSizeValueMap = backgroundSizeValue.asMap() ?: return null
          val lengthPercentage = BackgroundSizeLengthPercentage.parse(backgroundSizeValueMap)
          if (lengthPercentage != null) {
            LengthPercentageAuto(lengthPercentage)
          } else {
            null
          }
        }
        else -> null
      }
    }
  }
}
