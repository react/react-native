/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.safeareaprovider

import android.graphics.Rect as AndroidRect
import android.view.View
import android.view.ViewGroup
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import kotlin.math.max
import kotlin.math.min

/** The safe area insets, in pixels, on each edge of a view. */
internal data class EdgeInsets(
    val top: Float,
    val right: Float,
    val bottom: Float,
    val left: Float,
)

/** The frame (position and size), in pixels, of a view within its provider. */
internal data class Rect(val x: Float, val y: Float, val width: Float, val height: Float)

private fun getRootWindowInsets(rootView: View): EdgeInsets? {
  val insets = ViewCompat.getRootWindowInsets(rootView) ?: return null
  // Intentionally excludes `ime()` so the soft keyboard never contributes to the
  // bottom inset, matching iOS behavior.
  val systemInsets =
      insets.getInsets(
          WindowInsetsCompat.Type.statusBars() or
              WindowInsetsCompat.Type.displayCutout() or
              WindowInsetsCompat.Type.navigationBars() or
              WindowInsetsCompat.Type.captionBar()
      )
  return EdgeInsets(
      top = systemInsets.top.toFloat(),
      right = systemInsets.right.toFloat(),
      bottom = systemInsets.bottom.toFloat(),
      left = systemInsets.left.toFloat(),
  )
}

/**
 * Computes the safe area insets that overlap [view], relative to its position in the window. This
 * makes nested providers/views subtract only the portion of the system insets that actually covers
 * the view.
 */
internal fun getSafeAreaInsets(view: View): EdgeInsets? {
  // The view has not been laid out yet.
  if (view.height == 0) {
    return null
  }
  val rootView = view.rootView
  val windowInsets = getRootWindowInsets(rootView) ?: return null

  val windowWidth = rootView.width.toFloat()
  val windowHeight = rootView.height.toFloat()
  val visibleRect = AndroidRect()
  view.getGlobalVisibleRect(visibleRect)

  return EdgeInsets(
      top = max(windowInsets.top - visibleRect.top, 0f),
      right = max(min(visibleRect.left + view.width - windowWidth, 0f) + windowInsets.right, 0f),
      bottom = max(min(visibleRect.top + view.height - windowHeight, 0f) + windowInsets.bottom, 0f),
      left = max(windowInsets.left - visibleRect.left, 0f),
  )
}

/** Computes the frame of [view] relative to [rootView]. */
internal fun getFrame(rootView: ViewGroup, view: View): Rect? {
  // This can happen while the view gets unmounted.
  if (view.parent == null) {
    return null
  }
  val offset = AndroidRect()
  view.getDrawingRect(offset)
  try {
    rootView.offsetDescendantRectToMyCoords(view, offset)
  } catch (ex: IllegalArgumentException) {
    // Thrown if the view is not a descendant of rootView. Should not happen, but
    // avoid crashing.
    return null
  }
  return Rect(
      x = offset.left.toFloat(),
      y = offset.top.toFloat(),
      width = view.width.toFloat(),
      height = view.height.toFloat(),
  )
}

internal fun edgeInsetsToJsMap(insets: EdgeInsets): WritableMap =
    Arguments.createMap().apply {
      putDouble("top", PixelUtil.toDIPFromPixel(insets.top).toDouble())
      putDouble("right", PixelUtil.toDIPFromPixel(insets.right).toDouble())
      putDouble("bottom", PixelUtil.toDIPFromPixel(insets.bottom).toDouble())
      putDouble("left", PixelUtil.toDIPFromPixel(insets.left).toDouble())
    }

internal fun rectToJsMap(rect: Rect): WritableMap =
    Arguments.createMap().apply {
      putDouble("x", PixelUtil.toDIPFromPixel(rect.x).toDouble())
      putDouble("y", PixelUtil.toDIPFromPixel(rect.y).toDouble())
      putDouble("width", PixelUtil.toDIPFromPixel(rect.width).toDouble())
      putDouble("height", PixelUtil.toDIPFromPixel(rect.height).toDouble())
    }
