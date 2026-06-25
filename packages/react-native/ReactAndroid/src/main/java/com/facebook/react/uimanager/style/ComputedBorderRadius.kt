/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

/**
 * Enum representing the computed border radius properties for each physical corner.
 *
 * Unlike [BorderRadiusProp] which includes logical properties, this enum only contains the four
 * physical corners after layout direction resolution.
 */
public enum class ComputedBorderRadiusProp {
  /** The computed border radius for the top-left corner. */
  COMPUTED_BORDER_TOP_LEFT_RADIUS,
  /** The computed border radius for the top-right corner. */
  COMPUTED_BORDER_TOP_RIGHT_RADIUS,
  /** The computed border radius for the bottom-right corner. */
  COMPUTED_BORDER_BOTTOM_RIGHT_RADIUS,
  /** The computed border radius for the bottom-left corner. */
  COMPUTED_BORDER_BOTTOM_LEFT_RADIUS,
}

/**
 * Represents the resolved border radius values for all four physical corners.
 *
 * This data class contains the final computed [CornerRadii] values (in DIPs) after resolving
 * logical properties based on layout direction and ensuring no corner overlap per CSS spec.
 *
 * @property topLeft The radii for the top-left corner
 * @property topRight The radii for the top-right corner
 * @property bottomLeft The radii for the bottom-left corner
 * @property bottomRight The radii for the bottom-right corner
 * @see BorderRadiusStyle
 * @see CornerRadii
 */
public data class ComputedBorderRadius(
    val topLeft: CornerRadii,
    val topRight: CornerRadii,
    val bottomLeft: CornerRadii,
    val bottomRight: CornerRadii,
) {
  /**
   * Checks if any corner has a non-zero border radius.
   *
   * @return true if at least one corner has a positive radius
   */
  public fun hasRoundedBorders(): Boolean {
    return topLeft.horizontal > 0f ||
        topLeft.vertical > 0f ||
        topRight.horizontal > 0f ||
        topRight.vertical > 0f ||
        bottomLeft.horizontal > 0f ||
        bottomLeft.vertical > 0f ||
        bottomRight.horizontal > 0f
  }

  /**
   * Checks if all corners have the same radius values.
   *
   * @return true if all corners are equal
   */
  public fun isUniform(): Boolean {
    return topLeft == topRight && topLeft == bottomLeft && topLeft == bottomRight
  }

  /**
   * Gets the corner radii for a specific computed border radius property.
   *
   * @param property The computed border radius property
   * @return The CornerRadii for the specified corner
   */
  public fun get(property: ComputedBorderRadiusProp): CornerRadii {
    return when (property) {
      ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_LEFT_RADIUS -> topLeft
      ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_RIGHT_RADIUS -> topRight
      ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_LEFT_RADIUS -> bottomLeft
      ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_RIGHT_RADIUS -> bottomRight
    }
  }

  /** Creates a ComputedBorderRadius with all corners set to zero radius. */
  public constructor() :
      this(CornerRadii(0f, 0f), CornerRadii(0f, 0f), CornerRadii(0f, 0f), CornerRadii(0f, 0f))
}
