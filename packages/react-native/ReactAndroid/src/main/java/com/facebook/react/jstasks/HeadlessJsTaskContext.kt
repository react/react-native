/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jstasks

import android.util.SparseArray
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.appregistry.AppRegistry
import java.lang.ref.WeakReference
import java.util.WeakHashMap
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.atomic.AtomicInteger

/**
 * Helper class for dealing with JS tasks. Handles per-ReactContext active task tracking, starting /
 * stopping tasks and notifying listeners.
 */
public class HeadlessJsTaskContext private constructor(reactContext: ReactContext) {
  private val reactContext = WeakReference(reactContext)
  private val headlessJsTaskEventListeners: MutableSet<HeadlessJsTaskEventListener> =
      CopyOnWriteArraySet()
  private val lastTaskId = AtomicInteger(0)
  private val activeTasks: MutableSet<Int> = CopyOnWriteArraySet()
  private val activeTaskConfigs: MutableMap<Int, HeadlessJsTaskConfig> = ConcurrentHashMap()
  private val taskTimeouts = SparseArray<Runnable>()

  /**
   * Register a task lifecycle event listener. Synchronized in order to prevent race conditions with
   * finishTask, as the listener will be invoked for already running tasks.
   */
  @Synchronized
  public fun addTaskEventListener(listener: HeadlessJsTaskEventListener) {
    headlessJsTaskEventListeners.add(listener)
    for (activeTaskId in activeTasks) {
      listener.onHeadlessJsTaskStart(activeTaskId)
    }
  }

  /** Unregister a task lifecycle event listener. */
  public fun removeTaskEventListener(listener: HeadlessJsTaskEventListener) {
    headlessJsTaskEventListeners.remove(listener)
  }

  /** Get whether there are any running JS tasks at the moment. */
  public fun hasActiveTasks(): Boolean = activeTasks.isNotEmpty()

  /**
   * Start a JS task. Handles invoking [AppRegistry.startHeadlessTask] and notifying listeners.
   *
   * @return a unique id representing this task instance.
   */
  @Synchronized
  public fun startTask(taskConfig: HeadlessJsTaskConfig): Int =
      lastTaskId.incrementAndGet().apply { startTask(taskConfig, this) }

  /**
   * Start a JS task the provided task id. Handles invoking [AppRegistry.startHeadlessTask] and
   * notifying listeners.
   */
  @Synchronized
  private fun startTask(taskConfig: HeadlessJsTaskConfig, taskId: Int) {
    UiThreadUtil.assertOnUiThread()
    val reactContext =
        Assertions.assertNotNull(
            reactContext.get(),
            "Tried to start a task on a react context that has already been destroyed",
        )
    check(
        !(reactContext.lifecycleState == LifecycleState.RESUMED &&
            !taskConfig.isAllowedInForeground)
    ) {
      "Tried to start task ${taskConfig.taskKey} while in foreground, but this is not allowed."
    }
    activeTasks.add(taskId)
    activeTaskConfigs[taskId] = HeadlessJsTaskConfig(taskConfig)
    if (reactContext.hasActiveReactInstance()) {
      reactContext
          .getJSModule(AppRegistry::class.java)
          .startHeadlessTask(taskId, taskConfig.taskKey, taskConfig.data)
    } else {
      logSoftException(
          "HeadlessJsTaskContext",
          RuntimeException("Cannot start headless task, CatalystInstance not available"),
      )
    }
    if (taskConfig.timeout > 0) {
      scheduleTaskTimeout(taskId, taskConfig.timeout)
    }
    for (listener in headlessJsTaskEventListeners) {
      listener.onHeadlessJsTaskStart(taskId)
    }
  }

  /**
   * Retry a running JS task with a delay. Invokes [ ][HeadlessJsTaskContext.startTask] as long as
   * the process does not get killed.
   *
   * @return true if a retry attempt has been posted.
   */
  @Synchronized
  public fun retryTask(taskId: Int): Boolean {
    val sourceTaskConfig = activeTaskConfigs[taskId]
    checkNotNull(sourceTaskConfig) { "Tried to retrieve non-existent task config with id $taskId." }

    val retryPolicy = sourceTaskConfig.retryPolicy
    if (retryPolicy == null || !retryPolicy.canRetry()) {
      return false
    }

    removeTimeout(taskId)
    val taskConfig = HeadlessJsTaskConfig(
        sourceTaskConfig.taskKey,
        sourceTaskConfig.data,
        sourceTaskConfig.timeout,
        sourceTaskConfig.isAllowedInForeground,
        retryPolicy.update(),
    )

    val retryAttempt = Runnable { startTask(taskConfig, taskId) }

    UiThreadUtil.runOnUiThread(retryAttempt, retryPolicy.delay.toLong())
    return true
  }

  /**
   * Finish a JS task. Doesn't actually stop the task on the JS side, only removes it from the list
   * of active tasks and notifies listeners.
   *
   * @param taskId the unique id returned by [startTask].
   */
  @Synchronized
  public fun finishTask(taskId: Int) {
    val removed = activeTasks.remove(taskId)
    activeTaskConfigs.remove(taskId)
    removeTimeout(taskId)
    if (removed) {
      UiThreadUtil.runOnUiThread {
        for (listener in headlessJsTaskEventListeners) {
          listener.onHeadlessJsTaskFinish(taskId)
        }
      }
    }
  }

  private fun removeTimeout(taskId: Int) {
    val runnable = taskTimeouts[taskId]
    if (runnable != null) {
      UiThreadUtil.removeOnUiThread(runnable)
      taskTimeouts.remove(taskId)
    }
  }

  /**
   * Check if a given task is currently running. A task is stopped if either [finishTask] is called
   * or it times out.
   */
  @Synchronized public fun isTaskRunning(taskId: Int): Boolean = taskId in activeTasks

  private fun scheduleTaskTimeout(taskId: Int, timeout: Long) {
    val runnable = Runnable { finishTask(taskId) }
    taskTimeouts.append(taskId, runnable)
    UiThreadUtil.runOnUiThread(runnable, timeout)
  }

  public companion object {
    private val INSTANCES = WeakHashMap<ReactContext, HeadlessJsTaskContext>()

    /**
     * Get the task helper instance for a particular [ReactContext]. There is only one instance per
     * context.
     *
     * **Note:** do not hold long-lived references to the object returned here, as that will cause
     * memory leaks. Instead, just call this method on-demand.
     */
    @JvmStatic
    public fun getInstance(context: ReactContext): HeadlessJsTaskContext =
        INSTANCES.getOrPut(context) { HeadlessJsTaskContext(context) }
  }
}
