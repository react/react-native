/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.KeyEvent as AndroidKeyEvent
import android.view.View
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.KeyDownEvent
import com.facebook.react.uimanager.events.KeyUpEvent

/**
 * JSKeyDispatcher handles dispatching keyboard events to JS from RootViews. It sends keydown and
 * keyup events according to the W3C KeyboardEvent specification, supporting both capture and bubble
 * phases.
 *
 * The keydown and keyup events provide a code indicating which key is pressed. The event target is
 * derived from the currently focused Android view.
 */
internal class JSKeyDispatcher {
  private var focusedViewTag: Int = View.NO_ID

  fun handleKeyEvent(
      keyEvent: AndroidKeyEvent,
      eventDispatcher: EventDispatcher,
      surfaceId: Int,
  ) {
    if (focusedViewTag == View.NO_ID) {
      return
    }

    when (keyEvent.action) {
      AndroidKeyEvent.ACTION_DOWN -> {
        eventDispatcher.dispatchEvent(
            KeyDownEvent(
                surfaceId,
                focusedViewTag,
                keyEvent,
            ),
        )
      }
      AndroidKeyEvent.ACTION_UP -> {
        eventDispatcher.dispatchEvent(
            KeyUpEvent(
                surfaceId,
                focusedViewTag,
                keyEvent,
            ),
        )
      }
    }
  }

  fun setFocusedView(viewTag: Int) {
    focusedViewTag = viewTag
  }

  fun clearFocus() {
    focusedViewTag = View.NO_ID
  }
}
