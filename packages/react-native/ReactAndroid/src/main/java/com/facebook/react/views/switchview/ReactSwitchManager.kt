/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.switchview

import android.content.Context
import android.view.View
import android.widget.CompoundButton
import androidx.annotation.ColorInt
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.AndroidSwitchManagerDelegate
import com.facebook.react.viewmanagers.AndroidSwitchManagerInterface
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput

internal class ReactSwitchManager :
    BaseViewManager<ReactSwitch, LayoutShadowNode>(), AndroidSwitchManagerInterface<ReactSwitch> {

  private val delegate: ViewManagerDelegate<ReactSwitch> = AndroidSwitchManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

  override fun getShadowNodeClass(): Class<LayoutShadowNode> = LayoutShadowNode::class.java

  override fun createViewInstance(context: ThemedReactContext): ReactSwitch =
      ReactSwitch(context).apply { showText = false }

  override fun setBackgroundColor(view: ReactSwitch, @ColorInt backgroundColor: Int) {
    view.setBackgroundColor(backgroundColor)
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  override fun setDisabled(view: ReactSwitch, value: Boolean) {
    view.isEnabled = !value
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  override fun setEnabled(view: ReactSwitch, value: Boolean) {
    view.isEnabled = value
  }

  @ReactProp(name = ViewProps.ON)
  override fun setOn(view: ReactSwitch, value: Boolean) {
    setValueInternal(view, value)
  }

  @ReactProp(name = "value")
  override fun setValue(view: ReactSwitch, value: Boolean) {
    setValueInternal(view, value)
  }

  @ReactProp(name = "thumbTintColor", customType = "Color")
  override fun setThumbTintColor(view: ReactSwitch, value: Int?) {
    setThumbColor(view, value)
  }

  @ReactProp(name = "thumbColor", customType = "Color")
  override fun setThumbColor(view: ReactSwitch, value: Int?) {
    view.setThumbColor(value)
  }

  @ReactProp(name = "trackColorForFalse", customType = "Color")
  override fun setTrackColorForFalse(view: ReactSwitch, value: Int?) {
    view.setTrackColorForFalse(value)
  }

  @ReactProp(name = "trackColorForTrue", customType = "Color")
  override fun setTrackColorForTrue(view: ReactSwitch, value: Int?) {
    view.setTrackColorForTrue(value)
  }

  @ReactProp(name = "trackTintColor", customType = "Color")
  override fun setTrackTintColor(view: ReactSwitch, value: Int?) {
    view.setTrackColor(value)
  }

  override fun setNativeValue(view: ReactSwitch, value: Boolean) {
    setValueInternal(view, value)
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: ReactSwitch) {
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER)
  }

  override fun updateExtraData(root: ReactSwitch, extraData: Any) {
    // Do nothing
  }

  override fun getDelegate(): ViewManagerDelegate<ReactSwitch> = delegate

  override fun measure(
      context: Context,
      localData: ReadableMap?,
      props: ReadableMap?,
      state: ReadableMap?,
      width: Float,
      widthMode: YogaMeasureMode,
      height: Float,
      heightMode: YogaMeasureMode,
      attachmentsPositions: FloatArray?,
  ): Long {
    val view = ReactSwitch(context).apply { showText = false }
    val measureSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
    view.measure(measureSpec, measureSpec)
    return YogaMeasureOutput.make(
        PixelUtil.toDIPFromPixel(view.measuredWidth.toFloat()),
        PixelUtil.toDIPFromPixel(view.measuredHeight.toFloat()),
    )
  }

  private fun setValueInternal(view: ReactSwitch, value: Boolean) {
    // Temporarily remove the listener to avoid triggering JS events
    view.setOnCheckedChangeListener(null)
    view.setOn(value)
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER)
  }

  internal companion object {
    const val REACT_CLASS: String = "AndroidSwitch"

    private val ON_CHECKED_CHANGE_LISTENER =
        CompoundButton.OnCheckedChangeListener { buttonView, isChecked ->
          val reactContext = buttonView.context as ReactContext
          val reactTag = buttonView.id
          UIManagerHelper.getEventDispatcher(reactContext)
              ?.dispatchEvent(
                  ReactSwitchEvent(UIManagerHelper.getSurfaceId(reactContext), reactTag, isChecked)
              )
        }
  }
}
