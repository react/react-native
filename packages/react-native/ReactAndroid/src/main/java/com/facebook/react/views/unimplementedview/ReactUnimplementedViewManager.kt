/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.unimplementedview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.UnimplementedNativeViewManagerDelegate
import com.facebook.react.viewmanagers.UnimplementedNativeViewManagerInterface

/**
 * ViewManager that renders [ReactUnimplementedView] to represent a component that is not properly
 * implemented or registered.
 */
@ReactModule(name = ReactUnimplementedViewManager.REACT_CLASS)
internal class ReactUnimplementedViewManager :
    ViewGroupManager<ReactUnimplementedView>(),
    UnimplementedNativeViewManagerInterface<ReactUnimplementedView> {

  private val delegate: ViewManagerDelegate<ReactUnimplementedView> =
      UnimplementedNativeViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<ReactUnimplementedView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): ReactUnimplementedView =
      ReactUnimplementedView(reactContext)

  override fun getName(): String = REACT_CLASS

  @ReactProp(name = "name")
  override fun setName(view: ReactUnimplementedView, value: String?): Unit =
      view.setName(value ?: "<null component name>")

  internal companion object {
    const val REACT_CLASS: String = "UnimplementedNativeView"
  }
}
