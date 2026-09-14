/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import androidx.core.graphics.ColorUtils
import com.facebook.react.shared.GradientStopInput
import com.facebook.react.shared.GradientStops
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil

/**
 * Represents a color stop in a gradient as specified by the user.
 *
 * Color stops define the colors and their positions within a gradient. Both color and position can
 * be null to support CSS gradient syntax features like transition hints.
 *
 * Examples:
 * - color is null in transition hint syntax: (red, 20%, green)
 * - position can be null too: (red 20%, green, purple)
 *
 * @property color The color value at this stop, or null for transition hints
 * @property position The position of this stop as a length or percentage, or null for auto
 */
internal class ColorStop(var color: Int? = null, val position: LengthPercentage? = null)

/**
 * Represents a color stop after processing with resolved position.
 *
 * This class is used internally during the color stop fix-up algorithm. Both properties are
 * nullable to accommodate intermediate states during processing, but will be non-null after
 * [ColorStopUtils.getFixedColorStops] completes.
 *
 * @property color The resolved color value, or null during processing
 * @property position The resolved position as a fraction (0.0 to 1.0), or null during processing
 */
internal class ProcessedColorStop(var color: Int? = null, val position: Float? = null)

/**
 * Utility object for processing gradient color stops according to CSS specification.
 *
 * This object implements the color stop fix-up algorithm as defined in the CSS Images Module Level
 * 4 specification, handling position interpolation and transition hints.
 *
 * @see <a href="https://drafts.csswg.org/css-images-4/#coloring-gradient-line">CSS Images Module
 *   Level 4</a>
 */
internal object ColorStopUtils {
  /**
   * Processes a list of color stops into fixed color stops with resolved positions.
   *
   * This method implements the CSS color stop fix-up algorithm:
   * 1. Sets first stop position to 0% and last to 100% if not specified
   * 2. Ensures positions are monotonically increasing
   * 3. Interpolates positions for stops without explicit positions
   * 4. Processes transition hints by generating intermediate color stops
   *
   * @param colorStops The input color stops from user specification
   * @param gradientLineLength The length of the gradient line in pixels
   * @return A list of processed color stops with all positions resolved
   */
  fun getFixedColorStops(
      colorStops: List<ColorStop>,
      gradientLineLength: Float,
  ): List<ProcessedColorStop> {
    val inputs =
        colorStops.map { stop ->
          GradientStopInput(
              resolveColorStopPosition(stop.position, gradientLineLength)?.toDouble(),
              stop.color != null,
          )
        }
    return GradientStops.resolve(inputs, epsilon = .00001f.toDouble()).map { stop ->
      val leftColor = colorStops[stop.leftColorIndex].color
      val rightColor = colorStops[stop.rightColorIndex].color
      val weighting = stop.weight.toFloat()
      val color =
          when {
            stop.leftColorIndex == stop.rightColorIndex -> leftColor
            leftColor == null || rightColor == null || !weighting.isFinite() -> null
            else -> ColorUtils.blendARGB(leftColor, rightColor, weighting)
          }
      ProcessedColorStop(color, stop.position.toFloat())
    }
  }

  private fun resolveColorStopPosition(
      position: LengthPercentage?,
      gradientLineLength: Float,
  ): Float? {
    if (position == null) {
      return null
    }

    return when (position.type) {
      LengthPercentageType.POINT ->
          PixelUtil.toPixelFromDIP(position.resolve(0f)) / gradientLineLength

      LengthPercentageType.PERCENT -> position.resolve(1f)
    }
  }
}
