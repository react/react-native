/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.view.KeyEvent
import android.view.MotionEvent
import androidx.core.util.Pools.SynchronizedPool
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.TouchTargetHelper.ViewTarget
import com.facebook.react.uimanager.events.Event.EventAnimationDriverMatchSpec
import com.facebook.react.uimanager.events.PointerEventHelper.getButtonChange
import com.facebook.react.uimanager.events.PointerEventHelper.getButtons
import com.facebook.react.uimanager.events.PointerEventHelper.getEventCategory
import com.facebook.react.uimanager.events.PointerEventHelper.getPressure
import com.facebook.react.uimanager.events.PointerEventHelper.getW3CPointerType
import com.facebook.react.uimanager.events.PointerEventHelper.isBubblingEvent

internal class PointerEvent private constructor() : Event<PointerEvent>() {
  private var motionEvent: MotionEvent? = null
  private lateinit var _eventName: String
  private var coalescingKey = UNSET_COALESCING_KEY
  private var pointersEventData: List<WritableMap>? = null
  private var eventState: PointerEventState? = null
  private var activeHitPathViewIds: List<Int>? = null

  private fun init(
      eventName: String,
      targetTag: Int,
      eventState: PointerEventState,
      motionEventToCopy: MotionEvent,
      coalescingKey: Short,
      activeHitPathViewIds: List<Int>?,
  ) {
    super.init(eventState.getSurfaceId(), targetTag, motionEventToCopy.eventTime)
    this._eventName = eventName
    this.motionEvent = MotionEvent.obtain(motionEventToCopy)
    this.coalescingKey = coalescingKey
    this.eventState = eventState
    this.activeHitPathViewIds = activeHitPathViewIds
  }

  override fun getEventName(): String = _eventName

  private val isClickEvent: Boolean
    get() = _eventName == PointerEventHelper.CLICK

  @Deprecated("Prefer to override getEventData instead")
  @Suppress("DEPRECATION")
  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    if (motionEvent == null) {
      logSoftException(
          TAG,
          IllegalStateException(
              "Cannot dispatch a Pointer that has no MotionEvent; the PointerEvent has been" +
                  " recycled"
          ),
      )
      return
    }
    if (pointersEventData == null) {
      pointersEventData = createPointersEventData()
    }

    val data = pointersEventData ?: return // No relevant MotionEvent to dispatch

    val shouldCopy = data.size > 1
    for (pointerEventData in data) {
      val eventData = if (shouldCopy) pointerEventData.copy() else pointerEventData
      rctEventEmitter.receiveEvent(viewTag, _eventName, eventData)
    }
    return
  }

  override val eventAnimationDriverMatchSpec: EventAnimationDriverMatchSpec by
      lazy(LazyThreadSafetyMode.NONE) {
        EventAnimationDriverMatchSpec { viewTag, eventName ->
          if (eventName != _eventName) {
            return@EventAnimationDriverMatchSpec false
          }
          if (isBubblingEvent(eventName)) {
            for (viewTarget in checkNotNull(eventState).hitPathForActivePointer) {
              if (viewTarget.getViewId() == viewTag) {
                return@EventAnimationDriverMatchSpec true
              }
            }
            false
          } else {
            this.viewTag == viewTag
          }
        }
      }

  override fun onDispose() {
    eventState = null
    pointersEventData = null
    motionEvent?.recycle()
    motionEvent = null

    // Either `this` is in the event pool, or motionEvent
    // is null. It is in theory not possible for a PointerEvent to
    // be in the EVENTS_POOL but for motionEvent to be null. However,
    // out of an abundance of caution and to avoid memory leaks or
    // other crashes at all costs, we attempt to release here and log
    // a soft exception here if release throws an IllegalStateException
    // due to `this` being over-released. This may indicate that there is
    // a logic error in our events system or pooling mechanism.
    try {
      EVENTS_POOL.release(this)
    } catch (e: IllegalStateException) {
      logSoftException(TAG, e)
    }
  }

  private fun createW3CPointerEvents(): List<WritableMap> {
    val w3cPointerEvents = ArrayList<WritableMap>()
    for (index in 0..<checkNotNull(motionEvent).pointerCount) {
      w3cPointerEvents.add(createW3CPointerEvent(index))
    }

    return w3cPointerEvents
  }

  private fun addModifierKeyData(pointerEvent: WritableMap, modifierKeyMask: Int) {
    pointerEvent.putBoolean("ctrlKey", (modifierKeyMask and KeyEvent.META_CTRL_ON) != 0)
    pointerEvent.putBoolean("shiftKey", (modifierKeyMask and KeyEvent.META_SHIFT_ON) != 0)
    pointerEvent.putBoolean("altKey", (modifierKeyMask and KeyEvent.META_ALT_ON) != 0)
    pointerEvent.putBoolean("metaKey", (modifierKeyMask and KeyEvent.META_META_ON) != 0)
  }

  private fun createW3CPointerEvent(index: Int): WritableMap {
    val pointerEvent = Arguments.createMap()
    val motionEvent = checkNotNull(motionEvent)
    val pointerId = motionEvent.getPointerId(index)
    val eventState = checkNotNull(eventState)

    // https://www.w3.org/TR/pointerevents/#pointerevent-interface
    pointerEvent.putDouble("pointerId", pointerId.toDouble())

    val pointerType = getW3CPointerType(motionEvent.getToolType(index))
    pointerEvent.putString("pointerType", pointerType)

    val isPrimary =
        !isClickEvent // compatibility click events should not be considered primary
        && (eventState.supportsHover(pointerId) || pointerId == eventState.primaryPointerId)
    pointerEvent.putBoolean("isPrimary", isPrimary)

    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
    // Client refers to upper left edge of the content area (viewport)
    // We define the viewport to be ReactRootView
    val eventCoords = checkNotNull(eventState.eventCoordinatesByPointerId[pointerId])
    val clientX = toDIPFromPixel(eventCoords[0]).toDouble()
    val clientY = toDIPFromPixel(eventCoords[1]).toDouble()
    pointerEvent.putDouble("clientX", clientX)
    pointerEvent.putDouble("clientY", clientY)

    val screenCoords = checkNotNull(eventState.screenCoordinatesByPointerId[pointerId])
    val screenX = toDIPFromPixel(screenCoords[0]).toDouble()
    val screenY = toDIPFromPixel(screenCoords[1]).toDouble()
    pointerEvent.putDouble("screenX", screenX)
    pointerEvent.putDouble("screenY", screenY)

    // x,y values are aliases of clientX, clientY
    pointerEvent.putDouble("x", clientX)
    pointerEvent.putDouble("y", clientY)

    // page values in react-native are equivalent to client values since rootview is not scrollable
    pointerEvent.putDouble("pageX", clientX)
    pointerEvent.putDouble("pageY", clientY)

    // Offset refers to upper left edge of the target view
    val offsetCoords = checkNotNull(eventState.offsetByPointerId[pointerId])
    pointerEvent.putDouble("offsetX", toDIPFromPixel(offsetCoords[0]).toDouble())
    pointerEvent.putDouble("offsetY", toDIPFromPixel(offsetCoords[1]).toDouble())

    pointerEvent.putInt("target", viewTag)
    pointerEvent.putDouble("timestamp", timestampMs.toDouble())

    pointerEvent.putInt("detail", 0)
    pointerEvent.putDouble("tiltX", 0.0)
    pointerEvent.putDouble("tiltY", 0.0)

    pointerEvent.putInt("twist", 0)
    // note: click events should have width = height = 1
    if (pointerType == PointerEventHelper.POINTER_TYPE_MOUSE || isClickEvent) {
      pointerEvent.putDouble("width", 1.0)
      pointerEvent.putDouble("height", 1.0)
    } else {
      val majorAxis = toDIPFromPixel(motionEvent.getTouchMajor(index))
      pointerEvent.putDouble("width", majorAxis.toDouble())
      pointerEvent.putDouble("height", majorAxis.toDouble())
    }

    val buttonState = motionEvent.buttonState
    pointerEvent.putInt(
        "button",
        getButtonChange(pointerType, eventState.lastButtonState, buttonState),
    )
    pointerEvent.putInt("buttons", getButtons(_eventName, pointerType, buttonState))

    val pressure =
        if (isClickEvent) {
          0.0 // click events need pressure=0
        } else {
          getPressure(pointerEvent.getInt("buttons"), _eventName)
        }

    pointerEvent.putDouble("pressure", pressure)
    pointerEvent.putDouble("tangentialPressure", 0.0)

    if (activeHitPathViewIds != null) {
      pointerEvent.putArray(
          "hitPathForEventListener",
          Arguments.makeNativeArray(activeHitPathViewIds),
      )
    }

    addModifierKeyData(pointerEvent, motionEvent.metaState)

    return pointerEvent
  }

  private fun createPointersEventData(): List<WritableMap>? {
    val activePointerIndex = checkNotNull(motionEvent).actionIndex
    var pointersEventData: List<WritableMap>? = null
    when (_eventName) {
      PointerEventHelper.POINTER_MOVE,
      PointerEventHelper.POINTER_CANCEL -> {
        pointersEventData = createW3CPointerEvents()
      }
      PointerEventHelper.POINTER_ENTER,
      PointerEventHelper.POINTER_DOWN,
      PointerEventHelper.POINTER_UP,
      PointerEventHelper.POINTER_LEAVE,
      PointerEventHelper.POINTER_OUT,
      PointerEventHelper.POINTER_OVER,
      PointerEventHelper.CLICK -> {
        pointersEventData = listOf(createW3CPointerEvent(activePointerIndex))
      }
    }
    return pointersEventData
  }

  override fun getCoalescingKey(): Short = coalescingKey

  override fun dispatchModern(rctEventEmitter: RCTModernEventEmitter) {
    if (motionEvent == null) {
      logSoftException(
          TAG,
          IllegalStateException(
              "Cannot dispatch a Pointer that has no MotionEvent; the PointerEvent has been recycled"
          ),
      )
      return
    }

    if (pointersEventData == null) {
      pointersEventData = createPointersEventData()
    }

    if (pointersEventData == null) {
      // No relevant MotionEvent to dispatch
      return
    }

    val pointersEventData = checkNotNull(pointersEventData)
    val shouldCopy = pointersEventData.size > 1
    for (singleData in pointersEventData) {
      val eventData = if (shouldCopy) singleData.copy() else singleData
      rctEventEmitter.receiveEvent(
          surfaceId,
          viewTag,
          _eventName,
          coalescingKey != UNSET_COALESCING_KEY,
          coalescingKey.toInt(),
          eventData,
          getEventCategory(_eventName),
          timestampMs,
      )
    }
  }

  class PointerEventState(
      val primaryPointerId: Int,
      val activePointerId: Int,
      val lastButtonState: Int,
      private val surfaceId: Int,
      val offsetByPointerId: Map<Int, FloatArray>,
      val hitPathByPointerId: Map<Int, List<ViewTarget>>,
      val eventCoordinatesByPointerId: Map<Int, FloatArray>,
      val screenCoordinatesByPointerId: Map<Int, FloatArray>,
      hoveringPointerIds: Set<Int>,
  ) {
    val hoveringPointerIds: Set<Int> = HashSet(hoveringPointerIds)

    fun getSurfaceId(): Int = surfaceId

    fun supportsHover(pointerId: Int): Boolean = hoveringPointerIds.contains(pointerId)

    val hitPathForActivePointer: List<ViewTarget>
      get() = checkNotNull(hitPathByPointerId[activePointerId])

    val hitPathViewIdsForActivePointer: List<Int>
      get() = checkNotNull(hitPathByPointerId[activePointerId]).map { it.getViewId() }
  }

  companion object {
    private val TAG: String = PointerEvent::class.java.simpleName
    private const val POINTER_EVENTS_POOL_SIZE = 6
    private val EVENTS_POOL = SynchronizedPool<PointerEvent>(POINTER_EVENTS_POOL_SIZE)
    private const val UNSET_COALESCING_KEY: Short = -1

    @JvmStatic
    fun obtain(
        eventName: String,
        targetTag: Int,
        eventState: PointerEventState,
        motionEventToCopy: MotionEvent?,
    ): PointerEvent = obtain(eventName, targetTag, eventState, motionEventToCopy, null)

    @JvmStatic
    fun obtain(
        eventName: String,
        targetTag: Int,
        eventState: PointerEventState,
        motionEventToCopy: MotionEvent?,
        activeHitPathViewIds: List<Int>?,
    ): PointerEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = PointerEvent()
      }
      event.init(
          eventName,
          targetTag,
          eventState,
          Assertions.assertNotNull(motionEventToCopy),
          0.toShort(),
          activeHitPathViewIds,
      )
      return event
    }

    @JvmStatic
    fun obtain(
        eventName: String,
        targetTag: Int,
        eventState: PointerEventState,
        motionEventToCopy: MotionEvent?,
        coalescingKey: Short,
    ): PointerEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = PointerEvent()
      }
      event.init(
          eventName,
          targetTag,
          eventState,
          Assertions.assertNotNull(motionEventToCopy),
          coalescingKey,
          null,
      )
      return event
    }
  }
}
