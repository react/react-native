/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewTreeObserver
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.systrace.Systrace
import java.util.ArrayDeque

/** Experimental UI-thread cleanup, gated on a draw rather than ReactChoreographer.IDLE_EVENT. */
internal class DeferredViewCleanupQueue {
  private val handler = Handler(Looper.getMainLooper())

  private class Task(
      val afterDraw: Long,
      val estimatedOperations: Int,
      val step: () -> Boolean,
  ) {
    val traceId = nextTaskId++
  }

  internal companion object {
    // Queue operations are confined to the UI thread, including task ID allocation.
    private var nextTaskId = 0
    const val MAX_PENDING_OPERATIONS = 2048
    const val MAX_PENDING_TASKS = 8
  }

  private val tasks = ArrayDeque<Task>()
  private var pendingOperations = 0
  private var drawGeneration = 0L
  private var root: View? = null
  private var observer: ViewTreeObserver? = null
  private var posted = false

  internal val size: Int
    get() = tasks.size

  internal fun hasCapacityFor(estimatedOperations: Int): Boolean =
      tasks.size < MAX_PENDING_TASKS &&
          estimatedOperations > 0 &&
          estimatedOperations <= MAX_PENDING_OPERATIONS &&
          pendingOperations <= MAX_PENDING_OPERATIONS - estimatedOperations

  private val afterDraw: Runnable = Runnable {
    removeDrawListener()
    handler.removeCallbacks(checkVisibility)
    posted = false
    drainSlice()
  }

  private val drawListener =
      ViewTreeObserver.OnDrawListener {
        drawGeneration++
        if (!posted) {
          posted = true
          // onDraw runs inside traversal. Posting moves cleanup outside that traversal; this does
          // not imply that the GPU has finished presenting the frame.
          handler.post(afterDraw)
        }
      }

  private val checkVisibility =
      object : Runnable {
        override fun run() {
          val view = root ?: return
          if (!view.isAttachedToWindow || !view.isShown || view.windowVisibility != View.VISIBLE) {
            handler.removeCallbacks(afterDraw)
            removeDrawListener()
            posted = false
            drainSlice(requireDraw = false)
          } else {
            // A detach/reattach can replace (and kill) the observer while work is pending.
            if (observer?.isAlive != true && !posted) {
              removeDrawListener()
              observer = view.viewTreeObserver.also { it.addOnDrawListener(drawListener) }
            }
            // A visible surface must cross a draw boundary. Do not replace that guarantee with a
            // timeout on a slow frame. Hidden/detached surfaces have no frame to protect.
            view.postInvalidateOnAnimation()
            handler.postDelayed(this, 100)
          }
        }
      }

  /** Each invocation performs one bounded unit and returns true once its task is complete. */
  internal fun enqueue(view: View, estimatedOperations: Int = 1, step: () -> Boolean) {
    UiThreadUtil.assertOnUiThread()
    check(hasCapacityFor(estimatedOperations)) {
      "Deferred cleanup operation budget exceeded: $estimatedOperations"
    }
    val task = Task(drawGeneration + 1, estimatedOperations, step)
    tasks.addLast(task)
    pendingOperations += estimatedOperations
    tracePendingWork()
    Systrace.beginAsyncSection(
        Systrace.TRACE_TAG_REACT,
        "FabricDeferredCleanup::task",
        task.traceId,
    )
    if (root == null) {
      root = view
      awaitDraw()
    }
  }

  internal fun flush() {
    UiThreadUtil.assertOnUiThread()
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "FabricDeferredCleanup::flush")
    try {
      handler.removeCallbacks(afterDraw)
      handler.removeCallbacks(checkVisibility)
      removeDrawListener()
      posted = false
      while (tasks.isNotEmpty()) {
        val task = tasks.first
        if (task.step() && tasks.peekFirst() === task) complete(task)
      }
      root = null
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
  }

  private fun awaitDraw() {
    val view = checkNotNull(root)
    observer = view.viewTreeObserver.also { it.addOnDrawListener(drawListener) }
    view.postInvalidateOnAnimation()
    handler.postDelayed(checkVisibility, 100)
  }

  private fun complete(task: Task) {
    tasks.removeFirst()
    pendingOperations -= task.estimatedOperations
    tracePendingWork()
    Systrace.endAsyncSection(Systrace.TRACE_TAG_REACT, "FabricDeferredCleanup::task", task.traceId)
  }

  private fun tracePendingWork() {
    Systrace.traceCounter(
        Systrace.TRACE_TAG_REACT,
        "FabricDeferredCleanup::pendingTasks",
        tasks.size,
    )
    // Reservations stay live until the task releases its captured view states. They are not a
    // count of unfinished steps; production unmount plans reserve two operations per state.
    Systrace.traceCounter(
        Systrace.TRACE_TAG_REACT,
        "FabricDeferredCleanup::reservedOperations",
        pendingOperations,
    )
  }

  private fun removeDrawListener() {
    observer?.let { if (it.isAlive) it.removeOnDrawListener(drawListener) }
    // Android migrates listeners from a dead observer to the new window's observer.
    root?.viewTreeObserver?.let {
      if (it !== observer && it.isAlive) it.removeOnDrawListener(drawListener)
    }
    observer = null
  }

  private fun drainSlice(requireDraw: Boolean = true) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "FabricDeferredCleanup::slice")
    var operations = 0
    try {
      val deadline = System.nanoTime() + 1_000_000L
      do {
        val task = tasks.peekFirst() ?: break
        if (requireDraw && task.afterDraw > drawGeneration) break
        // Detachment listeners can synchronously stop the surface and flush this queue.
        if (task.step() && tasks.peekFirst() === task) complete(task)
        operations++
      } while (operations < 256 && System.nanoTime() < deadline)
    } finally {
      Systrace.traceCounter(
          Systrace.TRACE_TAG_REACT,
          "FabricDeferredCleanup::operations",
          operations,
      )
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
    if (tasks.isEmpty()) root = null else awaitDraw()
  }
}
