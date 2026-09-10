/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import android.view.Choreographer
import androidx.annotation.GuardedBy
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.internal.ChoreographerProvider
import java.util.ArrayDeque

/**
 * A simple wrapper around Choreographer that allows us to control the order certain callbacks are
 * executed within a given frame. The wrapped Choreographer instance will always be the main thread
 * one and the API's are safe to use from any thread.
 */
public class ReactChoreographer private constructor(choreographerProvider: ChoreographerProvider) {
  public enum class CallbackType(internal val order: Int) {
    /** For use by perf markers that need to happen immediately after draw */
    PERF_MARKERS(0),
    /** For use by [com.facebook.react.bridge.UIManager] */
    DISPATCH_UI(1),
    /** For use by [com.facebook.react.animated.NativeAnimatedModule] */
    NATIVE_ANIMATED_MODULE(2),
    /** Events that make JS do things. */
    TIMERS_EVENTS(3),
    /**
     * Event used to trigger the idle callback. Called after all UI work has been dispatched to JS.
     */
    IDLE_EVENT(4),
  }

  private var choreographer: ChoreographerProvider.Choreographer? = null
  private val callbackQueues: Array<ArrayDeque<Choreographer.FrameCallback>> =
      Array(CallbackType.entries.size) { ArrayDeque() }
  private var totalCallbacks = 0
  @GuardedBy("callbackQueues") private var hasPostedCallback = false

  private val frameCallback =
      Choreographer.FrameCallback { frameTimeNanos ->
        synchronized(callbackQueues) {
          // Callbacks run once and are then automatically removed, the callback will
          // be posted again from postFrameCallback
          hasPostedCallback = false
          for (i in callbackQueues.indices) {
            val callbackQueue = callbackQueues[i]
            val initialLength = callbackQueue.size
            for (callback in 0 until initialLength) {
              val frameCallback = callbackQueue.pollFirst()
              if (frameCallback != null) {
                frameCallback.doFrame(frameTimeNanos)
                totalCallbacks--
              } else {
                FLog.e(ReactConstants.TAG, "Tried to execute non-existent frame callback")
              }
            }
          }
          maybeRemoveFrameCallback()
        }
      }

  init {
    UiThreadUtil.runOnUiThread { choreographer = choreographerProvider.getChoreographer() }
  }

  public fun postFrameCallback(type: CallbackType, callback: Choreographer.FrameCallback) {
    synchronized(callbackQueues) {
      callbackQueues[type.order].addLast(callback)
      totalCallbacks++
      Assertions.assertCondition(totalCallbacks > 0)
      postFrameCallbackOnChoreographer()
    }
  }

  public fun removeFrameCallback(type: CallbackType, frameCallback: Choreographer.FrameCallback?) {
    synchronized(callbackQueues) {
      if (callbackQueues[type.order].removeFirstOccurrence(frameCallback)) {
        totalCallbacks--
        maybeRemoveFrameCallback()
      } else {
        FLog.e(ReactConstants.TAG, "Tried to remove non-existent frame callback")
      }
    }
  }

  /**
   * This method writes [hasPostedCallback] and it should be called from another method that has the
   * lock on [callbackQueues].
   */
  private fun postFrameCallbackOnChoreographer() {
    if (!hasPostedCallback) {
      val choreographer = choreographer
      if (choreographer == null) {
        // Schedule on the main thread, at which point the constructor's async work will have
        UiThreadUtil.runOnUiThread {
          synchronized(callbackQueues) { postFrameCallbackOnChoreographer() }
        }
      } else {
        choreographer.postFrameCallback(frameCallback)
        hasPostedCallback = true
      }
    }
  }

  /**
   * This method reads and writes on mHasPostedCallback and it should be called from another method
   * that already has the lock on [callbackQueues].
   */
  private fun maybeRemoveFrameCallback() {
    Assertions.assertCondition(totalCallbacks >= 0)
    if (totalCallbacks == 0 && hasPostedCallback) {
      choreographer?.removeFrameCallback(frameCallback)
      hasPostedCallback = false
    }
  }

  public companion object {
    private var choreographer: ReactChoreographer? = null

    @JvmStatic
    public fun initialize(choreographerProvider: ChoreographerProvider) {
      if (choreographer == null) {
        choreographer = ReactChoreographer(choreographerProvider)
      }
    }

    @JvmStatic
    public fun getInstance(): ReactChoreographer =
        checkNotNull(choreographer) { "ReactChoreographer needs to be initialized." }

    @VisibleForTesting
    internal fun overrideInstanceForTest(instance: ReactChoreographer?): ReactChoreographer? =
        choreographer.also { choreographer = instance }
  }
}
