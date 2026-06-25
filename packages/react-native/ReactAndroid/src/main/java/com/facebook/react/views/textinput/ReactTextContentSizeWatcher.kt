/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher

internal class ReactTextContentSizeWatcher(private val editText: ReactEditText) :
    ContentSizeWatcher {
  private val eventDispatcher: EventDispatcher?
  private val surfaceId: Int
  private var previousContentWidth = 0
  private var previousContentHeight = 0

  init {
    val reactContext = UIManagerHelper.getReactContext(editText)
    eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext)
    surfaceId = UIManagerHelper.getSurfaceId(reactContext)
  }

  override fun onLayout() {
    var contentWidth = editText.width
    var contentHeight = editText.height

    // Use instead size of text content within EditText when available
    if (editText.layout != null) {
      contentWidth =
          (editText.compoundPaddingLeft + editText.layout.width + editText.compoundPaddingRight)
      contentHeight =
          (editText.compoundPaddingTop + editText.layout.height + editText.compoundPaddingBottom)
    }

    if (contentWidth != previousContentWidth || contentHeight != previousContentHeight) {
      previousContentHeight = contentHeight
      previousContentWidth = contentWidth

      eventDispatcher?.dispatchEvent(
          ReactContentSizeChangedEvent(
              surfaceId,
              editText.id,
              toDIPFromPixel(contentWidth.toFloat()),
              toDIPFromPixel(contentHeight.toFloat()),
          )
      )
    }
  }
}
