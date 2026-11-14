/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.keyboardavoidingview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

/** View manager for [ReactKeyboardAvoidingView] components. */
@ReactModule(name = ReactKeyboardAvoidingViewManager.REACT_CLASS)
internal class ReactKeyboardAvoidingViewManager : ReactViewManager() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): ReactViewGroup =
      ReactKeyboardAvoidingView(context)

  override fun updateState(
      view: ReactViewGroup,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper,
  ): Any? {
    (view as ReactKeyboardAvoidingView).stateWrapper = stateWrapper
    return null
  }

  @ReactProp(name = "behavior")
  fun setBehavior(view: ReactViewGroup, behavior: String?) {
    (view as ReactKeyboardAvoidingView).behavior =
        when (behavior) {
          "height" -> ReactKeyboardAvoidingView.Behavior.HEIGHT
          "padding" -> ReactKeyboardAvoidingView.Behavior.PADDING
          "position" -> ReactKeyboardAvoidingView.Behavior.POSITION
          else -> ReactKeyboardAvoidingView.Behavior.NONE
        }
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
