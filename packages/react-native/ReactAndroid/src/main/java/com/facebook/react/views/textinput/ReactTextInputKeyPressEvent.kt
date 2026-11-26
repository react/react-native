/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.view.KeyEvent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/** Event emitted by EditText native view when key pressed. */
internal class ReactTextInputKeyPressEvent(
    surfaceId: Int,
    viewId: Int,
    private val key: String,
    private val metaState: Int = 0,
) : Event<ReactTextInputKeyPressEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  protected override fun getEventData(): WritableMap {
    return Arguments.createMap().apply {
      putString("key", key)
      putBoolean("altKey", (metaState and KeyEvent.META_ALT_ON) != 0)
      putBoolean("ctrlKey", (metaState and KeyEvent.META_CTRL_ON) != 0)
      putBoolean("metaKey", (metaState and KeyEvent.META_META_ON) != 0)
      putBoolean("shiftKey", (metaState and KeyEvent.META_SHIFT_ON) != 0)
    }
  }

  // We don't want to miss any textinput event, as event data is incremental.
  override fun canCoalesce(): Boolean = false

  companion object {
    const val EVENT_NAME: String = "topKeyPress"
  }
}
