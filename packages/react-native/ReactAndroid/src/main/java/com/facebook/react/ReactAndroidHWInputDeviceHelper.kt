/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.view.KeyEvent
import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap

/** Responsible for dispatching events specific for hardware inputs. */
internal class ReactAndroidHWInputDeviceHelper {
  /**
   * We keep a reference to the last focused view id so that we can send it as a target for key
   * events and be able to send a blur event when focus changes.
   */
  private var lastFocusedViewId = View.NO_ID

  /** Called from [ReactRootView]. This is the main place the key events are handled. */
  fun handleKeyEvent(ev: KeyEvent, context: ReactContext) {
    val eventKeyCode = ev.keyCode
    val eventKeyAction = ev.action
    if (
        (eventKeyAction == KeyEvent.ACTION_UP || eventKeyAction == KeyEvent.ACTION_DOWN) &&
            KEY_EVENTS_ACTIONS.containsKey(eventKeyCode)
    ) {
      dispatchEvent(context, KEY_EVENTS_ACTIONS[eventKeyCode], lastFocusedViewId, eventKeyAction)
    }
  }

  /** Called from [ReactRootView] when focused view changes. */
  fun onFocusChanged(newFocusedView: View, context: ReactContext) {
    if (lastFocusedViewId == newFocusedView.id) {
      return
    }
    if (lastFocusedViewId != View.NO_ID) {
      dispatchEvent(context, "blur", lastFocusedViewId)
    }
    lastFocusedViewId = newFocusedView.id
    dispatchEvent(context, "focus", newFocusedView.id)
  }

  /** Called from [ReactRootView] when the whole view hierarchy looses focus. */
  fun clearFocus(context: ReactContext) {
    if (lastFocusedViewId != View.NO_ID) {
      dispatchEvent(context, "blur", lastFocusedViewId)
    }
    lastFocusedViewId = View.NO_ID
  }

  private fun dispatchEvent(
      context: ReactContext,
      eventType: String?,
      targetViewId: Int,
      eventKeyAction: Int = -1,
  ) {
    val event: WritableMap =
        WritableNativeMap().apply {
          putString("eventType", eventType)
          putInt("eventKeyAction", eventKeyAction)
          if (targetViewId != View.NO_ID) {
            putInt("tag", targetViewId)
          }
        }
    context.emitDeviceEvent("onHWKeyEvent", event)
  }

  private companion object {
    /**
     * Contains a mapping between handled KeyEvents and the corresponding navigation event that
     * should be fired when the KeyEvent is received.
     */
    private val KEY_EVENTS_ACTIONS: Map<Int, String> =
        mapOf(
            KeyEvent.KEYCODE_DPAD_CENTER to "select",
            KeyEvent.KEYCODE_ENTER to "select",
            KeyEvent.KEYCODE_SPACE to "select",
            KeyEvent.KEYCODE_MEDIA_PLAY to "play",
            KeyEvent.KEYCODE_MEDIA_PAUSE to "pause",
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE to "playPause",
            KeyEvent.KEYCODE_MEDIA_REWIND to "rewind",
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD to "fastForward",
            KeyEvent.KEYCODE_MEDIA_STOP to "stop",
            KeyEvent.KEYCODE_MEDIA_NEXT to "next",
            KeyEvent.KEYCODE_MEDIA_PREVIOUS to "previous",
            KeyEvent.KEYCODE_DPAD_UP to "up",
            KeyEvent.KEYCODE_DPAD_RIGHT to "right",
            KeyEvent.KEYCODE_DPAD_DOWN to "down",
            KeyEvent.KEYCODE_DPAD_LEFT to "left",
            KeyEvent.KEYCODE_INFO to "info",
            KeyEvent.KEYCODE_MENU to "menu",
            KeyEvent.KEYCODE_CHANNEL_UP to "channelUp",
            KeyEvent.KEYCODE_CHANNEL_DOWN to "channelDown",
        )
  }
}
