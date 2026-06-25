/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.uimanager.Spacing
import java.lang.IllegalArgumentException

/**
 * Enum representing all possible box edges using both physical and logical naming conventions.
 *
 * This enum includes physical edges (LEFT, RIGHT, TOP, BOTTOM), logical edges that adapt to writing
 * direction (START, END, BLOCK_START, BLOCK_END), and shorthand values (ALL, HORIZONTAL, VERTICAL,
 * BLOCK). Each value can be converted to a [Spacing] type for layout calculations.
 *
 * @see Spacing
 */
public enum class LogicalEdge {
  /** Shorthand for all four edges. */
  ALL {
    override fun toSpacingType(): Int = Spacing.ALL
  },
  /** The physical left edge. */
  LEFT {
    override fun toSpacingType(): Int = Spacing.LEFT
  },
  /** The physical right edge. */
  RIGHT {
    override fun toSpacingType(): Int = Spacing.RIGHT
  },
  /** The physical top edge. */
  TOP {
    override fun toSpacingType(): Int = Spacing.TOP
  },
  /** The physical bottom edge. */
  BOTTOM {
    override fun toSpacingType(): Int = Spacing.BOTTOM
  },
  /** The logical start edge (left in LTR, right in RTL). */
  START {
    override fun toSpacingType(): Int = Spacing.START
  },
  /** The logical end edge (right in LTR, left in RTL). */
  END {
    override fun toSpacingType(): Int = Spacing.END
  },
  /** Shorthand for left and right edges. */
  HORIZONTAL {
    override fun toSpacingType(): Int = Spacing.HORIZONTAL
  },
  /** Shorthand for top and bottom edges. */
  VERTICAL {
    override fun toSpacingType(): Int = Spacing.VERTICAL
  },
  /** The logical block-start edge (typically top in horizontal writing modes). */
  BLOCK_START {
    override fun toSpacingType(): Int = Spacing.BLOCK_START
  },
  /** The logical block-end edge (typically bottom in horizontal writing modes). */
  BLOCK_END {
    override fun toSpacingType(): Int = Spacing.BLOCK_END
  },
  /** Shorthand for block-start and block-end edges. */
  BLOCK {
    override fun toSpacingType(): Int = Spacing.BLOCK
  };

  // TODO: not supported by Spacing users
  // INLINE_START,
  // INLINE_END,
  // INLINE;

  /**
   * Converts this logical edge to the corresponding Spacing type constant.
   *
   * @return The Spacing constant for this edge
   */
  public abstract fun toSpacingType(): Int

  public companion object {
    /**
     * Converts a Spacing type constant to the corresponding LogicalEdge.
     *
     * @param spacingType The Spacing constant
     * @return The corresponding LogicalEdge
     * @throws IllegalArgumentException if the spacing type is not recognized
     */
    @JvmStatic
    public fun fromSpacingType(spacingType: Int): LogicalEdge {
      return when (spacingType) {
        Spacing.ALL -> ALL
        Spacing.LEFT -> LEFT
        Spacing.RIGHT -> RIGHT
        Spacing.TOP -> TOP
        Spacing.BOTTOM -> BOTTOM
        Spacing.START -> START
        Spacing.END -> END
        Spacing.HORIZONTAL -> HORIZONTAL
        Spacing.VERTICAL -> VERTICAL
        Spacing.BLOCK_START -> BLOCK_START
        Spacing.BLOCK_END -> BLOCK_END
        Spacing.BLOCK -> BLOCK
        else -> throw IllegalArgumentException("Unknown spacing type: $spacingType")
      }
    }
  }
}
