/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import android.graphics.Color
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp

/** Legacy View manager (non Fabric compatible) for {@link MyNativeView} components. */
@ReactModule(name = MyLegacyViewManager.REACT_CLASS)
internal class MyLegacyViewManager(reactContext: ReactApplicationContext) :
    SimpleViewManager<MyNativeView>() {

  private val callerContext: ReactApplicationContext = reactContext

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(themedReactContext: ThemedReactContext): MyNativeView =
      MyNativeView(themedReactContext)

  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1f)
  override fun setOpacity(view: MyNativeView, opacity: Float) {
    super.setOpacity(view, opacity)
  }

  @ReactProp(name = ViewProps.COLOR)
  fun setColor(view: MyNativeView, color: String?): Unit =
      when (color) {
        null -> view.setBackgroundColor(Color.TRANSPARENT)
        else -> view.setBackgroundColor(Color.parseColor(color))
      }

  @ReactProp(name = "cornerRadius")
  fun setCornerRadius(view: MyNativeView, cornerRadius: Float) {
    view.setCornerRadius(cornerRadius)
  }

  override fun getExportedViewConstants(): Map<String, Any> = mapOf("PI" to 3.14)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> {
    return mapOf(
        "onColorChanged" to
            mapOf(
                "phasedRegistrationNames" to
                    mapOf(
                        "bubbled" to "onColorChanged",
                        "captured" to "onColorChangedCapture",
                    )
            )
    )
  }

  override fun receiveCommand(view: MyNativeView, commandId: String, args: ReadableArray?) {
    if (commandId.contentEquals("changeBackgroundColor")) {
      val sentColor: Int = Color.parseColor(args?.getString(0))
      view.setBackgroundColor(sentColor)
    }
  }

  @Deprecated("Deprecated in Java")
  @Suppress("DEPRECATION") // We intentionally want to test against the legacy API here.
  override fun receiveCommand(view: MyNativeView, commandId: Int, args: ReadableArray?) {
    when (commandId) {
      COMMAND_CHANGE_BACKGROUND_COLOR -> {
        val sentColor = Color.parseColor(args?.getString(0))
        view.setBackgroundColor(sentColor)
      }
      COMMAND_ADD_OVERLAYS -> {
        val overlayColors = checkNotNull(args?.getArray(0))
        view.addOverlays(overlayColors)
      }
      COMMAND_REMOVE_OVERLAYS -> {
        view.removeOverlays()
      }
    }
  }

  override fun getCommandsMap(): Map<String, Int> = mapOf(
      "changeBackgroundColor" to COMMAND_CHANGE_BACKGROUND_COLOR,
      "addOverlays" to COMMAND_ADD_OVERLAYS,
      "removeOverlays" to COMMAND_REMOVE_OVERLAYS,
  )

  companion object {
    const val REACT_CLASS = "RNTMyLegacyNativeView"
    const val COMMAND_CHANGE_BACKGROUND_COLOR = 1
    const val COMMAND_ADD_OVERLAYS = 2
    const val COMMAND_REMOVE_OVERLAYS = 3
  }
}
