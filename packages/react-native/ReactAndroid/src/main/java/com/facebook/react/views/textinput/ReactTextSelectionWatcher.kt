/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import kotlin.math.max
import kotlin.math.min

internal class ReactTextSelectionWatcher(private val editText: ReactEditText) : SelectionWatcher {
  private val eventDispatcher: EventDispatcher?
  private val surfaceId: Int
  private var previousSelectionStart = 0
  private var previousSelectionEnd = 0

  init {
    val reactContext = UIManagerHelper.getReactContext(editText)
    eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext)
    surfaceId = UIManagerHelper.getSurfaceId(reactContext)
  }

  override fun onSelectionChanged(start: Int, end: Int) {
    // Android will call us back for both the SELECTION_START span and SELECTION_END span in text
    // To prevent double calling back into js we cache the result of the previous call and only
    // forward it on if we have new values

    // Apparently Android might call this with an end value that is less than the start value
    // Lets normalize them. See https://github.com/facebook/react-native/issues/18579
    val realStart = min(start.toDouble(), end.toDouble()).toInt()
    val realEnd = max(start.toDouble(), end.toDouble()).toInt()

    if (previousSelectionStart != realStart || previousSelectionEnd != realEnd) {
      eventDispatcher?.dispatchEvent(
          ReactTextInputSelectionEvent(surfaceId, editText.id, realStart, realEnd)
      )

      previousSelectionStart = realStart
      previousSelectionEnd = realEnd
    }
  }
}
