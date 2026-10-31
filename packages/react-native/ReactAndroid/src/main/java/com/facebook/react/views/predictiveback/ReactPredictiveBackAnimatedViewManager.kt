/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.predictiveback

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.PredictiveBackAnimatedViewManagerDelegate
import com.facebook.react.viewmanagers.PredictiveBackAnimatedViewManagerInterface

@ReactModule(name = ReactPredictiveBackAnimatedViewManager.REACT_CLASS)
internal class ReactPredictiveBackAnimatedViewManager :
    SimpleViewManager<ReactPredictiveBackAnimatedView>(),
    PredictiveBackAnimatedViewManagerInterface<ReactPredictiveBackAnimatedView> {

  private val delegate: ViewManagerDelegate<ReactPredictiveBackAnimatedView> =
      PredictiveBackAnimatedViewManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun getDelegate(): ViewManagerDelegate<ReactPredictiveBackAnimatedView> = delegate

  override fun createViewInstance(context: ThemedReactContext): ReactPredictiveBackAnimatedView =
      ReactPredictiveBackAnimatedView(context)

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
    val eventTypeConstants = super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()
    return eventTypeConstants.apply {
      put(PredictiveBackProgressEvent.EVENT_NAME, mapOf("registrationName" to "onProgress"))
    }
  }

  internal companion object {
    const val REACT_CLASS: String = "PredictiveBackAnimatedView"
  }
}
