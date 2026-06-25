/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.events

import android.view.MotionEvent
import androidx.core.util.Pools.SynchronizedPool
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.SoftAssertions
import com.facebook.react.uimanager.events.TouchEventType.Companion.getJSEventName

/**
 * An event representing the start, end or movement of a touch. Corresponds to a single [ ].
 *
 * TouchEvent coalescing can happen for move events if two move events have the same target view and
 * coalescing key. See [TouchEventCoalescingKeyHelper] for more information about how these
 * coalescing keys are determined.
 */
public class TouchEvent private constructor() : Event<TouchEvent>() {
  private var motionEvent: MotionEvent? = null
  private var touchEventType: TouchEventType? = null
  private var coalescingKey: Short = 0

  // Coordinates in the ViewTag coordinate space
  public var viewX: Float = 0f
    private set

  public var viewY: Float = 0f
    private set

  public fun getMotionEvent(): MotionEvent = Assertions.assertNotNull(motionEvent)

  public fun getTouchEventType(): TouchEventType = Assertions.assertNotNull(touchEventType)

  private fun init(
      surfaceId: Int,
      viewTag: Int,
      touchEventType: TouchEventType?,
      motionEventToCopy: MotionEvent,
      gestureStartTime: Long,
      viewX: Float,
      viewY: Float,
      touchEventCoalescingKeyHelper: TouchEventCoalescingKeyHelper,
  ) {
    super.init(surfaceId, viewTag, motionEventToCopy.eventTime)
    SoftAssertions.assertCondition(
        gestureStartTime != UNSET,
        "Gesture start time must be initialized",
    )
    var coalescingKey: Short = 0
    val action = motionEventToCopy.action and MotionEvent.ACTION_MASK
    when (action) {
      MotionEvent.ACTION_DOWN -> touchEventCoalescingKeyHelper.addCoalescingKey(gestureStartTime)
      MotionEvent.ACTION_UP -> touchEventCoalescingKeyHelper.removeCoalescingKey(gestureStartTime)
      MotionEvent.ACTION_POINTER_DOWN,
      MotionEvent.ACTION_POINTER_UP ->
          touchEventCoalescingKeyHelper.incrementCoalescingKey(gestureStartTime)
      MotionEvent.ACTION_MOVE ->
          coalescingKey = touchEventCoalescingKeyHelper.getCoalescingKey(gestureStartTime)
      MotionEvent.ACTION_CANCEL ->
          touchEventCoalescingKeyHelper.removeCoalescingKey(gestureStartTime)
      else ->
          Unit // Passthrough for other actions (such as ACTION_SCROLL), coalescing is not applied
    }

    motionEvent = MotionEvent.obtain(motionEventToCopy)

    this.touchEventType = touchEventType
    this.coalescingKey = coalescingKey
    this.viewX = viewX
    this.viewY = viewY
  }

  override fun onDispose() {
    motionEvent?.recycle()
    motionEvent = null

    // Either `this` is in the event pool, or motionEvent
    // is null. It is in theory not possible for a TouchEvent to
    // be in the EVENTS_POOL but for motionEvent to be null. However,
    // out of an abundance of caution and to avoid memory leaks or
    // other crashes at all costs, we attempt to release here and log
    // a soft exception here if release throws an IllegalStateException
    // due to `this` being over-released. This may indicate that there is
    // a logic error in our events system or pooling mechanism.
    try {
      EVENTS_POOL.release(this)
    } catch (e: IllegalStateException) {
      ReactSoftExceptionLogger.logSoftException(TAG, e)
    }
  }

  override fun getEventName(): String = getJSEventName(Assertions.assertNotNull(touchEventType))

  // We can coalesce move events but not start/end events. Coalescing move events should probably
  // append historical move data like MotionEvent batching does. This is left as an exercise for
  // the reader.
  override fun canCoalesce(): Boolean =
      when (Assertions.assertNotNull(touchEventType)) {
        TouchEventType.START,
        TouchEventType.END,
        TouchEventType.CANCEL -> false
        TouchEventType.MOVE -> true
        else -> throw RuntimeException("Unknown touch event type: $touchEventType")
      }

  override fun getCoalescingKey(): Short = coalescingKey

  override fun dispatchModern(rctEventEmitter: RCTModernEventEmitter) {
    if (!verifyMotionEvent()) {
      return
    }

    TouchesHelper.sendTouchEvent(rctEventEmitter, this)
  }

  public override fun getEventCategory(): Int {
    val type = touchEventType ?: return EventCategoryDef.UNSPECIFIED
    return when (type) {
      TouchEventType.START -> EventCategoryDef.CONTINUOUS_START
      TouchEventType.END,
      TouchEventType.CANCEL -> EventCategoryDef.CONTINUOUS_END
      TouchEventType.MOVE -> EventCategoryDef.CONTINUOUS
    }
  }

  private fun verifyMotionEvent(): Boolean {
    if (motionEvent == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException(
              "Cannot dispatch a TouchEvent that has no MotionEvent; the TouchEvent has been" +
                  " recycled"
          ),
      )
      return false
    }
    return true
  }

  public companion object {
    private val TAG = TouchEvent::class.java.simpleName
    private const val TOUCH_EVENTS_POOL_SIZE = 3
    private val EVENTS_POOL = SynchronizedPool<TouchEvent>(TOUCH_EVENTS_POOL_SIZE)
    public const val UNSET: Long = Long.MIN_VALUE

    @Deprecated(
        "Please use the other overload of the obtain method, which explicitly provides surfaceId",
        ReplaceWith("obtain(surfaceId, ...)"),
    )
    @JvmStatic
    public fun obtain(
        viewTag: Int,
        touchEventType: TouchEventType?,
        motionEventToCopy: MotionEvent?,
        gestureStartTime: Long,
        viewX: Float,
        viewY: Float,
        touchEventCoalescingKeyHelper: TouchEventCoalescingKeyHelper,
    ): TouchEvent {
      return obtain(
          -1,
          viewTag,
          touchEventType,
          Assertions.assertNotNull(motionEventToCopy),
          gestureStartTime,
          viewX,
          viewY,
          touchEventCoalescingKeyHelper,
      )
    }

    @JvmStatic
    public fun obtain(
        surfaceId: Int,
        viewTag: Int,
        touchEventType: TouchEventType?,
        motionEventToCopy: MotionEvent?,
        gestureStartTime: Long,
        viewX: Float,
        viewY: Float,
        touchEventCoalescingKeyHelper: TouchEventCoalescingKeyHelper,
    ): TouchEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = TouchEvent()
      }
      event.init(
          surfaceId,
          viewTag,
          touchEventType,
          Assertions.assertNotNull(motionEventToCopy),
          gestureStartTime,
          viewX,
          viewY,
          touchEventCoalescingKeyHelper,
      )
      return event
    }
  }
}
