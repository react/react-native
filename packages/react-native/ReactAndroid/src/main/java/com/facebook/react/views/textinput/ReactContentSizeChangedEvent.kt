/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.buildReadableMap
import com.facebook.react.uimanager.events.Event

/** Event emitted by EditText native view when content size changes. */
internal class ReactContentSizeChangedEvent(
    surfaceId: Int,
    viewId: Int,
    private val contentWidth: Float,
    private val contentHeight: Float,
) : Event<ReactTextChangedEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  protected override fun getEventData(): WritableMap {
    val contentSize = buildReadableMap {
      put("width", contentWidth.toDouble())
      put("height", contentHeight.toDouble())
    }

    return Arguments.createMap().apply {
      putMap("contentSize", contentSize)
      putInt("target", viewTag)
    }
  }

  companion object {
    const val EVENT_NAME: String = "topContentSizeChange"
  }
}
