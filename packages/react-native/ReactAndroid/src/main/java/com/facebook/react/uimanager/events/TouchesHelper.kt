/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactNativeJNISoLoader
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.systrace.Systrace

/**
 * Class responsible for generating catalyst touch events based on android
 * [android.view.MotionEvent].
 */
@DoNotStrip
internal object TouchesHelper {
  init {
    ReactNativeJNISoLoader.staticInit()
  }

  // Keep in sync with the field indices in TouchesHelper.cpp.
  const val PAGE_X_INDEX = 0
  const val PAGE_Y_INDEX = 1
  const val LOCATION_X_INDEX = 2
  const val LOCATION_Y_INDEX = 3
  const val TARGET_SURFACE_INDEX = 4
  const val TARGET_INDEX = 5
  const val TIMESTAMP_INDEX = 6
  const val IDENTIFIER_INDEX = 7
  const val POINTER_FIELDS = 8

  /**
   * Fills the pointer data of [nativeCreateTouchPayload]: for each pointer of the
   * [android.view.MotionEvent], in order, pageX, pageY, locationX, locationY, targetSurface,
   * target, timestamp and identifier.
   */
  private fun createPointerData(event: TouchEvent): DoubleArray {
    val motionEvent = event.getMotionEvent()
    val pointerData = DoubleArray(motionEvent.pointerCount * POINTER_FIELDS)

    // Calculate the coordinates for the target view.
    // The MotionEvent contains the X,Y of the touch in the coordinate space of the root view
    // The TouchEvent contains the X,Y of the touch in the coordinate space of the target view
    // Subtracting them allows us to get the coordinates of the target view's top left corner
    // We then use this when computing the view specific touches below
    // Since only one view is actually handling even multiple touches, the values are all relative
    // to this one target view.
    val targetViewCoordinateX = motionEvent.x - event.viewX
    val targetViewCoordinateY = motionEvent.y - event.viewY

    for (index in 0 until motionEvent.pointerCount) {
      val field = index * POINTER_FIELDS

      // pageX,Y values are relative to the RootReactView
      // the motionEvent already contains coordinates in that view
      pointerData[field + PAGE_X_INDEX] = motionEvent.getX(index).pxToDp().toDouble()
      pointerData[field + PAGE_Y_INDEX] = motionEvent.getY(index).pxToDp().toDouble()

      // locationX,Y values are relative to the target view
      // To compute the values for the view, we subtract that views location from the event X,Y
      val locationX = motionEvent.getX(index) - targetViewCoordinateX
      val locationY = motionEvent.getY(index) - targetViewCoordinateY
      pointerData[field + LOCATION_X_INDEX] = locationX.pxToDp().toDouble()
      pointerData[field + LOCATION_Y_INDEX] = locationY.pxToDp().toDouble()

      pointerData[field + TARGET_SURFACE_INDEX] = event.surfaceId.toDouble()
      pointerData[field + TARGET_INDEX] = event.viewTag.toDouble()
      pointerData[field + TIMESTAMP_INDEX] = event.timestampMs.toDouble()
      pointerData[field + IDENTIFIER_INDEX] = motionEvent.getPointerId(index).toDouble()
    }

    return pointerData
  }

  /**
   * Generate touch event data to match JS expectations. Combines logic in [sendTouchEvent] and
   * [com.facebook.react.fabric.events.FabricEventEmitter] to create the same data structure in a
   * more efficient manner.
   *
   * Touches have to be dispatched as separate events for each changed pointer to make JS process
   * them correctly. The pointers are collected once into a [DoubleArray], and each event's payload
   * is built from it in a single JNI call, instead of putting every value into a native map one by
   * one.
   *
   * @param eventEmitter emitter to dispatch event to
   * @param event the touch event to extract data from
   */
  @JvmStatic
  fun sendTouchEvent(eventEmitter: RCTModernEventEmitter, event: TouchEvent) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT,
        "TouchesHelper.sentTouchEventModern(" + event.getEventName() + ")",
    )
    try {
      val motionEvent = event.getMotionEvent()
      val pointerCount = motionEvent.pointerCount
      // Pointers are passed to native as bit masks of their indices.
      check(pointerCount < Int.SIZE_BITS) { "Too many pointers: $pointerCount" }
      val allPointers = (1 shl pointerCount) - 1
      val changedPointers: Int
      val touchPointers: Int

      when (event.getTouchEventType()) {
        TouchEventType.START -> {
          changedPointers = 1 shl motionEvent.actionIndex
          touchPointers = allPointers
        }
        TouchEventType.END -> {
          changedPointers = 1 shl motionEvent.actionIndex
          /*
           * Leave out the finished pointer for compatibility with W3C touch "end" events, where the
           * active touches don't include the set that has just been "ended".
           */
          touchPointers = allPointers and changedPointers.inv()
        }
        TouchEventType.MOVE -> {
          changedPointers = allPointers
          touchPointers = allPointers
        }
        TouchEventType.CANCEL -> {
          changedPointers = allPointers
          touchPointers = 0
        }
      }

      val pointerData = createPointerData(event)
      for (pointer in 0 until pointerCount) {
        if (changedPointers and (1 shl pointer) == 0) {
          continue
        }
        val eventData =
            nativeCreateTouchPayload(pointerData, pointer, changedPointers, touchPointers)

        eventEmitter.receiveEvent(
            event.surfaceId,
            event.viewTag,
            event.getEventName(),
            event.canCoalesce(),
            0,
            eventData,
            event.getEventCategory(),
            event.timestampMs,
        )
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
  }

  /**
   * Creates the payload of a touch event: the fields of pointer [eventPointer] and the
   * `changedTouches` and `touches` arrays of the pointers whose bits are set in [changedPointers]
   * and [touchPointers].
   *
   * @param pointerData 8 values for each pointer, in order: pageX, pageY, locationX, locationY,
   *   targetSurface, target, timestamp and identifier.
   */
  @DoNotStrip
  @JvmStatic
  private external fun nativeCreateTouchPayload(
      pointerData: DoubleArray,
      eventPointer: Int,
      changedPointers: Int,
      touchPointers: Int,
  ): WritableNativeMap
}
