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

/** Event emitted by EditText native view when the text selection changes. */
internal class ReactTextInputSelectionEvent(
    surfaceId: Int,
    viewId: Int,
    private val selectionStart: Int,
    private val selectionEnd: Int,
) : Event<ReactTextInputSelectionEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  protected override fun getEventData(): WritableMap {
    val selectionData = buildReadableMap {
      put("start", selectionStart)
      put("end", selectionEnd)
    }

    return Arguments.createMap().apply { putMap("selection", selectionData) }
  }

  companion object {
    private const val EVENT_NAME = "topSelectionChange"
  }
}
