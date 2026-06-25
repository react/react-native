/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import androidx.core.graphics.ColorUtils
import com.facebook.react.uimanager.FloatUtil
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import kotlin.math.ln

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
    val fixedColorStops = Array<ProcessedColorStop>(colorStops.size) { ProcessedColorStop() }
    var hasNullPositions = false
    var maxPositionSoFar =
        resolveColorStopPosition(colorStops[0].position, gradientLineLength) ?: 0f

    for (i in colorStops.indices) {
      val colorStop = colorStops[i]
      var newPosition = resolveColorStopPosition(colorStop.position, gradientLineLength)

      // Step 1:
      // If the first color stop does not have a position,
      // set its position to 0%. If the last color stop does not have a position,
      // set its position to 100%.
      newPosition =
          newPosition
              ?: when (i) {
                0 -> 0f
                colorStops.size - 1 -> 1f
                else -> null
              }

      // Step 2:
      // If a color stop or transition hint has a position
      // that is less than the specified position of any color stop or transition hint
      // before it in the list, set its position to be equal to the
      // largest specified position of any color stop or transition hint before it.
      if (newPosition != null) {
        newPosition = maxOf(newPosition, maxPositionSoFar)
        fixedColorStops[i] = ProcessedColorStop(colorStop.color, newPosition)
        maxPositionSoFar = newPosition
      } else {
        hasNullPositions = true
      }
    }

    // Step 3:
    // If any color stop still does not have a position,
    // then, for each run of adjacent color stops without positions,
    // set their positions so that they are evenly spaced between the preceding and
    // following color stops with positions.
    if (hasNullPositions) {
      var lastDefinedIndex = 0
      for (i in 1 until fixedColorStops.size) {
        val endPosition = fixedColorStops[i].position
        val startPosition = fixedColorStops[lastDefinedIndex].position
        val unpositionedStops = i - lastDefinedIndex - 1
        if (endPosition != null && startPosition != null && unpositionedStops > 0) {
          val increment = (endPosition - startPosition) / (unpositionedStops + 1)
          for (j in 1..unpositionedStops) {
            fixedColorStops[lastDefinedIndex + j] =
                ProcessedColorStop(
                    colorStops[lastDefinedIndex + j].color,
                    startPosition + increment * j,
                )
          }
          lastDefinedIndex = i
        }
      }
    }

    return processColorTransitionHints(fixedColorStops)
  }

  // Spec: https://drafts.csswg.org/css-images-4/#coloring-gradient-line (Refer transition hint
  // section)
  // Browsers add 9 intermediate color stops when a transition hint is present
  // Algorithm is referred from Blink engine
  // [source](https://github.com/chromium/chromium/blob/a296b1bad6dc1ed9d751b7528f7ca2134227b828/third_party/blink/renderer/core/css/css_gradient_value.cc#L240).
  private fun processColorTransitionHints(
      originalStops: Array<ProcessedColorStop>
  ): List<ProcessedColorStop> {
    val colorStops = originalStops.toMutableList()
    var indexOffset = 0

    for (i in 1 until originalStops.size - 1) {
      // Skip if not a color hint
      if (originalStops[i].color != null) {
        continue
      }

      val x = i + indexOffset
      if (x < 1) {
        continue
      }

      val offsetLeft = colorStops[x - 1].position
      val offsetRight = colorStops[x + 1].position
      val offset = colorStops[x].position
      if (offsetLeft == null || offsetRight == null || offset == null) {
        continue
      }
      val leftDist = offset - offsetLeft
      val rightDist = offsetRight - offset
      val totalDist = offsetRight - offsetLeft
      val leftColor = colorStops[x - 1].color
      val rightColor = colorStops[x + 1].color

      if (FloatUtil.floatsEqual(leftDist, rightDist)) {
        colorStops.removeAt(x)
        --indexOffset
        continue
      }

      if (FloatUtil.floatsEqual(leftDist, 0f)) {
        colorStops[x].color = rightColor
        continue
      }

      if (FloatUtil.floatsEqual(rightDist, 0f)) {
        colorStops[x].color = leftColor
        continue
      }

      val newStops = ArrayList<ProcessedColorStop>(9)

      // Position the new color stops
      if (leftDist > rightDist) {
        for (y in 0..6) {
          newStops.add(ProcessedColorStop(null, offsetLeft + leftDist * ((7f + y) / 13f)))
        }
        newStops.add(ProcessedColorStop(null, offset + rightDist * (1f / 3f)))
        newStops.add(ProcessedColorStop(null, offset + rightDist * (2f / 3f)))
      } else {
        newStops.add(ProcessedColorStop(null, offsetLeft + leftDist * (1f / 3f)))
        newStops.add(ProcessedColorStop(null, offsetLeft + leftDist * (2f / 3f)))
        for (y in 0..6) {
          newStops.add(ProcessedColorStop(null, offset + rightDist * (y / 13f)))
        }
      }

      // Calculate colors for the new stops
      val hintRelativeOffset = leftDist / totalDist
      val logRatio = ln(0.5) / ln(hintRelativeOffset)

      for (newStop in newStops) {
        if (newStop.position == null) {
          continue
        }
        val pointRelativeOffset = (newStop.position - offsetLeft) / totalDist
        val weighting = Math.pow(pointRelativeOffset.toDouble(), logRatio).toFloat()

        if (!weighting.isFinite() || weighting.isNaN()) {
          continue
        }

        // Interpolate color using the calculated weighting
        leftColor?.let { left ->
          rightColor?.let { right -> newStop.color = ColorUtils.blendARGB(left, right, weighting) }
        }
      }

      // Replace the color hint with new color stops
      colorStops.removeAt(x)
      colorStops.addAll(x, newStops)
      indexOffset += 8
    }

    return colorStops
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
