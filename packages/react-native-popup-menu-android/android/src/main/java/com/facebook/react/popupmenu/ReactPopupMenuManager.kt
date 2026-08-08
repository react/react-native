/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.popupmenu

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.AndroidPopupMenuManagerDelegate
import com.facebook.react.viewmanagers.AndroidPopupMenuManagerInterface

@ReactModule(name = ReactPopupMenuManager.REACT_CLASS)
public class ReactPopupMenuManager :
    ViewGroupManager<ReactPopupMenuContainer>(),
    AndroidPopupMenuManagerInterface<ReactPopupMenuContainer> {

  private val delegate: ViewManagerDelegate<ReactPopupMenuContainer> =
      AndroidPopupMenuManagerDelegate(this)

  override fun createViewInstance(reactContext: ThemedReactContext): ReactPopupMenuContainer {
    return ReactPopupMenuContainer(reactContext)
  }

  override fun getDelegate(): ViewManagerDelegate<ReactPopupMenuContainer> = delegate

  @ReactProp(name = "menuItems")
  override fun setMenuItems(view: ReactPopupMenuContainer, menuItems: ReadableArray?) {
    view.setMenuItems(menuItems)
  }

  override fun getName(): String {
    return REACT_CLASS
  }

  override fun show(popupMenu: ReactPopupMenuContainer) {
    popupMenu.showPopupMenu()
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants: MutableMap<String, Any> = baseEventTypeConstants ?: HashMap()
    eventTypeConstants.putAll(DIRECT_EVENT_TYPE_CONSTANT)
    return eventTypeConstants
  }

  public companion object {
    public const val REACT_CLASS: String = "AndroidPopupMenu"
    private const val REGISTRATION_NAME = "registrationName"
    private val DIRECT_EVENT_TYPE_CONSTANT =
        mapOf(
            PopupMenuSelectionEvent.EVENT_NAME to
                mapOf(REGISTRATION_NAME to "onPopupMenuSelectionChange"),
            PopupMenuDismissEvent.EVENT_NAME to mapOf(REGISTRATION_NAME to "onPopupMenuDismiss"),
        )
  }
}
