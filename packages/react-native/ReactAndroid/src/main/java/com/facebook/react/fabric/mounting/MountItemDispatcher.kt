/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.os.SystemClock
import android.view.View
import androidx.annotation.UiThread
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.infer.annotation.ThreadConfined.UI
import com.facebook.react.bridge.ReactIgnorableMountingException
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.RetryableMountingLayerException
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.tracing.PerformanceTracer
import com.facebook.systrace.Systrace
import java.util.Queue
import java.util.concurrent.ConcurrentLinkedQueue

internal class MountItemDispatcher(
    private val mountingManager: MountingManager,
    private val itemDispatchListener: ItemDispatchListener,
) {
  private val viewCommandMountItems: Queue<DispatchCommandMountItem> = ConcurrentLinkedQueue()
  private val mountItems: Queue<MountItem> = ConcurrentLinkedQueue()
  private val preMountItems: Queue<MountItem> = ConcurrentLinkedQueue()

  private var inDispatch: Boolean = false
  var batchedExecutionTime: Long = 0L
    private set

  var runStartTime: Long = 0L
    private set

  private var lastFrameTimeNanos: Long = 0L

  fun addViewCommandMountItem(mountItem: DispatchCommandMountItem) {
    if (!ReactNativeFeatureFlags.disableEarlyViewCommandExecution()) {
      viewCommandMountItems.add(mountItem)
    } else {
      mountItems.add(mountItem)
    }
  }

  fun addMountItem(mountItem: MountItem) {
    mountItems.add(mountItem)
  }

  fun addPreAllocateMountItem(mountItem: MountItem) {
    // We do this check only for PreAllocateViewMountItem - and not DispatchMountItem or regular
    // MountItem - because PreAllocateViewMountItems are not batched, and is relatively more
    // expensive
    // both to queue, to drain, and to execute.
    if (!mountingManager.surfaceIsStopped(mountItem.getSurfaceId())) {
      preMountItems.add(mountItem)
    } else if (FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT) {
      FLog.e(
          TAG,
          "Not queueing PreAllocateMountItem: surfaceId stopped: [%d] - %s",
          mountItem.getSurfaceId(),
          mountItem.toString(),
      )
    }
  }

  /**
   * Try to dispatch MountItems. In case of the exception, we will retry 10 times before giving up.
   */
  @UiThread
  @ThreadConfined(UI)
  fun tryDispatchMountItems() {
    // If we're already dispatching, don't reenter.
    // Reentrance can potentially happen a lot on Android in Fabric because `updateState` from the
    // mounting layer causes mount items to be dispatched synchronously. We want to 1) make sure we
    // don't reenter in those cases, but 2) still execute those queued instructions synchronously.
    // This is a pretty blunt tool, but we might not have better options since we really don't want
    // to execute anything out-of-order.
    if (inDispatch) {
      return
    }

    inDispatch = true

    try {
      dispatchMountItems()
    } finally {
      // Clean up after running dispatchMountItems - even if an exception was thrown
      inDispatch = false
    }

    // We call didDispatchMountItems regardless of whether we actually dispatched anything, since
    // NativeAnimatedModule relies on this for executing any animations that may have been
    // scheduled
    itemDispatchListener.didDispatchMountItems()
  }

  @UiThread
  @ThreadConfined(UI)
  fun dispatchMountItems(mountItems: Queue<MountItem?>) {
    while (!mountItems.isEmpty()) {
      val item = requireNotNull(mountItems.poll()) { "MountItem should not be null" }
      try {
        item.execute(mountingManager)
      } catch (e: RetryableMountingLayerException) {
        if (item is DispatchCommandMountItem) {
          // Only DispatchCommandMountItem supports retries
          val mountItem: DispatchCommandMountItem = item as DispatchCommandMountItem
          // Retrying exactly once
          if (mountItem.getRetries() == 0) {
            mountItem.incrementRetries()
            // In case we haven't retried executing this item yet, execute in the next batch of
            // items
            addViewCommandMountItem(mountItem)
          }
        } else if (ReactNativeFeatureFlags.enableFabricLogs()) {
          printMountItem(item, "dispatchExternalMountItems: mounting failed with ${e.message}")
        }
      }
    }
  }

  /*
   * Executes view commands, pre mount items and mount items in the respective order:
   * 1. View commands.
   * 2. Pre mount items.
   * 3. Regular mount items.
   *
   * Does nothing if `viewCommandMountItemsToDispatch` and `mountItemsToDispatch` are empty.
   * Nothing should call this directly except for `tryDispatchMountItems`.
   */
  @UiThread
  @ThreadConfined(UI)
  private fun dispatchMountItems() {
    batchedExecutionTime = 0
    runStartTime = SystemClock.uptimeMillis()

    val viewCommandMountItemsToDispatch = getAndResetViewCommandMountItems()
    val mountItemsToDispatch = getAndResetMountItems()

    if (mountItemsToDispatch == null && viewCommandMountItemsToDispatch == null) {
      return
    }

    itemDispatchListener.willMountItems(mountItemsToDispatch)

    val dispatchViewCommand: (command: DispatchCommandMountItem) -> Unit = { command ->
      if (ReactNativeFeatureFlags.enableFabricLogs()) {
        printMountItem(command, "dispatchMountItems: Executing viewCommandMountItem")
      }
      try {
        executeOrEnqueue(command)
      } catch (e: RetryableMountingLayerException) {
        // If the exception is marked as Retryable, we retry the viewcommand exactly once, after
        // the current batch of mount items has finished executing.
        if (command.getRetries() == 0) {
          command.incrementRetries()
          addViewCommandMountItem(command)
        } else {
          // It's very common for commands to be executed on views that no longer exist - for
          // example, a blur event on TextInput being fired because of a navigation event away
          // from the current screen. If the exception is marked as Retryable, we log a soft
          // exception but never crash in debug.
          // It's not clear that logging this is even useful, because these events are very
          // common, mundane, and there's not much we can do about them currently.
          ReactSoftExceptionLogger.logSoftException(
              TAG,
              ReactNoCrashSoftException("Caught exception executing ViewCommand: $command", e),
          )
        }
      } catch (e: Throwable) {
        // Non-retryable exceptions are logged as soft exceptions in prod, but crash in Debug.
        ReactSoftExceptionLogger.logSoftException(
            TAG,
            RuntimeException("Caught exception executing ViewCommand: $command", e),
        )
      }
    }

    // As an optimization, execute all ViewCommands first
    // This should be:
    // 1) Performant: ViewCommands are often a replacement for SetNativeProps, which we've always
    // wanted to be as "synchronous" as possible.
    // 2) Safer: ViewCommands are inherently disconnected from the tree commit/diff/mount process.
    // JS imperatively queues these commands.
    //    If JS has queued a command, it's reasonable to assume that the more time passes, the
    // more
    // likely it is that the view disappears.
    //    Thus, by executing ViewCommands early, we should actually avoid a category of
    // errors/glitches.
    viewCommandMountItemsToDispatch?.let { commands ->
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT,
          "MountItemDispatcher::mountViews viewCommandMountItems",
      )

      PerformanceTracer.trace(
          "view commands",
          "Renderer",
          "\u269b Native",
          { ->
            for (command in commands) {
              dispatchViewCommand(command)
            }
          },
      )

      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }

    // If there are MountItems to dispatch, we make sure all the "pre mount items" are executed
    // first
    getAndResetPreMountItems()?.let { preMountItems ->
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT,
          "MountItemDispatcher::mountViews preMountItems",
      )

      PerformanceTracer.trace(
          "premount",
          "Renderer",
          "\u269b Native",
          { ->
            for (preMountItem in preMountItems) {
              if (ReactNativeFeatureFlags.enableFabricLogs()) {
                printMountItem(preMountItem, "dispatchMountItems: Executing preMountItem")
              }
              executeOrEnqueue(preMountItem)
            }
          },
      )

      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }

    mountItemsToDispatch?.let { items ->
      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT,
          "MountItemDispatcher::mountViews mountItems to execute",
      )

      PerformanceTracer.trace(
          "mount",
          "Renderer",
          "\u269b Native",
          { ->
            val batchedExecutionStartTime = SystemClock.uptimeMillis()

            for (mountItem in items) {
              if (ReactNativeFeatureFlags.enableFabricLogs()) {
                printMountItem(mountItem, "dispatchMountItems: Executing mountItem")
              }

              val command = mountItem as? DispatchCommandMountItem
              if (command != null) {
                dispatchViewCommand(command)
                continue
              }

              try {
                executeOrEnqueue(mountItem)
              } catch (e: Throwable) {
                // If there's an exception, we want to log diagnostics in prod and rethrow.
                FLog.e(TAG, "dispatchMountItems: caught exception, displaying mount state", e)
                if (ReactNativeFeatureFlags.enableFabricLogs()) {
                  for (m in items) {
                    if (m === mountItem) {
                      // We want to mark the mount item that caused exception
                      FLog.e(
                          TAG,
                          "dispatchMountItems: mountItem: next mountItem triggered exception!",
                      )
                    }
                    printMountItem(m, "dispatchMountItems: mountItem")
                  }
                }

                if (mountItem.getSurfaceId() != View.NO_ID) {
                  mountingManager.getSurfaceManager(mountItem.getSurfaceId())?.printSurfaceState()
                }

                if (ReactIgnorableMountingException.isIgnorable(e)) {
                  ReactSoftExceptionLogger.logSoftException(TAG, e)
                } else {
                  throw e
                }
              }
            }
            batchedExecutionTime += SystemClock.uptimeMillis() - batchedExecutionStartTime
          },
      )

      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }

    itemDispatchListener.didMountItems(mountItemsToDispatch)
  }

  /*
   * Executes pre-mount items. Pre-mount items are operations that can be executed before the mount
   * items come, for example view pre-allocation. This is a performance optimisation to do as much
   * work ahead of time as possible.
   *
   * `tryDispatchMountItems` will also execute pre mount items, but only if there are mount items to be executed.
   */
  @UiThread
  @ThreadConfined(UI)
  fun dispatchPreMountItems(frameTimeNanos: Long) {
    lastFrameTimeNanos = frameTimeNanos

    if (preMountItems.isEmpty()) {
      // Avoid starting systrace if there are no pre mount items.
      return
    }

    val deadline = lastFrameTimeNanos + FRAME_TIME_NS / 2
    dispatchPreMountItemsImpl(deadline)
  }

  private fun dispatchPreMountItemsImpl(deadline: Long) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "MountItemDispatcher::premountViews")

    PerformanceTracer.trace(
        "premount",
        "Renderer",
        "\u269b Native",
        { ->
          // dispatchPreMountItems cannot be reentrant, but we want to prevent dispatchMountItems
          // from
          // reentering during dispatchPreMountItems
          inDispatch = true

          try {
            while (true) {
              if (System.nanoTime() > deadline) {
                break
              }

              // If list is empty, `poll` will return null, or var will never be set
              val preMountItemToDispatch = preMountItems.poll() ?: break
              if (ReactNativeFeatureFlags.enableFabricLogs()) {
                printMountItem(preMountItemToDispatch, "dispatchPreMountItems")
              }
              executeOrEnqueue(preMountItemToDispatch)
            }
          } finally {
            inDispatch = false
          }
        },
    )

    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }

  private fun executeOrEnqueue(item: MountItem) {
    if (mountingManager.isWaitingForViewAttach(item.getSurfaceId())) {
      if (ReactNativeFeatureFlags.enableFabricLogs()) {
        FLog.e(
            TAG,
            "executeOrEnqueue: Item execution delayed, surface %s is not ready yet",
            item.getSurfaceId(),
        )
      }
      val surfaceMountingManager: SurfaceMountingManager =
          mountingManager.getSurfaceManagerEnforced(
              item.getSurfaceId(),
              "MountItemDispatcher::executeOrEnqueue",
          )
      surfaceMountingManager.scheduleMountItemOnViewAttach(item)
    } else {
      item.execute(mountingManager)
    }
  }

  @ThreadConfined(UI)
  @UiThread
  private fun getAndResetViewCommandMountItems(): List<DispatchCommandMountItem>? =
      drainConcurrentItemQueue(viewCommandMountItems)

  @ThreadConfined(UI)
  @UiThread
  private fun getAndResetMountItems(): List<MountItem>? = drainConcurrentItemQueue(mountItems)

  @ThreadConfined(UI)
  @UiThread
  private fun getAndResetPreMountItems(): List<MountItem>? = drainConcurrentItemQueue(preMountItems)

  interface ItemDispatchListener {
    fun willMountItems(mountItems: List<MountItem>?)

    fun didMountItems(mountItems: List<MountItem>?)

    fun didDispatchMountItems()
  }

  private companion object {
    private const val TAG: String = "MountItemDispatcher"

    private const val FRAME_TIME_NS: Long = (1000000000 / 60).toLong()

    private fun <E> drainConcurrentItemQueue(queue: Queue<E>): List<E>? {
      if (queue.isEmpty()) {
        return null
      }

      return buildList {
            do {
              queue.poll()?.let { add(it) }
            } while (queue.isNotEmpty())
          }
          .takeIf { it.isNotEmpty() }
    }

    private fun printMountItem(mountItem: MountItem, prefix: String) {
      // If a MountItem description is split across multiple lines, it's because it's a
      // compound MountItem. Log each line separately.
      val mountItemLines = mountItem.toString().split("\n").dropLastWhile { it.isEmpty() }

      for (line in mountItemLines) {
        FLog.e(TAG, "$prefix: $line")
      }
    }
  }
}
