/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.activityindicator

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.ActivityIndicatorViewManagerDelegate
import com.facebook.react.viewmanagers.ActivityIndicatorViewManagerInterface

/** Manages instances of [ReactActivityIndicatorView]. */
@ReactModule(name = ReactActivityIndicatorViewManager.REACT_CLASS)
internal class ReactActivityIndicatorViewManager :
    BaseViewManager<ReactActivityIndicatorView, LayoutShadowNode>(),
    ActivityIndicatorViewManagerInterface<ReactActivityIndicatorView> {

  private val delegate: ViewManagerDelegate<ReactActivityIndicatorView> =
      ActivityIndicatorViewManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): ReactActivityIndicatorView =
      ReactActivityIndicatorView(context)

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  override fun setColor(view: ReactActivityIndicatorView, value: Int?) {
    view.color = value
  }

  @ReactProp(name = PROP_ANIMATING, defaultBoolean = true)
  override fun setAnimating(view: ReactActivityIndicatorView, value: Boolean) {
    view.animating = value
  }

  // iOS only. On Android, the indicator always hides when it is not animating.
  override fun setHidesWhenStopped(view: ReactActivityIndicatorView, value: Boolean): Unit = Unit

  // The JS component sets the size with width and height styles.
  override fun setSize(view: ReactActivityIndicatorView, value: String?): Unit = Unit

  override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

  override fun getShadowNodeClass(): Class<LayoutShadowNode> = LayoutShadowNode::class.java

  override fun updateExtraData(root: ReactActivityIndicatorView, extraData: Any) {
    // do nothing
  }

  override fun onAfterUpdateTransaction(view: ReactActivityIndicatorView) {
    view.apply()
  }

  override fun getDelegate(): ViewManagerDelegate<ReactActivityIndicatorView> = delegate

  companion object {
    const val REACT_CLASS: String = "ActivityIndicatorView"

    private const val PROP_ANIMATING: String = "animating"
  }
}
