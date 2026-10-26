/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.keyboardavoidingview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

@ReactModule(name = ReactKeyboardAvoidingViewManager.REACT_CLASS)
internal class ReactKeyboardAvoidingViewManager : ReactViewManager() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): ReactViewGroup =
      ReactKeyboardAvoidingView(context)

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
      (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()).apply {
        put(
            KeyboardInsetChangeEvent.EVENT_NAME,
            mapOf("registrationName" to "onKeyboardInsetChange"),
        )
      }

  @ReactProp(name = "enabled", defaultBoolean = true)
  fun setEnabled(view: ReactViewGroup, enabled: Boolean) {
    (view as ReactKeyboardAvoidingView).isAvoidanceEnabled = enabled
  }

  @ReactProp(name = "keyboardVerticalOffset", defaultFloat = 0f)
  fun setKeyboardVerticalOffset(view: ReactViewGroup, offset: Float) {
    (view as ReactKeyboardAvoidingView).keyboardVerticalOffset = offset
  }

  internal companion object {
    const val REACT_CLASS: String = "KeyboardAvoidingView"
  }
}
