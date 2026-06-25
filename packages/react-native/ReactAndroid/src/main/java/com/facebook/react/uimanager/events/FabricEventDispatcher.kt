/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.view.Choreographer
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.systrace.Systrace
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.concurrent.Volatile

private const val TAG = "FabricEventDispatcher"

/**
 * A singleton class that overrides [EventDispatcher] with no-op methods, to be used by callers that
 * expect an EventDispatcher when the instance doesn't exist.
 *
 * While this class is Fabric-specific, it lives in the uimanager.events package to allow access to
 * Event internals.
 */
internal class FabricEventDispatcher(
    private val reactContext: ReactApplicationContext,
    private val eventEmitter: RCTModernEventEmitter,
) : EventDispatcher, LifecycleEventListener {
  private val listeners = CopyOnWriteArrayList<EventDispatcherListener>()
  private val postEventDispatchListeners = CopyOnWriteArrayList<BatchEventDispatchedListener>()
  private val currentFrameCallback = ScheduleDispatchFrameCallback()

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun dispatchEvent(event: Event<*>) {
    for (listener in listeners) {
      listener.onEventDispatch(event)
    }
    if (event.internal_experimental_isSynchronous()) {
      dispatchSynchronous(event)
    } else {
      event.dispatchModern(eventEmitter)
    }

    event.dispose()
    scheduleDispatchOfBatchedEvents()
  }

  private fun dispatchSynchronous(event: Event<*>) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT,
        "FabricEventDispatcher.dispatchSynchronous('" + event.getEventName() + "')",
    )
    try {
      val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
      @OptIn(UnstableReactNativeAPI::class)
      if (fabricUIManager is SynchronousEventReceiver) {
        (fabricUIManager as SynchronousEventReceiver).receiveEvent(
            event.surfaceId,
            event.viewTag,
            event.getEventName(),
            event.canCoalesce(),
            event.internal_getEventData(),
            event.internal_getEventCategory(),
            true,
            event.timestampMs,
        )
      } else {
        ReactSoftExceptionLogger.logSoftException(
            TAG,
            IllegalStateException(
                "Fabric UIManager expected to implement SynchronousEventReceiver."
            ),
        )
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
  }

  override fun dispatchAllEvents() {
    scheduleDispatchOfBatchedEvents()
  }

  private fun scheduleDispatchOfBatchedEvents() {
    currentFrameCallback.maybeScheduleDispatchOfBatchedEvents()
  }

  /** Add a listener to this EventDispatcher. */
  override fun addListener(listener: EventDispatcherListener) {
    listeners.add(listener)
  }

  /** Remove a listener from this EventDispatcher. */
  override fun removeListener(listener: EventDispatcherListener) {
    listeners.remove(listener)
  }

  override fun addBatchEventDispatchedListener(listener: BatchEventDispatchedListener) {
    postEventDispatchListeners.add(listener)
  }

  override fun removeBatchEventDispatchedListener(listener: BatchEventDispatchedListener) {
    postEventDispatchListeners.remove(listener)
  }

  override fun onHostResume() {
    scheduleDispatchOfBatchedEvents()
    currentFrameCallback.resume()
  }

  override fun onHostPause() {
    cancelDispatchOfBatchedEvents()
  }

  override fun onHostDestroy() {
    cancelDispatchOfBatchedEvents()
  }

  fun invalidate() {
    UiThreadUtil.runOnUiThread { cancelDispatchOfBatchedEvents() }
  }

  @Deprecated("Private API, should only be used when the concrete implementation is known.")
  override fun onCatalystInstanceDestroyed() {
    invalidate()
  }

  private fun cancelDispatchOfBatchedEvents() {
    UiThreadUtil.assertOnUiThread()
    currentFrameCallback.stop()
  }

  private inner class ScheduleDispatchFrameCallback : Choreographer.FrameCallback {
    @Volatile private var isFrameCallbackDispatchScheduled = false
    private var shouldStop = false

    override fun doFrame(frameTimeNanos: Long) {
      UiThreadUtil.assertOnUiThread()

      if (shouldStop) {
        isFrameCallbackDispatchScheduled = false
      } else {
        dispatchBatchedEvents()
      }

      Systrace.beginSection(Systrace.TRACE_TAG_REACT, "BatchEventDispatchedListeners")
      try {
        for (listener in postEventDispatchListeners) {
          listener.onBatchEventDispatched()
        }
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT)
      }
    }

    fun stop() {
      shouldStop = true
    }

    fun resume() {
      shouldStop = false
    }

    fun maybeDispatchBatchedEvents() {
      if (!isFrameCallbackDispatchScheduled) {
        isFrameCallbackDispatchScheduled = true
        dispatchBatchedEvents()
      }
    }

    private fun dispatchBatchedEvents() {
      ReactChoreographer.getInstance()
          .postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, currentFrameCallback)
    }

    fun maybeScheduleDispatchOfBatchedEvents() {
      if (isFrameCallbackDispatchScheduled) {
        return
      }

      // We should only hit this slow path when we receive events while the host activity is paused.
      if (reactContext.isOnUiQueueThread) {
        maybeDispatchBatchedEvents()
      } else {
        reactContext.runOnUiQueueThread { maybeDispatchBatchedEvents() }
      }
    }
  }
}
