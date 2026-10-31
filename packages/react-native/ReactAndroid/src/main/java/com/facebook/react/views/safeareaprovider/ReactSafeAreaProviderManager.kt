/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.safeareaprovider

import com.facebook.react.bridge.ReactContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.SafeAreaProviderManagerDelegate
import com.facebook.react.viewmanagers.SafeAreaProviderManagerInterface

/** View manager for [ReactSafeAreaProvider] components. */
@ReactModule(name = ReactSafeAreaProviderManager.REACT_CLASS)
internal class ReactSafeAreaProviderManager :
    ViewGroupManager<ReactSafeAreaProvider>(),
    SafeAreaProviderManagerInterface<ReactSafeAreaProvider> {

  private val delegate: ViewManagerDelegate<ReactSafeAreaProvider> =
      SafeAreaProviderManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<ReactSafeAreaProvider> = delegate

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): ReactSafeAreaProvider =
      ReactSafeAreaProvider(context)

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
      mutableMapOf(
          InsetsChangeEvent.EVENT_NAME to mutableMapOf("registrationName" to "onInsetsChange")
      )

  override fun addEventEmitters(reactContext: ThemedReactContext, view: ReactSafeAreaProvider) {
    super.addEventEmitters(reactContext, view)
    view.setOnInsetsChangeHandler(::dispatchInsetsChange)
  }

  private fun dispatchInsetsChange(
      view: ReactSafeAreaProvider,
      insets: EdgeInsets,
      frame: Rect,
  ) {
    val reactContext = view.context as ReactContext
    val reactTag = view.id
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
    UIManagerHelper.getEventDispatcherForReactTag(reactContext, reactTag)
        ?.dispatchEvent(InsetsChangeEvent(surfaceId, reactTag, insets, frame))
  }

  internal companion object {
    const val REACT_CLASS: String = "RCTSafeAreaProvider"
  }
}
