/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shared

import kotlin.math.abs

/** Why a fling selected an offset; platforms retain their own velocity adjustments. */
public enum class ScrollSnapDirection {
  NONE,
  FORWARD,
  BACKWARD,
}

/** The bounded target and the original snap point used by native fling physics. */
public class ScrollSnapResult
internal constructor(
    public val targetOffset: Double,
    public val selectedOffset: Double,
    public val direction: ScrollSnapDirection,
)

/**
 * Selects explicit scroll snap offsets in platform-resolved coordinates.
 *
 * The DoubleArray constructor copies its input for an Apple property snapshot. Android uses
 * [fromIntegerOffsets] to retain its existing native list and 32-bit pixel arithmetic. Inputs are
 * never sorted: the first and last elements define free-scrolling boundaries. Callers retain
 * density conversion, RTL coordinates, target prediction and interval snapping.
 */
public class ScrollSnapOffsets
private constructor(
    private val fractionalOffsets: DoubleArray?,
    private val integerOffsets: List<Int>?,
) {
  public constructor(offsets: DoubleArray) : this(offsets.copyOf(), null)

  public companion object {
    /**
     * Retains the caller's list so native mutations remain visible on the next fling. The list must
     * be nonempty when resolving; platforms keep their existing empty-list fallback policy.
     */
    public fun fromIntegerOffsets(offsets: List<Int>): ScrollSnapOffsets =
        ScrollSnapOffsets(null, offsets)
  }

  private fun offsetAt(index: Int): Double =
      if (integerOffsets != null) integerOffsets[index].toDouble()
      else checkNotNull(fractionalOffsets)[index]

  private fun distance(left: Double, right: Double): Double =
      if (integerOffsets != null) (left.toInt() - right.toInt()).toDouble() else left - right

  /**
   * Coordinates must be finite and [maximumOffset] nonnegative. An empty DoubleArray leaves the
   * predicted target unchanged apart from bounding it. A midpoint tie selects the larger offset.
   * [ScrollSnapResult.selectedOffset] precedes bounding for Android's native velocity adjustment.
   */
  public fun resolve(
      currentOffset: Double,
      targetOffset: Double,
      maximumOffset: Double,
      velocity: Double,
      snapToStart: Boolean,
      snapToEnd: Boolean,
  ): ScrollSnapResult {
    val count = integerOffsets?.size ?: checkNotNull(fractionalOffsets).size
    if (integerOffsets == null && count == 0) {
      return ScrollSnapResult(
          targetOffset.coerceIn(0.0, maximumOffset),
          targetOffset,
          ScrollSnapDirection.NONE,
      )
    }
    val firstOffset = offsetAt(0)
    val lastOffset = offsetAt(count - 1)
    var smallerOffset = 0.0
    var largerOffset = maximumOffset
    for (i in 0 until count) {
      val offset = offsetAt(i)
      if (
          offset <= targetOffset &&
              distance(targetOffset, offset) < distance(targetOffset, smallerOffset)
      ) {
        smallerOffset = offset
      }
      if (
          offset >= targetOffset &&
              distance(offset, targetOffset) < distance(largerOffset, targetOffset)
      ) {
        largerOffset = offset
      }
    }

    var selectedOffset = targetOffset
    var direction = ScrollSnapDirection.NONE
    if (!snapToEnd && targetOffset >= lastOffset) {
      if (currentOffset < lastOffset) {
        selectedOffset = lastOffset
      }
    } else if (!snapToStart && targetOffset <= firstOffset) {
      if (currentOffset > firstOffset) {
        selectedOffset = firstOffset
      }
    } else if (velocity > 0) {
      selectedOffset = largerOffset
      direction = ScrollSnapDirection.FORWARD
    } else if (velocity < 0) {
      selectedOffset = smallerOffset
      direction = ScrollSnapDirection.BACKWARD
    } else {
      val preferSmaller =
          if (integerOffsets != null) {
            abs(targetOffset.toInt() - smallerOffset.toInt()) <
                abs(largerOffset.toInt() - targetOffset.toInt())
          } else {
            targetOffset - smallerOffset < largerOffset - targetOffset
          }
      selectedOffset = if (preferSmaller) smallerOffset else largerOffset
    }
    return ScrollSnapResult(
        targetOffset = selectedOffset.coerceIn(0.0, maximumOffset),
        selectedOffset = selectedOffset,
        direction = direction,
    )
  }
}
