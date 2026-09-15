/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.scroll.ScrollEvent.Companion.obtain
import com.facebook.react.views.scroll.ScrollEventType

internal class ReactTextScrollWatcher(private val editText: ReactEditText) : ScrollWatcher {
  private val eventDispatcher: EventDispatcher?
  private val surfaceId: Int
  private var previousHorizontal = 0
  private var previousVert = 0

  init {
    val reactContext = UIManagerHelper.getReactContext(editText)
    eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext)
    surfaceId = UIManagerHelper.getSurfaceId(reactContext)
  }

  override fun onScrollChanged(horiz: Int, vert: Int, oldHoriz: Int, oldVert: Int) {
    if (previousHorizontal != horiz || previousVert != vert) {
      val event =
          obtain(
              surfaceId,
              editText.id,
              ScrollEventType.SCROLL,
              horiz.toFloat(),
              vert.toFloat(),
              0f, // can't get x velocity
              0f, // can't get y velocity
              0, // can't get content width
              0, // can't get content height
              editText.width,
              editText.height,
          )

      eventDispatcher?.dispatchEvent(event)

      previousHorizontal = horiz
      previousVert = vert
    }
  }
}
