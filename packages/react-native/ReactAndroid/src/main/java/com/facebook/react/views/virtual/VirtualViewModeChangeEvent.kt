/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual

import android.graphics.Rect
import androidx.annotation.VisibleForTesting
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.events.Event

internal class VirtualViewModeChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val mode: VirtualViewMode,
    targetRect: Rect,
    thresholdRect: Rect,
    private val synchronous: Boolean,
) : Event<VirtualViewModeChangeEvent>(surfaceId, viewTag) {
  private val targetRectAsMap: ReadableMap = targetRect.toReadableMap()
  private val thresholdRectAsMap: ReadableMap = thresholdRect.toReadableMap()

  override fun getEventName(): String = "modeChange"

  @VisibleForTesting
  override fun getEventData(): WritableMap {
    return Arguments.createMap().apply {
      putInt("mode", mode.value)
      putMap("targetRect", targetRectAsMap)
      putMap("thresholdRect", thresholdRectAsMap)
    }
  }

  override fun experimental_isSynchronous(): Boolean = synchronous
}

private fun Rect.toReadableMap(): ReadableMap =
    Arguments.createMap().apply {
      putDouble("x", left.toFloat().pxToDp().toDouble())
      putDouble("y", top.toFloat().pxToDp().toDouble())
      putDouble("width", width().toFloat().pxToDp().toDouble())
      putDouble("height", height().toFloat().pxToDp().toDouble())
    }
