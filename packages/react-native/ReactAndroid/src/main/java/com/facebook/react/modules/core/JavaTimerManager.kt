/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import android.util.SparseArray
import android.view.Choreographer
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableArray
import com.facebook.react.common.SystemClock.currentTimeMillis
import com.facebook.react.common.SystemClock.nanoTime
import com.facebook.react.common.SystemClock.uptimeMillis
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.jstasks.HeadlessJsTaskContext
import com.facebook.react.jstasks.HeadlessJsTaskEventListener
import java.util.PriorityQueue
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.Volatile
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.sign

/**
 * This class is the native implementation for JS timer execution on Android. It schedules JS timers
 * to be invoked on frame boundaries using [ReactChoreographer].
 *
 * This is used by the NativeModule [TimingModule].
 */
public open class JavaTimerManager(
    private val reactApplicationContext: ReactApplicationContext,
    private val javaScriptTimerExecutor: JavaScriptTimerExecutor,
    private val reactChoreographer: ReactChoreographer,
    private val devSupportManager: DevSupportManager,
) : LifecycleEventListener, HeadlessJsTaskEventListener {
  private class Timer(
      val timerId: Int,
      var targetTime: Long,
      val interval: Int,
      val repeat: Boolean,
  )

  private val timerGuard = Any()
  private val idleCallbackGuard = Any()
  private val timerIdsToTimers: SparseArray<Timer> = SparseArray()
  private val isPaused = AtomicBoolean(true)
  private val isRunningTasks = AtomicBoolean(false)
  private val timerFrameCallback = TimerFrameCallback()
  private val idleFrameCallback = IdleFrameCallback()
  private var currentIdleCallbackRunnable: IdleCallbackRunnable? = null
  private var frameCallbackPosted = false
  private var frameIdleCallbackPosted = false
  private var sendIdleEvents = false

  // We store timers sorted by finish time.
  private val timers: PriorityQueue<Timer> =
      PriorityQueue(TIMER_QUEUE_CAPACITY) { lhs, rhs -> (lhs.targetTime - rhs.targetTime).sign }

  init {
    reactApplicationContext.addLifecycleEventListener(this)
    HeadlessJsTaskContext.getInstance(reactApplicationContext).addTaskEventListener(this)
  }

  override fun onHostPause() {
    isPaused.set(true)
    clearFrameCallback()
    maybeIdleCallback()
  }

  override fun onHostDestroy() {
    clearFrameCallback()
    maybeIdleCallback()
  }

  override fun onHostResume() {
    isPaused.set(false)
    // TODO(5195192) Investigate possible problems related to restarting all tasks at the same
    // moment
    setChoreographerCallback()
    maybeSetChoreographerIdleCallback()
  }

  override fun onHeadlessJsTaskStart(taskId: Int) {
    if (!isRunningTasks.getAndSet(true)) {
      setChoreographerCallback()
      maybeSetChoreographerIdleCallback()
    }
  }

  override fun onHeadlessJsTaskFinish(taskId: Int) {
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactApplicationContext)
    if (!headlessJsTaskContext.hasActiveTasks()) {
      isRunningTasks.set(false)
      clearFrameCallback()
      maybeIdleCallback()
    }
  }

  public open fun onInstanceDestroy() {
    HeadlessJsTaskContext.getInstance(reactApplicationContext).removeTaskEventListener(this)
    reactApplicationContext.removeLifecycleEventListener(this)
    clearFrameCallback()
    clearChoreographerIdleCallback()
  }

  @LegacyArchitecture
  private fun maybeSetChoreographerIdleCallback() {
    synchronized(idleCallbackGuard) {
      if (sendIdleEvents) {
        setChoreographerIdleCallback()
      }
    }
  }

  @LegacyArchitecture
  private fun maybeIdleCallback() {
    if (isPaused.get() && !isRunningTasks.get()) {
      clearFrameCallback()
    }
  }

  private fun setChoreographerCallback() {
    if (!frameCallbackPosted) {
      reactChoreographer.postFrameCallback(
          ReactChoreographer.CallbackType.TIMERS_EVENTS,
          timerFrameCallback,
      )
      frameCallbackPosted = true
    }
  }

  private fun clearFrameCallback() {
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactApplicationContext)
    if (frameCallbackPosted && isPaused.get() && !headlessJsTaskContext.hasActiveTasks()) {
      reactChoreographer.removeFrameCallback(
          ReactChoreographer.CallbackType.TIMERS_EVENTS,
          timerFrameCallback,
      )
      frameCallbackPosted = false
    }
  }

  @LegacyArchitecture
  private fun setChoreographerIdleCallback() {
    if (!frameIdleCallbackPosted) {
      reactChoreographer.postFrameCallback(
          ReactChoreographer.CallbackType.IDLE_EVENT,
          idleFrameCallback,
      )
      frameIdleCallbackPosted = true
    }
  }

  @LegacyArchitecture
  private fun clearChoreographerIdleCallback() {
    if (frameIdleCallbackPosted) {
      reactChoreographer.removeFrameCallback(
          ReactChoreographer.CallbackType.IDLE_EVENT,
          idleFrameCallback,
      )
      frameIdleCallbackPosted = false
    }
  }

  /**
   * A method to be used for synchronously creating a timer. The timer will not be invoked until the
   * next frame, regardless of whether it has already expired (i.e. the delay is 0).
   *
   * @param timerId An identifier for the callback that can be passed to JS or C++ to invoke it.
   * @param delay The time in ms before the callback should be invoked.
   * @param repeat Whether the timer should be repeated (used for setInterval).
   */
  @DoNotStrip
  public open fun createTimer(timerId: Int, delay: Long, repeat: Boolean) {
    val initialTargetTime = nanoTime() / 1000000 + delay
    val timer = Timer(timerId, initialTargetTime, delay.toInt(), repeat)
    synchronized(timerGuard) {
      timers.add(timer)
      timerIdsToTimers.put(timerId, timer)
    }
  }

  /**
   * A method to be used for asynchronously creating a timer. If the timer has already expired,
   * (based on the provided jsSchedulingTime) then it will be immediately invoked.
   *
   * @param timerId An identifier that can be passed back to JS to invoke the callback.
   * @param duration The time in ms before the callback should be invoked.
   * @param jsSchedulingTime The time (ms since epoch) when this timer was created in JS.
   * @param repeat Whether the timer should be repeated (used for setInterval)
   */
  public open fun createAndMaybeCallTimer(
      timerId: Int,
      duration: Int,
      jsSchedulingTime: Double,
      repeat: Boolean,
  ) {
    val deviceTime = currentTimeMillis()
    val remoteTime = jsSchedulingTime.toLong()

    // If the times on the server and device have drifted throw an exception to warn the developer
    // that things might not work or results may not be accurate. This is required only for
    // developer builds.
    if (devSupportManager.devSupportEnabled) {
      val driftTime = abs(remoteTime - deviceTime)
      if (driftTime > 60000) {
        javaScriptTimerExecutor.emitTimeDriftWarning(
            "Debugger and device times have drifted by more than 60s. Please correct this by " +
                "running adb shell \"date `date +%m%d%H%M%Y.%S`\" on your debugger machine."
        )
      }
    }

    // Adjust for the amount of time it took for native to receive the timer registration call
    val adjustedDuration = max(0, remoteTime - deviceTime + duration)
    if (duration == 0 && !repeat) {
      val timerToCall = Arguments.createArray()
      timerToCall.pushInt(timerId)
      javaScriptTimerExecutor.callTimers(timerToCall)
      return
    }
    createTimer(timerId, adjustedDuration, repeat)
  }

  @DoNotStrip
  public open fun deleteTimer(timerId: Int) {
    synchronized(timerGuard) {
      val timer = timerIdsToTimers[timerId] ?: return
      timerIdsToTimers.remove(timerId)
      timers.remove(timer)
    }
  }

  @DoNotStrip
  @LegacyArchitecture
  public open fun setSendIdleEvents(sendIdleEvents: Boolean) {
    synchronized(idleCallbackGuard) { this.sendIdleEvents = sendIdleEvents }
    UiThreadUtil.runOnUiThread {
      synchronized(idleCallbackGuard) {
        if (sendIdleEvents) {
          setChoreographerIdleCallback()
        } else {
          clearChoreographerIdleCallback()
        }
      }
    }
  }

  /**
   * Returns a bool representing whether there are any active timers that will be fired within a
   * certain period of time. Disregards repeating timers (setInterval). Used for testing to
   * determine if RN is idle.
   *
   * @param rangeMs The time range, in ms, to check
   * @return True if there are pending timers within the given range; false otherwise
   */
  internal fun hasActiveTimersInRange(rangeMs: Long): Boolean {
    synchronized(timerGuard) {
      val nextTimer =
          timers.peek()
              ?: // Timers queue is empty
              return false
      if (isTimerInRange(nextTimer, rangeMs)) {
        // First check the next timer, so we can avoid iterating over the entire queue if it's
        // already within range.
        return true
      }
      for (timer in timers) {
        if (isTimerInRange(timer, rangeMs)) {
          return true
        }
      }
    }
    return false
  }

  private inner class TimerFrameCallback : Choreographer.FrameCallback {
    // Temporary map for constructing the individual arrays of timers to call
    private var timersToCall: WritableArray? = null

    /** Calls all timers that have expired since the last time this frame callback was called. */
    override fun doFrame(frameTimeNanos: Long) {
      if (isPaused.get() && !isRunningTasks.get()) {
        return
      }
      val frameTimeMillis = frameTimeNanos / 1000000
      synchronized(timerGuard) {
        while (!timers.isEmpty() && timers.peek()!!.targetTime < frameTimeMillis) {
          var timer = timers.poll()
          if (timer == null) {
            break
          }
          if (timersToCall == null) {
            timersToCall = Arguments.createArray()
          }
          timersToCall?.pushInt(timer.timerId)
          if (timer.repeat) {
            timer.targetTime = frameTimeMillis + timer.interval
            timers.add(timer)
          } else {
            timerIdsToTimers.remove(timer.timerId)
          }
        }
      }
      timersToCall?.let { timers ->
        javaScriptTimerExecutor.callTimers(timers)
        timersToCall = null
      }
      reactChoreographer.postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, this)
    }
  }

  private inner class IdleFrameCallback : Choreographer.FrameCallback {
    override fun doFrame(frameTimeNanos: Long) {
      if (isPaused.get() && !isRunningTasks.get()) {
        return
      }

      // If the JS thread is busy for multiple frames we cancel any other pending runnable.
      // We also capture the idleCallbackRunnable to tentatively fix:
      // https://github.com/facebook/react-native/issues/44842
      // https://github.com/facebook/react-native/issues/54983
      currentIdleCallbackRunnable?.cancel()
      val idleCallbackRunnable = IdleCallbackRunnable(frameTimeNanos)
      currentIdleCallbackRunnable = idleCallbackRunnable
      reactApplicationContext.runOnJSQueueThread(idleCallbackRunnable)
      reactChoreographer.postFrameCallback(ReactChoreographer.CallbackType.IDLE_EVENT, this)
    }
  }

  @LegacyArchitecture
  private inner class IdleCallbackRunnable(private val frameStartTime: Long) : Runnable {
    @Volatile private var isCancelled = false

    override fun run() {
      if (isCancelled) {
        return
      }
      val frameTimeMillis = frameStartTime / 1000000
      val timeSinceBoot = uptimeMillis()
      val frameTimeElapsed = timeSinceBoot - frameTimeMillis
      val time = currentTimeMillis()
      val absoluteFrameStartTime = time - frameTimeElapsed
      if (FRAME_DURATION_MS - frameTimeElapsed.toFloat() < IDLE_CALLBACK_FRAME_DEADLINE_MS) {
        return
      }
      var sendIdleEvents: Boolean
      synchronized(idleCallbackGuard) { sendIdleEvents = this@JavaTimerManager.sendIdleEvents }
      if (sendIdleEvents) {
        javaScriptTimerExecutor.callIdleCallbacks(absoluteFrameStartTime.toDouble())
      }
      currentIdleCallbackRunnable = null
    }

    fun cancel() {
      isCancelled = true
    }
  }

  private companion object {
    // These timing constants should be kept in sync with the ones in `JSTimers.js`.
    // The minimum time in milliseconds left in the frame to call idle callbacks.
    private const val IDLE_CALLBACK_FRAME_DEADLINE_MS = 1f

    // The total duration of a frame in milliseconds, this assumes that devices run at 60 fps.
    // TODO: Lower frame duration on devices that are too slow to run consistently
    // at 60 fps.
    private const val FRAME_DURATION_MS = 1000f / 60f

    private const val TIMER_QUEUE_CAPACITY = 11

    private fun isTimerInRange(timer: Timer, rangeMs: Long): Boolean =
        !timer.repeat && timer.interval < rangeMs
  }
}
