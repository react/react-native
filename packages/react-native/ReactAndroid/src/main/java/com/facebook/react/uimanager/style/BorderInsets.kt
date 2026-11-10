/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.RectF
import android.util.LayoutDirection

/**
 * Represents the insets from border box to padding box (i.e., border widths).
 *
 * This class stores border widths using logical edge properties and resolves them to physical edges
 * based on layout direction. It supports all logical edges defined in [LogicalEdge].
 *
 * @see LogicalEdge
 */
internal class BorderInsets {
  private val edgeInsets = arrayOfNulls<Float?>(LogicalEdge.values().size)

  /**
   * Sets the border width for a specific logical edge.
   *
   * @param edge The logical edge to set
   * @param width The border width in pixels, or null or NaN to clear
   */
  fun setBorderWidth(edge: LogicalEdge, width: Float?) {
    edgeInsets[edge.ordinal] = width?.takeUnless { it.isNaN() }
  }

  /**
   * Resolves logical edge insets to physical edge insets based on layout direction.
   *
   * This method handles LTR/RTL layout direction to correctly map logical properties to physical
   * edges.
   *
   * @param layoutDirection The resolved layout direction (LTR or RTL)
   * @return RectF with left, top, right, bottom insets
   * @throws IllegalArgumentException if layoutDirection is not LTR or RTL
   */
  fun resolve(
      layoutDirection: Int,
  ): RectF {
    return when (layoutDirection) {
      LayoutDirection.LTR ->
          RectF(
              edgeInsets[LogicalEdge.START.ordinal]
                  ?: edgeInsets[LogicalEdge.LEFT.ordinal]
                  ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.BLOCK_START.ordinal]
                  ?: edgeInsets[LogicalEdge.TOP.ordinal]
                  ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                  ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.END.ordinal]
                  ?: edgeInsets[LogicalEdge.RIGHT.ordinal]
                  ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.BLOCK_END.ordinal]
                  ?: edgeInsets[LogicalEdge.BOTTOM.ordinal]
                  ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                  ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
          )
      LayoutDirection.RTL ->
          RectF(
              edgeInsets[LogicalEdge.END.ordinal]
                  ?: edgeInsets[LogicalEdge.LEFT.ordinal]
                  ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.BLOCK_START.ordinal]
                  ?: edgeInsets[LogicalEdge.TOP.ordinal]
                  ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                  ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.START.ordinal]
                  ?: edgeInsets[LogicalEdge.RIGHT.ordinal]
                  ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.BLOCK_END.ordinal]
                  ?: edgeInsets[LogicalEdge.BOTTOM.ordinal]
                  ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                  ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
          )
      else -> throw IllegalArgumentException("Expected resolved layout direction")
    }
  }
}
