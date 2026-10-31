/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.os.Handler
import android.os.Message
import androidx.annotation.UiThread
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.infer.annotation.ThreadConfined.UI
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.common.SystemClock

/**
 * Pre-mounts views in the time a frame leaves free. Once a frame's callbacks have run, it executes
 * pre-mount items in slices posted to the UI thread's looper, each of which starts items for about
 * 1 ms, and it stops at the next vsync, so the pre-mounting fits in the time the frame left idle
 * instead of delaying the frame's own work. The next frame, an input event or any other message
 * waits for one slice at most, unless a commit's mount items arrive meanwhile: the next slice
 * mounts them rather than leaving them for the next frame, and runs every pre-mount item left
 * before them, as a frame's mount does. A commit the pull model queues as a surface to pull waits
 * for the frame, which pulls it once, and while one waits, mount items wait with it, since a
 * dispatch pulls before it mounts.
 *
 * While the render thread waits on SurfaceFlinger for a buffer, the UI thread sleeps in each
 * frame's draw until the render thread takes the frame, and the frame leaves no time before the
 * next vsync. After such a frame, the next one pre-mounts before its traversal for as long as the
 * UI thread slept after the callbacks, plus what that frame pre-mounted before its own traversal,
 * less one slice, at most half a frame and half of a 30 Hz frame: the work shortens that sleep
 * instead of delaying the frame, and a frame that no longer sleeps ends it.
 *
 * Frames whose own work takes a whole frame interval, as while the UI thread is busy past every
 * vsync, leave no time at all, and a commit's mount would run every item still waiting. Once two
 * frames in a row have taken one, each frame pre-mounts before its traversal for half a frame, at
 * most half of a 30 Hz frame, so pre-mounting still advances while the frames stay busy, and one
 * busy frame costs the next nothing. A frame's own work is timed from its vsync, or from the end of
 * the frame before it if that came later, and leaves out what it pre-mounted before its traversal,
 * so the time it spends pre-mounting never keeps the run going, and the first frame whose own work
 * fits its interval ends it.
 *
 * A frame that left time gets no time before the next traversal, and neither does a frame after a
 * vsync that ran no frame callback, as while the callback is not re-armed with nothing to mount.
 * Slices run only while the frame callback would mount: not once mounting has failed or the UI
 * manager is destroyed.
 */
internal class PreMountItemsBetweenFrames(
    private val dispatcher: MountItemDispatcher,
    private val frameIntervalSource: FrameIntervalSource,
    private val threadCpuClock: ThreadCpuClock,
    private val mountingGate: MountingGate,
    private val uiThreadHandler: Handler,
    exceptionHandler: JSExceptionHandler,
) {
  private var nextFrameNanos: Long = 0L
  private var frameIntervalNanos: Long = SIXTY_HERTZ_FRAME_NANOS
  private var isSliceQueued: Boolean = false
  private var unmeasuredFrame: UnmeasuredFrame? = null
  private var beforeTraversalBudget: BeforeTraversalBudget? = null
  private var preMountedBeforeTraversalNanos: Long = 0L
  private var lastMeasuredFrameEndNanos: Long = 0L
  private var lastFrameTookItsInterval: Boolean = false
  private val slice: Runnable =
      object : GuardedRunnable(exceptionHandler) {
        override fun runGuarded() {
          isSliceQueued = false
          runSlice()
        }
      }

  /**
   * Pre-mounts before this frame's traversal for the budget the last frame left it, unless a vsync
   * has passed since that frame was measured.
   */
  @UiThread
  @ThreadConfined(UI)
  fun preMountBeforeTraversal() {
    val budget = beforeTraversalBudget
    beforeTraversalBudget = null
    preMountedBeforeTraversalNanos = 0L
    if (budget == null || !dispatcher.hasPreMountItems()) {
      return
    }
    val startNanos = SystemClock.nanoTime()
    if (startNanos - budget.measuredAtNanos > frameIntervalNanos) {
      lastFrameTookItsInterval = false
      return
    }
    dispatcher.dispatchPreMountItemsUntil(startNanos + budget.nanos)
    preMountedBeforeTraversalNanos = SystemClock.nanoTime() - startNanos
  }

  /** Queues pre-mounting after the frame that started at [frameTimeNanos], until the next one. */
  @UiThread
  @ThreadConfined(UI)
  fun scheduleAfterFrame(frameTimeNanos: Long) {
    if (!dispatcher.hasPreMountItems() && preMountedBeforeTraversalNanos == 0L) {
      lastFrameTookItsInterval = false
      return
    }
    frameIntervalNanos = frameIntervalSource.frameIntervalNanos() ?: SIXTY_HERTZ_FRAME_NANOS
    if (dispatcher.hasPreMountItems()) {
      frameIntervalSource.requestNextFrameInterval()
    }
    nextFrameNanos = frameTimeNanos + frameIntervalNanos
    unmeasuredFrame =
        UnmeasuredFrame(
            startNanos = maxOf(frameTimeNanos, lastMeasuredFrameEndNanos),
            callbacksEndNanos = SystemClock.nanoTime(),
            callbacksEndThreadCpuNanos = threadCpuClock.threadCpuTimeNanos(),
        )
    queueSlice()
  }

  @UiThread
  @ThreadConfined(UI)
  fun cancel() {
    uiThreadHandler.removeCallbacks(slice)
    frameIntervalSource.cancel()
    isSliceQueued = false
    unmeasuredFrame = null
    beforeTraversalBudget = null
    lastFrameTookItsInterval = false
  }

  /**
   * The next frame's budget before its traversal, after a frame that left no time before the next
   * vsync: half a frame once that frame and the one before it each took a frame interval of their
   * own work; otherwise how long the UI thread slept between the frame's callbacks and its end,
   * plus what it pre-mounted before its traversal, which that sleep absorbed, less one slice. A
   * frame that left time gets none, and so does one that slept less than half a slice or whose
   * thread clock cannot tell, unless it ends a run of busy frames.
   */
  private fun measureBeforeTraversalBudget(
      frame: UnmeasuredFrame,
      nowNanos: Long,
  ): BeforeTraversalBudget? {
    lastMeasuredFrameEndNanos = nowNanos
    if (nowNanos < nextFrameNanos) {
      lastFrameTookItsInterval = false
      return null
    }
    val tookItsInterval =
        nowNanos - frame.startNanos - preMountedBeforeTraversalNanos >= frameIntervalNanos
    val endsARunOfBusyFrames = tookItsInterval && lastFrameTookItsInterval
    lastFrameTookItsInterval = tookItsInterval
    val halfFrameNanos = minOf(frameIntervalNanos / 2, MAX_BEFORE_TRAVERSAL_NANOS)
    val budgetNanos =
        if (endsARunOfBusyFrames) {
          halfFrameNanos
        } else {
          val asleepNanos = measureAsleepNanos(frame, nowNanos)
          if (asleepNanos < SLICE_NANOS / 2) {
            return null
          }
          minOf(halfFrameNanos, asleepNanos + preMountedBeforeTraversalNanos - SLICE_NANOS)
        }
    return if (budgetNanos > 0L) BeforeTraversalBudget(budgetNanos, nowNanos) else null
  }

  /**
   * How long the UI thread slept between the frame's callbacks and [nowNanos], or zero where its
   * clock cannot tell.
   */
  private fun measureAsleepNanos(frame: UnmeasuredFrame, nowNanos: Long): Long {
    val threadCpuNanos = threadCpuClock.threadCpuTimeNanos()
    if (threadCpuNanos < 0L || frame.callbacksEndThreadCpuNanos < 0L) {
      return 0L
    }
    return (nowNanos - frame.callbacksEndNanos) -
        (threadCpuNanos - frame.callbacksEndThreadCpuNanos)
  }

  private fun runSlice() {
    if (!mountingGate.isMountingAllowed()) {
      return
    }
    val sliceStartNanos = SystemClock.nanoTime()
    unmeasuredFrame?.let { frame ->
      unmeasuredFrame = null
      beforeTraversalBudget = measureBeforeTraversalBudget(frame, sliceStartNanos)
    }
    if (hasMountItemsForASlice()) {
      dispatcher.tryDispatchMountItems()
      queueSliceWhileWorkIsLeft(dispatcher.hasPreMountItems())
      return
    }
    if (sliceStartNanos >= nextFrameNanos) {
      return
    }
    val preMountItemsLeft =
        dispatcher.dispatchPreMountItemsUntil(minOf(nextFrameNanos, sliceStartNanos + SLICE_NANOS))
    queueSliceWhileWorkIsLeft(preMountItemsLeft)
  }

  private fun queueSliceWhileWorkIsLeft(preMountItemsLeft: Boolean) {
    if (
        (preMountItemsLeft || hasMountItemsForASlice()) && SystemClock.nanoTime() < nextFrameNanos
    ) {
      queueSlice()
    }
  }

  /** Mount items a slice may dispatch: none while a surface waits to be pulled before them. */
  private fun hasMountItemsForASlice(): Boolean =
      dispatcher.hasMountItems() && !dispatcher.hasSurfaceIdsToPull()

  private fun queueSlice() {
    if (!isSliceQueued) {
      isSliceQueued = true
      // Asynchronous, like the Choreographer's vsync: a view that invalidates while it draws, such
      // as a ScrollView during a fling, leaves the next frame's traversal barrier in the queue
      // between frames, and an ordinary message would wait behind it until that frame.
      uiThreadHandler.sendMessage(
          Message.obtain(uiThreadHandler, slice).apply { isAsynchronous = true }
      )
    }
  }

  /**
   * A frame its first slice has yet to measure: when it started, and where its callbacks ended, on
   * the wall clock and on the UI thread's CPU clock.
   */
  private class UnmeasuredFrame(
      val startNanos: Long,
      val callbacksEndNanos: Long,
      val callbacksEndThreadCpuNanos: Long,
  )

  /**
   * How long to pre-mount before the next traversal, and when the frame it follows was measured.
   */
  private class BeforeTraversalBudget(val nanos: Long, val measuredAtNanos: Long)

  fun interface FrameIntervalSource {
    /** The interval the frames run at, or null while none is known. */
    fun frameIntervalNanos(): Long?

    /** Asks the source to read the interval off the next frame, where it reads frames at all. */
    @UiThread fun requestNextFrameInterval() = Unit

    /** Drops anything the source asked of the frames to come. */
    @UiThread fun cancel() = Unit
  }

  fun interface ThreadCpuClock {
    /**
     * The CPU time the calling thread has run for, which stops while it sleeps, or a negative value
     * where the system cannot tell, as `Debug.threadCpuTimeNanos()` reports.
     */
    fun threadCpuTimeNanos(): Long
  }

  fun interface MountingGate {
    /** Whether the frame callback would mount now: not once mounting failed or after teardown. */
    fun isMountingAllowed(): Boolean
  }

  private companion object {
    /**
     * How long a slice pre-mounts before it yields to the looper. It bounds how late the next frame
     * can start when the reported frame interval is longer than the one the frames run at.
     */
    private const val SLICE_NANOS: Long = 1_000_000L

    /** However long a frame the display reports, pre-mounting before a traversal stops here. */
    private const val MAX_BEFORE_TRAVERSAL_NANOS: Long = 1_000_000_000L / 30 / 2
  }
}
