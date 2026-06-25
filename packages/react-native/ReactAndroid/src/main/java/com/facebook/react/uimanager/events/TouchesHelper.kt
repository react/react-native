/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.systrace.Systrace

/**
 * Class responsible for generating catalyst touch events based on android
 * [android.view.MotionEvent].
 */
internal object TouchesHelper {
  @JvmField @Deprecated("Not used in New Architecture") public val TARGET_KEY: String = "target"

  private const val TARGET_SURFACE_KEY = "targetSurface"
  private const val CHANGED_TOUCHES_KEY = "changedTouches"
  private const val TOUCHES_KEY = "touches"
  private const val PAGE_X_KEY = "pageX"
  private const val PAGE_Y_KEY = "pageY"
  private const val TIMESTAMP_KEY = "timestamp"
  private const val POINTER_IDENTIFIER_KEY = "identifier"

  private const val LOCATION_X_KEY = "locationX"
  private const val LOCATION_Y_KEY = "locationY"

  /**
   * Creates catalyst pointers array in format that is expected by RCTEventEmitter JS module from
   * given {@param event} instance. This method use {@param reactTarget} parameter to set as a
   * target view id associated with current gesture.
   */
  private fun createPointersArray(event: TouchEvent): Array<WritableMap?> {
    val motionEvent = event.getMotionEvent()
    val touches = arrayOfNulls<WritableMap>(motionEvent.pointerCount)

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
      val touch = Arguments.createMap()

      // pageX,Y values are relative to the RootReactView
      // the motionEvent already contains coordinates in that view
      touch.putDouble(PAGE_X_KEY, motionEvent.getX(index).pxToDp().toDouble())
      touch.putDouble(PAGE_Y_KEY, motionEvent.getY(index).pxToDp().toDouble())

      // locationX,Y values are relative to the target view
      // To compute the values for the view, we subtract that views location from the event X,Y
      val locationX = motionEvent.getX(index) - targetViewCoordinateX
      val locationY = motionEvent.getY(index) - targetViewCoordinateY
      touch.putDouble(LOCATION_X_KEY, locationX.pxToDp().toDouble())
      touch.putDouble(LOCATION_Y_KEY, locationY.pxToDp().toDouble())

      touch.putInt(TARGET_SURFACE_KEY, event.surfaceId)
      @Suppress("DEPRECATION") touch.putInt(TARGET_KEY, event.viewTag)
      touch.putDouble(TIMESTAMP_KEY, event.timestampMs.toDouble())
      touch.putDouble(POINTER_IDENTIFIER_KEY, motionEvent.getPointerId(index).toDouble())

      touches[index] = touch
    }

    return touches
  }

  /**
   * Generate touch event data to match JS expectations. Combines logic in [sendTouchEvent] and
   * [com.facebook.react.fabric.events.FabricEventEmitter] to create the same data structure in a
   * more efficient manner.
   *
   * Touches have to be dispatched as separate events for each changed pointer to make JS process
   * them correctly. To avoid allocations, we preprocess touch events in Java world and then convert
   * them to native before dispatch.
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
      val type = event.getTouchEventType()
      val motionEvent = event.getMotionEvent()
      var touches = createPointersArray(event)
      var changedTouches: Array<WritableMap?>? = null

      when (type) {
        TouchEventType.START -> {
          val newPointerIndex = motionEvent.actionIndex

          changedTouches = arrayOf(touches[newPointerIndex]?.copy())
        }
        TouchEventType.END -> {
          val finishedPointerIndex = motionEvent.actionIndex
          /*
           * Clear finished pointer index for compatibility with W3C touch "end" events, where the
           * active touches don't include the set that has just been "ended".
           */
          val finishedPointer = touches[finishedPointerIndex]
          touches[finishedPointerIndex] = null

          changedTouches = arrayOf(finishedPointer)
        }
        TouchEventType.MOVE -> {
          changedTouches = arrayOfNulls(touches.size)
          var i = 0
          while (i < touches.size) {
            changedTouches[i] = touches[i]?.copy()
            i++
          }
        }
        TouchEventType.CANCEL -> {
          changedTouches = touches
          touches = arrayOfNulls(0)
        }
      }

      for (touchData in changedTouches) {
        val eventData = touchData?.let { td ->
          val ed = td.copy()
          val changedTouchesArray = getWritableArray(/* copyObjects */ true, changedTouches)
          val touchesArray = getWritableArray(/* copyObjects */ true, touches)
          ed.putArray(CHANGED_TOUCHES_KEY, changedTouchesArray)
          ed.putArray(TOUCHES_KEY, touchesArray)
          ed
        }

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

  private fun getWritableArray(copyObjects: Boolean, objects: Array<WritableMap?>): WritableArray {
    val result = Arguments.createArray()
    for (obj in objects) {
      if (obj != null) {
        result.pushMap(if (copyObjects) obj.copy() else obj)
      }
    }
    return result
  }
}
