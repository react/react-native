/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.keyboardavoidingview

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal class KeyboardInsetChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val inset: Float,
    private val maxHeight: Float,
    private val settledInset: Float,
) : Event<KeyboardInsetChangeEvent>(surfaceId, viewTag) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
      Arguments.createMap().apply {
        putDouble("inset", inset.toDouble())
        putDouble("maxHeight", maxHeight.toDouble())
        putDouble("settledInset", settledInset.toDouble())
      }

  companion object {
    const val EVENT_NAME: String = "topKeyboardInsetChange"
  }
}
