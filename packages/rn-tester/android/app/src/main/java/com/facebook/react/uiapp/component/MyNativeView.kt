/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // As we want to test RCTEventEmitter here

package com.facebook.react.uiapp.component

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

internal class MyNativeView(context: ThemedReactContext) : View(context) {
  private var currentColor = 0
  private var background: GradientDrawable = GradientDrawable()
  private var reactContext: ReactContext = context.reactApplicationContext

  override fun setBackgroundColor(color: Int) {
    if (color != currentColor) {
      background.setColor(color)
      currentColor = color
      emitNativeEvent(color)
      setBackground(background)
    }
  }

  fun setCornerRadius(cornerRadius: Float) {
    background.cornerRadius = cornerRadius
    setBackground(background)
  }

  fun addOverlays(overlayColors: ReadableArray) {
    val numOverlays = overlayColors.size()
    val width = measuredWidth / numOverlays
    for (i in 0 until numOverlays) {
      val drawable = ColorDrawable(Color.parseColor(overlayColors.getString(i)))
      val leftOffset = width * i
      drawable.setBounds(leftOffset, 0, leftOffset + width, measuredHeight)
      overlay.add(drawable)
    }
  }

  fun removeOverlays() {
    overlay.clear()
  }

  private fun emitNativeEvent(color: Int) {
    val event = Arguments.createMap()
    val hsv = FloatArray(3)
    Color.colorToHSV(color, hsv)
    val backgroundColor =
        Arguments.createMap().apply {
          putDouble("hue", hsv[0].toDouble())
          putDouble("saturation", hsv[1].toDouble())
          putDouble("brightness", hsv[2].toDouble())
          putDouble("alpha", Color.alpha(color).toDouble())
        }

    event.putMap("backgroundColor", backgroundColor)

    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "onColorChanged", event)
  }

  fun emitOnArrayChangedEvent(ints: List<Int>) {
    val newIntArray = Arguments.createArray()
    val newBoolArray = Arguments.createArray()
    val newFloatArray = Arguments.createArray()
    val newDoubleArray = Arguments.createArray()
    val newYesNoArray = Arguments.createArray()
    val newStringArray = Arguments.createArray()
    val newObjectArray = Arguments.createArray()
    val newArrayArray = Arguments.createArray()

    for (i in ints) {
      newIntArray.pushInt(i * 2)
      newBoolArray.pushBoolean(i % 2 == 1)
      newFloatArray.pushDouble(i * 3.14)
      newDoubleArray.pushDouble(i / 3.14)
      newYesNoArray.pushString(if (i % 2 == 1) "yep" else "nope")
      newStringArray.pushString(i.toString())

      val latLon = Arguments.createMap()
      latLon.putDouble("lat", -1.0 * i)
      latLon.putDouble("lon", 2.0 * i)
      newObjectArray.pushMap(latLon)

      val innerArray: WritableArray = Arguments.createArray()
      innerArray.pushInt(i)
      innerArray.pushInt(i)
      innerArray.pushInt(i)
      newArrayArray.pushArray(innerArray)
    }

    val payload =
        Arguments.createMap().apply {
          putArray("values", newIntArray)
          putArray("boolValues", newBoolArray)
          putArray("floats", newFloatArray)
          putArray("doubles", newDoubleArray)
          putArray("yesNos", newYesNoArray)
          putArray("strings", newStringArray)
          putArray("latLons", newObjectArray)
          putArray("multiArrays", newArrayArray)
        }

    val reactContext = context as ReactContext
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
    val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext)
    val event = OnIntArrayChangedEvent(surfaceId, id, payload)

    eventDispatcher?.dispatchEvent(event)
  }

  fun emitLegacyStyleEvent() {
    val reactContext = context as ReactContext
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
    val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext)
    val payload = Arguments.createMap().apply { putString("string", "Legacy Style Event Fired.") }
    val event = OnLegacyStyleEvent(surfaceId, id, payload)
    eventDispatcher?.dispatchEvent(event)
  }

  inner class OnIntArrayChangedEvent(
      surfaceId: Int,
      viewId: Int,
      private val payload: WritableMap,
  ) : Event<OnIntArrayChangedEvent>(surfaceId, viewId) {
    override fun getEventName() = "topIntArrayChanged"

    override fun getEventData() = payload
  }

  inner class OnLegacyStyleEvent(surfaceId: Int, viewId: Int, private val payload: WritableMap) :
      Event<OnLegacyStyleEvent>(surfaceId, viewId) {
    override fun getEventName() = "alternativeLegacyName"

    override fun getEventData() = payload
  }
}
