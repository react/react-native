/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/** Event emitted by EditText native view when the user submits the text. */
internal class ReactTextInputSubmitEditingEvent(
    surfaceId: Int,
    viewId: Int,
    private val text: String,
) : Event<ReactTextInputSubmitEditingEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  protected override fun getEventData(): WritableMap {
    return Arguments.createMap().apply {
      putInt("target", viewTag)
      putString("text", text)
    }
  }

  override fun canCoalesce(): Boolean = false

  companion object {
    private const val EVENT_NAME = "topSubmitEditing"
  }
}
