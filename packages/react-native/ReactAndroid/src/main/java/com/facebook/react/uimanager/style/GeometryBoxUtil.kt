/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.RectF
import android.view.View
import com.facebook.react.uimanager.PixelUtil.dpToPx

private inline val RectF?.leftOrZero: Float
  get() = this?.left ?: 0f

private inline val RectF?.topOrZero: Float
  get() = this?.top ?: 0f

private inline val RectF?.rightOrZero: Float
  get() = this?.right ?: 0f

private inline val RectF?.bottomOrZero: Float
  get() = this?.bottom ?: 0f

internal object GeometryBoxUtil {
  @JvmStatic
  fun adjustBorderRadiusForGeometryBox(
    view: View,
    geometryBox: GeometryBox?,
    borderRadius: ComputedBorderRadius?,
    marginInsets: RectF?,
    paddingInsets: RectF?,
    borderInsets: RectF?
  ): ComputedBorderRadius? {
    if (borderRadius == null) {
      return null
    }

    return when (geometryBox) {
      GeometryBox.MarginBox -> {
        // Margin-box: extend border-radius by margin
        ComputedBorderRadius(
          topLeft = CornerRadii(
            horizontal = borderRadius.topLeft.horizontal + marginInsets.leftOrZero,
            vertical = borderRadius.topLeft.vertical + marginInsets.topOrZero
          ),
          topRight = CornerRadii(
            horizontal = borderRadius.topRight.horizontal + marginInsets.rightOrZero,
            vertical = borderRadius.topRight.vertical + marginInsets.topOrZero
          ),
          bottomLeft = CornerRadii(
            horizontal = borderRadius.bottomLeft.horizontal + marginInsets.leftOrZero,
            vertical = borderRadius.bottomLeft.vertical + marginInsets.bottomOrZero
          ),
          bottomRight = CornerRadii(
            horizontal = borderRadius.bottomRight.horizontal + marginInsets.rightOrZero,
            vertical = borderRadius.bottomRight.vertical + marginInsets.bottomOrZero
          )
        )
      }

      GeometryBox.PaddingBox -> {
        // Padding-box: reduce border-radius by border width
        ComputedBorderRadius(
          topLeft = CornerRadii(
            horizontal = (borderRadius.topLeft.horizontal - borderInsets.leftOrZero).coerceAtLeast(
              0f
            ),
            vertical = (borderRadius.topLeft.vertical - borderInsets.topOrZero.coerceAtLeast(0f))
          ),
          topRight = CornerRadii(
            horizontal = (borderRadius.topRight.horizontal - borderInsets.rightOrZero).coerceAtLeast(
              0f
            ),
            vertical = (borderRadius.topRight.vertical - borderInsets.topOrZero.coerceAtLeast(0f))
          ),
          bottomLeft = CornerRadii(
            horizontal = (borderRadius.bottomLeft.horizontal - borderInsets.leftOrZero).coerceAtLeast(
              0f
            ),
            vertical = (borderRadius.bottomLeft.vertical - borderInsets.bottomOrZero.coerceAtLeast(
              0f
            ))
          ),
          bottomRight = CornerRadii(
            horizontal = (borderRadius.bottomRight.horizontal - borderInsets.rightOrZero).coerceAtLeast(
              0f
            ),
            vertical = (borderRadius.bottomRight.vertical - borderInsets.bottomOrZero.coerceAtLeast(
              0f
            ))
          )
        )
      }

      GeometryBox.ContentBox -> {
        // Content-box: reduce border-radius by border width and padding
        ComputedBorderRadius(
          topLeft = CornerRadii(
            horizontal = (borderRadius.topLeft.horizontal - paddingInsets.leftOrZero - borderInsets.leftOrZero).coerceAtLeast(
              0f
            ),
            vertical = (borderRadius.topLeft.vertical - paddingInsets.topOrZero - borderInsets.topOrZero.coerceAtLeast(
              0f
            ))
          ),
          topRight = CornerRadii(
            horizontal = (borderRadius.topRight.horizontal - paddingInsets.rightOrZero - borderInsets.rightOrZero).coerceAtLeast(
              0f
            ),
            vertical = (borderRadius.topRight.vertical - paddingInsets.topOrZero - borderInsets.topOrZero.coerceAtLeast(
              0f
            ))
          ),
          bottomLeft = CornerRadii(
            horizontal = (borderRadius.bottomLeft.horizontal - paddingInsets.leftOrZero - borderInsets.leftOrZero).coerceAtLeast(
              0f
            ),
            vertical = (borderRadius.bottomLeft.vertical - paddingInsets.bottomOrZero - borderInsets.bottomOrZero.coerceAtLeast(
              0f
            ))
          ),
          bottomRight = CornerRadii(
            horizontal = (borderRadius.bottomRight.horizontal - paddingInsets.rightOrZero - borderInsets.rightOrZero).coerceAtLeast(
              0f
            ),
            vertical = (borderRadius.bottomRight.vertical - paddingInsets.bottomOrZero - borderInsets.bottomOrZero.coerceAtLeast(
              0f
            ))
          )
        )
      }

      else -> borderRadius // BorderBox, StrokeBox, ViewBox, FillBox - use border-box as fallback
    }
  }

  @JvmStatic
  fun getGeometryBoxBounds(
    view: View,
    geometryBox: GeometryBox?,
    marginInsets: RectF?,
    paddingInsets: RectF?,
    borderInsets: RectF?
  )
    : RectF {
    val bounds = RectF(0f, 0f, view.width.toFloat(), view.height.toFloat())
    return when (geometryBox) {
      GeometryBox.MarginBox -> {
        // MarginBox = BorderBox + margin
        RectF(
          bounds.left - marginInsets.leftOrZero.dpToPx(),
          bounds.top - marginInsets.topOrZero.dpToPx(),
          bounds.right + marginInsets.rightOrZero.dpToPx(),
          bounds.bottom + marginInsets.bottomOrZero.dpToPx()
        )
      }

      GeometryBox.PaddingBox -> {
        // PaddingBox = BorderBox - border
        RectF(
          bounds.left + borderInsets.leftOrZero.dpToPx(),
          bounds.top + borderInsets.topOrZero.dpToPx(),
          bounds.right - borderInsets.rightOrZero.dpToPx(),
          bounds.bottom - borderInsets.bottomOrZero.dpToPx()
        )
      }

      GeometryBox.ContentBox -> {
        // ContentBox = BorderBox + padding
        RectF(
          bounds.left + (borderInsets.leftOrZero + paddingInsets.leftOrZero).dpToPx(),
          bounds.top + (borderInsets.topOrZero + paddingInsets.topOrZero).dpToPx(),
          bounds.right - (borderInsets.rightOrZero + paddingInsets.rightOrZero).dpToPx(),
          bounds.bottom - (borderInsets.bottomOrZero + paddingInsets.bottomOrZero).dpToPx()
        )
      }

      else -> bounds // BorderBox, StrokeBox, ViewBox - use border-box as fallback
    }
  }
}
