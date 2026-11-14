/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.os.Build
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.FilterHelper

/**
 * Helper object for applying CSS backdrop-filter effects on Android.
 *
 * Applies filter effects to the composited backdrop (the pixels behind a view) captured as a
 * [Bitmap] snapshot. Color-matrix filters (brightness, contrast, grayscale, hue-rotate, invert,
 * opacity, saturate, sepia) work on all supported API levels. Blur and drop-shadow require API 31+
 * via [RenderEffect] drawn into the hardware-accelerated canvas via [RenderNode].
 */
@SuppressLint("UseRequiresApi")
internal object BackdropFilterHelper {

  /**
   * Draws a filtered region of [source] directly onto [canvas] at the child's position.
   *
   * @param canvas Hardware-accelerated canvas of the parent [ReactViewGroup].
   * @param source Full-size backdrop snapshot bitmap (same dimensions as the parent view).
   * @param destLeft Left coordinate of the child in parent space (canvas destination).
   * @param destTop Top coordinate of the child in parent space (canvas destination).
   * @param srcLeft Clamped left bound of the crop region within [source].
   * @param srcTop Clamped top bound of the crop region within [source].
   * @param srcRight Clamped right bound of the crop region within [source].
   * @param srcBottom Clamped bottom bound of the crop region within [source].
   * @param filters ReadableArray of filter descriptors as produced by processFilter.js.
   */
  fun drawFilteredBackdrop(
      canvas: Canvas,
      source: Bitmap,
      destLeft: Int,
      destTop: Int,
      srcLeft: Int,
      srcTop: Int,
      srcRight: Int,
      srcBottom: Int,
      filters: ReadableArray,
  ) {
    val cropWidth = srcRight - srcLeft
    val cropHeight = srcBottom - srcTop
    if (cropWidth <= 0 || cropHeight <= 0) return

    val cropped = Bitmap.createBitmap(source, srcLeft, srcTop, cropWidth, cropHeight)
    try {
      when {
        FilterHelper.isOnlyColorMatrixFilters(filters) -> {
          val paint = Paint(Paint.ANTI_ALIAS_FLAG)
          paint.colorFilter = FilterHelper.parseColorMatrixFilters(filters)
          canvas.drawBitmap(cropped, destLeft.toFloat(), destTop.toFloat(), paint)
        }
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
          drawWithRenderEffect(canvas, cropped, destLeft.toFloat(), destTop.toFloat(), filters)
        }
        else -> {
          // Pre-API 31: blur and drop-shadow are not supported; draw the backdrop unfiltered so
          // at least the element's transparency is composited correctly.
          canvas.drawBitmap(cropped, destLeft.toFloat(), destTop.toFloat(), null)
        }
      }
    } finally {
      cropped.recycle()
    }
  }

  @TargetApi(Build.VERSION_CODES.S)
  private fun drawWithRenderEffect(
      canvas: Canvas,
      source: Bitmap,
      destLeft: Float,
      destTop: Float,
      filters: ReadableArray,
  ) {
    val renderEffect: RenderEffect =
        FilterHelper.parseFilters(filters)
            ?: run {
              canvas.drawBitmap(source, destLeft, destTop, null)
              return
            }

    val renderNode = RenderNode("backdropFilter")
    renderNode.setPosition(0, 0, source.width, source.height)
    renderNode.setRenderEffect(renderEffect)

    val recordCanvas = renderNode.beginRecording()
    recordCanvas.drawBitmap(source, 0f, 0f, null)
    renderNode.endRecording()

    canvas.save()
    canvas.translate(destLeft, destTop)
    canvas.drawRenderNode(renderNode)
    canvas.restore()
  }
}
