/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.events.TouchesHelper
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Implements(TouchesHelper::class)
class ShadowTouchesHelper {

  companion object {

    /** Builds the same payload as the native TouchesHelper::createTouchPayload. */
    @JvmStatic
    @Implementation
    fun nativeCreateTouchPayload(
        pointerData: DoubleArray,
        eventPointer: Int,
        changedPointers: Int,
        touchPointers: Int,
    ): WritableNativeMap {
      val pointerCount = pointerData.size / TouchesHelper.POINTER_FIELDS
      val changedTouches = JavaOnlyArray()
      val touches = JavaOnlyArray()
      for (index in 0 until pointerCount) {
        if (changedPointers and (1 shl index) != 0) {
          changedTouches.pushMap(JavaOnlyMap().also { putTouch(it, pointerData, index) })
        }
        if (touchPointers and (1 shl index) != 0) {
          touches.pushMap(JavaOnlyMap().also { putTouch(it, pointerData, index) })
        }
      }
      val payload = WritableNativeMap()
      putTouch(payload, pointerData, eventPointer)
      payload.putArray("changedTouches", changedTouches)
      payload.putArray("touches", touches)
      return payload
    }

    private fun putTouch(touch: WritableMap, pointerData: DoubleArray, index: Int) {
      val field = index * TouchesHelper.POINTER_FIELDS
      touch.putDouble("pageX", pointerData[field + TouchesHelper.PAGE_X_INDEX])
      touch.putDouble("pageY", pointerData[field + TouchesHelper.PAGE_Y_INDEX])
      touch.putDouble("locationX", pointerData[field + TouchesHelper.LOCATION_X_INDEX])
      touch.putDouble("locationY", pointerData[field + TouchesHelper.LOCATION_Y_INDEX])
      touch.putInt("targetSurface", pointerData[field + TouchesHelper.TARGET_SURFACE_INDEX].toInt())
      touch.putInt("target", pointerData[field + TouchesHelper.TARGET_INDEX].toInt())
      touch.putDouble("timestamp", pointerData[field + TouchesHelper.TIMESTAMP_INDEX])
      touch.putDouble("identifier", pointerData[field + TouchesHelper.IDENTIFIER_INDEX])
    }
  }
}
