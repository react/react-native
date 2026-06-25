/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.PixelUtil

/**
 * Represents the resolved horizontal and vertical radii of the ellipse representing a corner.
 *
 * This data class stores the computed radius values for a single corner of a view's border. Each
 * corner can have an elliptical shape with different horizontal and vertical radii.
 *
 * @property horizontal The horizontal radius of the corner ellipse in pixels
 * @property vertical The vertical radius of the corner ellipse in pixels
 */
public data class CornerRadii(
    val horizontal: Float = 0f,
    val vertical: Float = 0f,
) {
  /**
   * Creates CornerRadii by resolving a LengthPercentage value against reference dimensions.
   *
   * @param length The length/percentage value to resolve
   * @param referenceWidth The reference width for percentage calculations
   * @param referenceHeight The reference height for percentage calculations
   */
  public constructor(
      length: LengthPercentage,
      referenceWidth: Float,
      referenceHeight: Float,
  ) : this(horizontal = length.resolve(referenceWidth), vertical = length.resolve(referenceHeight))

  /**
   * Converts the corner radii from density-independent pixels (DIP) to physical pixels.
   *
   * @return A new CornerRadii with values converted to pixels
   */
  public fun toPixelFromDIP(): CornerRadii {
    return CornerRadii(PixelUtil.toPixelFromDIP(horizontal), PixelUtil.toPixelFromDIP(vertical))
  }
}
