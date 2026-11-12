/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.view.KeyEvent as AndroidKeyEvent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

internal abstract class KeyEvent(
    surfaceId: Int,
    viewTag: Int,
    keyEvent: AndroidKeyEvent,
) : Event<KeyEvent>(surfaceId, viewTag) {

  // Extract all needed data from keyEvent immediately to avoid storing the AndroidKeyEvent itself
  private val keyCode: Int = keyEvent.keyCode
  private val key: String = KeyValue.of(keyEvent)
  private val isAltPressed: Boolean = keyEvent.isAltPressed
  private val isCtrlPressed: Boolean = keyEvent.isCtrlPressed
  private val isMetaPressed: Boolean = keyEvent.isMetaPressed
  private val isShiftPressed: Boolean = keyEvent.isShiftPressed

  override fun canCoalesce(): Boolean = false

  override fun getEventCategory(): Int = EventCategoryDef.DISCRETE

  override fun getEventData(): WritableMap {
    val eventData = Arguments.createMap()

    eventData.putInt("target", viewTag)

    // W3C KeyboardEvent properties
    eventData.putString("key", key)
    eventData.putString("code", getCodeString())

    // Modifier keys
    eventData.putBoolean("altKey", isAltPressed)
    eventData.putBoolean("ctrlKey", isCtrlPressed)
    eventData.putBoolean("metaKey", isMetaPressed)
    eventData.putBoolean("shiftKey", isShiftPressed)

    // Additional properties
    eventData.putDouble("timestamp", timestampMs.toDouble())

    return eventData
  }

  private fun getCodeString(): String {
    return CODE_MAP[keyCode] ?: UNIDENTIFIED
  }

  internal companion object {
    private const val UNIDENTIFIED = "Unidentified"

    private val CODE_MAP: Map<Int, String> by
        lazy(LazyThreadSafetyMode.PUBLICATION) {
          mapOf(
              // Letter keys
              AndroidKeyEvent.KEYCODE_A to "KeyA",
              AndroidKeyEvent.KEYCODE_B to "KeyB",
              AndroidKeyEvent.KEYCODE_C to "KeyC",
              AndroidKeyEvent.KEYCODE_D to "KeyD",
              AndroidKeyEvent.KEYCODE_E to "KeyE",
              AndroidKeyEvent.KEYCODE_F to "KeyF",
              AndroidKeyEvent.KEYCODE_G to "KeyG",
              AndroidKeyEvent.KEYCODE_H to "KeyH",
              AndroidKeyEvent.KEYCODE_I to "KeyI",
              AndroidKeyEvent.KEYCODE_J to "KeyJ",
              AndroidKeyEvent.KEYCODE_K to "KeyK",
              AndroidKeyEvent.KEYCODE_L to "KeyL",
              AndroidKeyEvent.KEYCODE_M to "KeyM",
              AndroidKeyEvent.KEYCODE_N to "KeyN",
              AndroidKeyEvent.KEYCODE_O to "KeyO",
              AndroidKeyEvent.KEYCODE_P to "KeyP",
              AndroidKeyEvent.KEYCODE_Q to "KeyQ",
              AndroidKeyEvent.KEYCODE_R to "KeyR",
              AndroidKeyEvent.KEYCODE_S to "KeyS",
              AndroidKeyEvent.KEYCODE_T to "KeyT",
              AndroidKeyEvent.KEYCODE_U to "KeyU",
              AndroidKeyEvent.KEYCODE_V to "KeyV",
              AndroidKeyEvent.KEYCODE_W to "KeyW",
              AndroidKeyEvent.KEYCODE_X to "KeyX",
              AndroidKeyEvent.KEYCODE_Y to "KeyY",
              AndroidKeyEvent.KEYCODE_Z to "KeyZ",
              // Digit keys
              AndroidKeyEvent.KEYCODE_0 to "Digit0",
              AndroidKeyEvent.KEYCODE_1 to "Digit1",
              AndroidKeyEvent.KEYCODE_2 to "Digit2",
              AndroidKeyEvent.KEYCODE_3 to "Digit3",
              AndroidKeyEvent.KEYCODE_4 to "Digit4",
              AndroidKeyEvent.KEYCODE_5 to "Digit5",
              AndroidKeyEvent.KEYCODE_6 to "Digit6",
              AndroidKeyEvent.KEYCODE_7 to "Digit7",
              AndroidKeyEvent.KEYCODE_8 to "Digit8",
              AndroidKeyEvent.KEYCODE_9 to "Digit9",
              // Special keys
              AndroidKeyEvent.KEYCODE_ENTER to "Enter",
              AndroidKeyEvent.KEYCODE_SPACE to "Space",
              AndroidKeyEvent.KEYCODE_TAB to "Tab",
              AndroidKeyEvent.KEYCODE_DEL to "Backspace",
              AndroidKeyEvent.KEYCODE_ESCAPE to "Escape",
              // Modifier keys
              AndroidKeyEvent.KEYCODE_SHIFT_LEFT to "ShiftLeft",
              AndroidKeyEvent.KEYCODE_SHIFT_RIGHT to "ShiftRight",
              AndroidKeyEvent.KEYCODE_CTRL_LEFT to "ControlLeft",
              AndroidKeyEvent.KEYCODE_CTRL_RIGHT to "ControlRight",
              AndroidKeyEvent.KEYCODE_ALT_LEFT to "AltLeft",
              AndroidKeyEvent.KEYCODE_ALT_RIGHT to "AltRight",
              AndroidKeyEvent.KEYCODE_META_LEFT to "MetaLeft",
              AndroidKeyEvent.KEYCODE_META_RIGHT to "MetaRight",
              // Arrow keys
              AndroidKeyEvent.KEYCODE_DPAD_UP to "ArrowUp",
              AndroidKeyEvent.KEYCODE_DPAD_DOWN to "ArrowDown",
              AndroidKeyEvent.KEYCODE_DPAD_LEFT to "ArrowLeft",
              AndroidKeyEvent.KEYCODE_DPAD_RIGHT to "ArrowRight",
              AndroidKeyEvent.KEYCODE_DPAD_CENTER to "Enter",
          )
        }
  }
}
