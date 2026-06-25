/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal

import android.content.DialogInterface.OnShowListener
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.ModalHostViewManagerDelegate
import com.facebook.react.viewmanagers.ModalHostViewManagerInterface
import com.facebook.react.views.modal.ReactModalHostView.OnRequestCloseListener

/** View manager for [ReactModalHostView] components. */
@ReactModule(name = ReactModalHostManager.REACT_CLASS)
internal class ReactModalHostManager :
    ViewGroupManager<ReactModalHostView>(), ModalHostViewManagerInterface<ReactModalHostView> {
  private val delegate: ViewManagerDelegate<ReactModalHostView> = ModalHostViewManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): ReactModalHostView =
      ReactModalHostView(reactContext)

  override fun onDropViewInstance(view: ReactModalHostView) {
    super.onDropViewInstance(view)
    view.onDropInstance()
  }

  @ReactProp(name = "animationType")
  override fun setAnimationType(view: ReactModalHostView, value: String?) {
    if (value != null) {
      view.animationType = value
    }
  }

  @ReactProp(name = "transparent")
  override fun setTransparent(view: ReactModalHostView, value: Boolean) {
    view.transparent = value
  }

  @ReactProp(name = "statusBarTranslucent")
  override fun setStatusBarTranslucent(view: ReactModalHostView, value: Boolean) {
    view.statusBarTranslucent = value
  }

  @ReactProp(name = "navigationBarTranslucent")
  override fun setNavigationBarTranslucent(view: ReactModalHostView, value: Boolean) {
    view.navigationBarTranslucent = value
  }

  @ReactProp(name = "hardwareAccelerated")
  override fun setHardwareAccelerated(view: ReactModalHostView, value: Boolean) {
    view.hardwareAccelerated = value
  }

  @ReactProp(name = "visible")
  override fun setVisible(view: ReactModalHostView, value: Boolean) {
    // iOS only
  }

  @ReactProp(name = "presentationStyle")
  override fun setPresentationStyle(view: ReactModalHostView, value: String?): Unit = Unit

  @ReactProp(name = "animated")
  override fun setAnimated(view: ReactModalHostView, value: Boolean): Unit = Unit

  @ReactProp(name = "supportedOrientations")
  override fun setSupportedOrientations(view: ReactModalHostView, value: ReadableArray?): Unit =
      Unit

  @ReactProp(name = "identifier")
  override fun setIdentifier(view: ReactModalHostView, value: Int): Unit = Unit

  @ReactProp(name = "allowSwipeDismissal")
  override fun setAllowSwipeDismissal(view: ReactModalHostView, value: Boolean): Unit = Unit

  override fun setTestId(view: ReactModalHostView, value: String?) {
    super.setTestId(view, value)
    view.setDialogRootViewGroupTestId(value)
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: ReactModalHostView) {
    val dispatcher = UIManagerHelper.getEventDispatcher(reactContext)
    if (dispatcher != null) {
      view.onRequestCloseListener = OnRequestCloseListener {
        dispatcher.dispatchEvent(
            RequestCloseEvent(UIManagerHelper.getSurfaceId(reactContext), view.id)
        )
      }
      view.onShowListener = OnShowListener {
        dispatcher.dispatchEvent(ShowEvent(UIManagerHelper.getSurfaceId(reactContext), view.id))
      }
      view.eventDispatcher = dispatcher
    }
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
      (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()).apply {
        put(RequestCloseEvent.EVENT_NAME, mapOf("registrationName" to "onRequestClose"))
        put(ShowEvent.EVENT_NAME, mapOf("registrationName" to "onShow")) // iOS only
        put("topDismiss", mapOf("registrationName" to "onDismiss")) // iOS only
        put("topOrientationChange", mapOf("registrationName" to "onOrientationChange"))
      }

  override fun onAfterUpdateTransaction(view: ReactModalHostView) {
    super.onAfterUpdateTransaction(view)
    view.showOrUpdate()
  }

  override fun updateState(
      view: ReactModalHostView,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper,
  ): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

  override fun getDelegate(): ViewManagerDelegate<ReactModalHostView> = delegate

  companion object {
    const val REACT_CLASS: String = "RCTModalHostView"
  }
}
