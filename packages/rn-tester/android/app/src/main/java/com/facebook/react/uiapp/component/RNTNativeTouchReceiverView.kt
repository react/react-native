/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import android.view.MotionEvent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.views.view.ReactViewGroup

/**
 * A native ViewGroup that fires onNativeTouch via onInterceptTouchEvent.
 *
 * This simulates a native parent that receives touch events through Android's touch dispatch.
 * When blockNativeResponder=false on a Pressable child, requestDisallowInterceptTouchEvent is NOT
 * called, so onInterceptTouchEvent fires and onNativeTouch is dispatched. When
 * blockNativeResponder=true, requestDisallowInterceptTouchEvent(true) is called on this view,
 * suppressing onInterceptTouchEvent — and thus onNativeTouch — for that gesture.
 */
internal class RNTNativeTouchReceiverView(context: ThemedReactContext) : ReactViewGroup(context) {

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    val intercepted = super.onInterceptTouchEvent(ev)
    if (ev.action == MotionEvent.ACTION_UP) {
      emitNativeTouchEvent()
    }
    return intercepted
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    val handled = super.onTouchEvent(ev)
    if (ev.action == MotionEvent.ACTION_UP) {
      emitNativeTouchEvent()
    }
    return handled
  }

  private fun emitNativeTouchEvent() {
    val reactContext = context as ReactContext
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
    val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext)
    eventDispatcher?.dispatchEvent(OnNativeTouchEvent(surfaceId, id))
  }

  private inner class OnNativeTouchEvent(surfaceId: Int, viewId: Int) :
      Event<OnNativeTouchEvent>(surfaceId, viewId) {
    override fun getEventName(): String = "topNativeTouch"

    override fun getEventData(): WritableMap = Arguments.createMap()
  }
}
