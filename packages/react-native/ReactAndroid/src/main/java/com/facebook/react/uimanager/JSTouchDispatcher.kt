/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.MotionEvent
import android.view.ViewGroup
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.TouchEvent
import com.facebook.react.uimanager.events.TouchEventCoalescingKeyHelper
import com.facebook.react.uimanager.events.TouchEventType

/**
 * JSTouchDispatcher handles dispatching touches to JS from RootViews. If you implement RootView you
 * need to call handleTouchEvent from onTouchEvent and onInterceptTouchEvent. It will correctly find
 * the right view to handle the touch and also dispatch the appropriate event to JS
 */
public class JSTouchDispatcher(private val viewGroup: ViewGroup) {
  private var targetTag = -1
  private val targetCoordinates = FloatArray(2)
  private var childIsHandlingNativeGesture = false
  private var gestureStartTime = TouchEvent.UNSET

  private val touchEventCoalescingKeyHelper: TouchEventCoalescingKeyHelper =
      TouchEventCoalescingKeyHelper()

  @OptIn(UnstableReactNativeAPI::class)
  public fun onChildStartedNativeGesture(
      androidEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
  ) {
    onChildStartedNativeGesture(androidEvent, eventDispatcher, null)
  }

  @UnstableReactNativeAPI
  public fun onChildStartedNativeGesture(
      androidEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
      reactContext: ReactContext?,
  ) {
    if (childIsHandlingNativeGesture) {
      // This means we previously had another child start handling this native gesture and now a
      // different native parent of that child has decided to intercept the touch stream and handle
      // the gesture itself. Example where this can happen: HorizontalScrollView in a ScrollView.
      return
    }

    dispatchCancelEvent(androidEvent, eventDispatcher)
    childIsHandlingNativeGesture = true

    if (targetTag != -1) {
      val surfaceId = UIManagerHelper.getSurfaceId(viewGroup)
      sweepActiveTouchForTag(surfaceId, targetTag, reactContext)
    }

    targetTag = -1
  }

  @Suppress("UNUSED_PARAMETER")
  public fun onChildEndedNativeGesture(
      androidEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
  ) {
    // There should be only one child gesture at any given time. We can safely turn off the flag.
    childIsHandlingNativeGesture = false
  }

  public fun handleTouchEvent(ev: MotionEvent, eventDispatcher: EventDispatcher) {
    handleTouchEvent(ev, eventDispatcher, null)
  }

  /**
   * Main catalyst view is responsible for collecting and sending touch events to JS. This method
   * reacts for an incoming android native touch events ([MotionEvent]) and calls into
   * [com.facebook.react.uimanager.events.EventDispatcher] when appropriate. It uses
   * [com.facebook.react.uimanager.TouchTargetHelper.findTargetTagAndCoordinatesForTouch] helper
   * method for figuring out a react view ID in the case of ACTION_DOWN event (when the gesture
   * starts).
   */
  public fun handleTouchEvent(
      ev: MotionEvent,
      eventDispatcher: EventDispatcher,
      reactContext: ReactContext?,
  ) {
    val action = ev.action and MotionEvent.ACTION_MASK
    if (action == MotionEvent.ACTION_DOWN) {
      if (targetTag != -1) {
        FLog.e(ReactConstants.TAG, "Got DOWN touch before receiving UP or CANCEL from last gesture")
      }

      // First event for this gesture. We expect tag to be set to -1, and we use
      // findTargetTagAndSetCoordinates to find the react view ID that will handle this gesture
      childIsHandlingNativeGesture = false
      gestureStartTime = ev.eventTime
      targetTag = findTargetTagAndSetCoordinates(ev)
      val surfaceId = UIManagerHelper.getSurfaceId(viewGroup)
      markActiveTouchForTag(surfaceId, targetTag, reactContext)

      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              UIManagerHelper.getSurfaceId(viewGroup),
              targetTag,
              TouchEventType.START,
              ev,
              gestureStartTime,
              targetCoordinates[0],
              targetCoordinates[1],
              touchEventCoalescingKeyHelper,
          )
      )
    } else if (childIsHandlingNativeGesture) {
      // If the touch was intercepted by a child, we've already sent a cancel event to JS for this
      // gesture, so we shouldn't send any more touches related to it.
      return
    } else if (targetTag == -1) {
      // All the subsequent action types are expected to be called after ACTION_DOWN thus target
      // is supposed to be set for them.
      FLog.e(
          ReactConstants.TAG,
          "Unexpected state: received touch event but didn't get starting ACTION_DOWN for this " +
              "gesture before",
      )
    } else if (action == MotionEvent.ACTION_UP) {
      // End of the gesture. We reset target tag to -1 and expect no further event associated with
      // this gesture.
      findTargetTagAndSetCoordinates(ev)
      val surfaceId = UIManagerHelper.getSurfaceId(viewGroup)
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              surfaceId,
              targetTag,
              TouchEventType.END,
              ev,
              gestureStartTime,
              targetCoordinates[0],
              targetCoordinates[1],
              touchEventCoalescingKeyHelper,
          )
      )
      sweepActiveTouchForTag(surfaceId, targetTag, reactContext)
      targetTag = -1
      gestureStartTime = TouchEvent.UNSET
    } else if (action == MotionEvent.ACTION_MOVE) {
      // Update pointer position for current gesture
      findTargetTagAndSetCoordinates(ev)
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              UIManagerHelper.getSurfaceId(viewGroup),
              targetTag,
              TouchEventType.MOVE,
              ev,
              gestureStartTime,
              targetCoordinates[0],
              targetCoordinates[1],
              touchEventCoalescingKeyHelper,
          )
      )
    } else if (action == MotionEvent.ACTION_POINTER_DOWN) {
      // New pointer goes down, this can only happen after ACTION_DOWN is sent for the first pointer
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              UIManagerHelper.getSurfaceId(viewGroup),
              targetTag,
              TouchEventType.START,
              ev,
              gestureStartTime,
              targetCoordinates[0],
              targetCoordinates[1],
              touchEventCoalescingKeyHelper,
          )
      )
    } else if (action == MotionEvent.ACTION_POINTER_UP) {
      // Exactly one of the pointers goes up
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              UIManagerHelper.getSurfaceId(viewGroup),
              targetTag,
              TouchEventType.END,
              ev,
              gestureStartTime,
              targetCoordinates[0],
              targetCoordinates[1],
              touchEventCoalescingKeyHelper,
          )
      )
    } else if (action == MotionEvent.ACTION_CANCEL) {
      if (touchEventCoalescingKeyHelper.hasCoalescingKey(ev.downTime)) {
        dispatchCancelEvent(ev, eventDispatcher)
      } else {
        FLog.e(
            ReactConstants.TAG,
            "Received an ACTION_CANCEL touch event for which we have no corresponding ACTION_DOWN",
        )
      }
      val surfaceId = UIManagerHelper.getSurfaceId(viewGroup)
      sweepActiveTouchForTag(surfaceId, targetTag, reactContext)

      targetTag = -1
      gestureStartTime = TouchEvent.UNSET
    } else {
      FLog.w(
          ReactConstants.TAG,
          "Warning : touch event was ignored. Action=$action Target=$targetTag",
      )
    }
  }

  private fun markActiveTouchForTag(surfaceId: Int, reactTag: Int, reactContext: ReactContext?) {
    if (reactContext == null) {
      return
    }
    val uiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
    uiManager?.markActiveTouchForTag(surfaceId, reactTag)
  }

  private fun sweepActiveTouchForTag(surfaceId: Int, reactTag: Int, reactContext: ReactContext?) {
    if (reactContext == null) {
      return
    }
    val uiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
    uiManager?.sweepActiveTouchForTag(surfaceId, reactTag)
  }

  private fun findTargetTagAndSetCoordinates(ev: MotionEvent): Int {
    // This method updates `targetCoordinates` with coordinates for the motion event.
    return TouchTargetHelper.findTargetTagAndCoordinatesForTouch(
        ev.x,
        ev.y,
        viewGroup,
        targetCoordinates,
        null,
    )
  }

  private fun dispatchCancelEvent(androidEvent: MotionEvent, eventDispatcher: EventDispatcher) {
    // This means the gesture has already ended, via some other CANCEL or UP event. This is not
    // expected to happen very often as it would mean some child View has decided to intercept the
    // touch stream and start a native gesture only upon receiving the UP/CANCEL event.
    if (targetTag == -1) {
      FLog.w(
          ReactConstants.TAG,
          "Can't cancel already finished gesture. Is a child View trying to start a gesture from " +
              "an UP/CANCEL event?",
      )
      return
    }

    Assertions.assertCondition(
        !childIsHandlingNativeGesture,
        "Expected to not have already sent a cancel for this gesture",
    )
    Assertions.assertNotNull(eventDispatcher)
        .dispatchEvent(
            TouchEvent.obtain(
                UIManagerHelper.getSurfaceId(viewGroup),
                targetTag,
                TouchEventType.CANCEL,
                androidEvent,
                gestureStartTime,
                targetCoordinates[0],
                targetCoordinates[1],
                touchEventCoalescingKeyHelper,
            )
        )
  }
}
