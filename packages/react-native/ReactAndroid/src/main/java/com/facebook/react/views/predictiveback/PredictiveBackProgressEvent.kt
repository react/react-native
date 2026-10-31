/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.predictiveback

import com.facebook.react.PredictiveBackEvent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal class PredictiveBackProgressEvent(
    surfaceId: Int,
    viewId: Int,
    private val progress: Float,
    private val swipeEdge: Int,
    private val touchX: Float,
    private val touchY: Float,
    private val phase: Int,
) : Event<PredictiveBackProgressEvent>(surfaceId, viewId) {

  constructor(
      surfaceId: Int,
      viewId: Int,
      event: PredictiveBackEvent,
      phase: Int,
  ) : this(surfaceId, viewId, event.progress, event.swipeEdge, event.touchX, event.touchY, phase)

  override fun getEventName(): String = EVENT_NAME

  override fun canCoalesce(): Boolean = phase == PredictiveBackEvent.PHASE_PROGRESS

  override fun getEventData(): WritableMap =
      Arguments.createMap().apply {
        putDouble("progress", progress.toDouble())
        putInt("swipeEdge", swipeEdge)
        putDouble("touchX", touchX.toDouble())
        putDouble("touchY", touchY.toDouble())
        putInt("phase", phase)
      }

  companion object {
    const val EVENT_NAME: String = "topProgress"
  }
}
