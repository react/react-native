/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.annotation.SuppressLint
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.PowerManager
import android.os.PowerManager.WakeLock
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.jstasks.HeadlessJsTaskContext.Companion.getInstance
import com.facebook.react.jstasks.HeadlessJsTaskEventListener
import java.util.concurrent.CopyOnWriteArraySet

/**
 * Base class for running JS without a UI. Generally, you only need to override [getTaskConfig],
 * which is called for every [onStartCommand]. The result, if not `null`, is used to run a JS task.
 *
 * If you need more fine-grained control over how tasks are run, you can override [onStartCommand]
 * and call [startTask] depending on your custom logic.
 *
 * If you're starting a `HeadlessJsTaskService` from a `BroadcastReceiver` (e.g. handling push
 * notifications), make sure to call [acquireWakeLockNow] before returning from
 * [BroadcastReceiver.onReceive], to make sure the device doesn't go to sleep before the service is
 * started.
 */
public abstract class HeadlessJsTaskService : Service(), HeadlessJsTaskEventListener {
  private val activeTasks: MutableSet<Int> = CopyOnWriteArraySet()

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val taskConfig = getTaskConfig(intent)
    return if (taskConfig != null) {
      startTask(taskConfig)
      START_REDELIVER_INTENT
    } else {
      START_NOT_STICKY
    }
  }

  /**
   * Called from [onStartCommand] to create a [HeadlessJsTaskConfig] for this intent.
   *
   * @return a [HeadlessJsTaskConfig] to be used with [startTask], or `null` to ignore this command.
   */
  protected open fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? = null

  override fun onBind(intent: Intent): IBinder? = null

  /**
   * Start a task. This method handles starting a new React instance if required.
   *
   * Has to be called on the UI thread.
   *
   * @param taskConfig describes what task to start and the parameters to pass to it
   */
  protected fun startTask(taskConfig: HeadlessJsTaskConfig) {
    UiThreadUtil.assertOnUiThread()
    acquireWakeLockNow(this)

    val context = reactContext
    if (context == null) {
      createReactContextAndScheduleTask(taskConfig)
    } else {
      invokeStartTask(context, taskConfig)
    }
  }

  private fun invokeStartTask(reactContext: ReactContext, taskConfig: HeadlessJsTaskConfig) {
    val headlessJsTaskContext = getInstance(reactContext)
    headlessJsTaskContext.addTaskEventListener(this)
    UiThreadUtil.runOnUiThread {
      val taskId = headlessJsTaskContext.startTask(taskConfig)
      activeTasks.add(taskId)
    }
  }

  override fun onDestroy() {
    super.onDestroy()

    reactContext?.let { context ->
      val headlessJsTaskContext = getInstance(context)
      headlessJsTaskContext.removeTaskEventListener(this)
    }
    wakeLock?.release()
  }

  override fun onHeadlessJsTaskStart(taskId: Int): Unit = Unit

  override fun onHeadlessJsTaskFinish(taskId: Int) {
    activeTasks.remove(taskId)
    if (activeTasks.isEmpty()) {
      stopSelf()
    }
  }

  /**
   * Get the [ReactNativeHost] used by this app. By default, assumes [getApplication] is an instance
   * of [ReactApplication] and calls [ReactApplication.reactNativeHost].
   *
   * Override this method if your application class does not implement `ReactApplication` or you
   * simply have a different mechanism for storing a `ReactNativeHost`, e.g. as a static field
   * somewhere.
   */
  @Suppress("DEPRECATION")
  protected open val reactNativeHost: ReactNativeHost
    get() = (application as ReactApplication).reactNativeHost

  /**
   * Get the [ReactHost] used by this app. By default, assumes [getApplication] is an instance of
   * [ReactApplication] and calls [ReactApplication.reactHost]. This method assumes it is called in
   * new architecture and returns null if not.
   */
  protected open val reactHost: ReactHost?
    get() = (application as ReactApplication).reactHost

  protected val reactContext: ReactContext?
    get() {
      val reactHost = checkNotNull(reactHost) { "ReactHost is not initialized in New Architecture" }
      return reactHost.currentReactContext
    }

  private fun createReactContextAndScheduleTask(taskConfig: HeadlessJsTaskConfig) {
    val reactHost = checkNotNull(reactHost)
    reactHost.addReactInstanceEventListener(
        object : ReactInstanceEventListener {
          override fun onReactContextInitialized(context: ReactContext) {
            invokeStartTask(context, taskConfig)
            reactHost.removeReactInstanceEventListener(this)
          }
        }
    )
    reactHost.start()
  }

  public companion object {
    private var wakeLock: WakeLock? = null

    /**
     * Acquire a wake lock to ensure the device doesn't go to sleep while processing background
     * tasks.
     */
    @JvmStatic
    @SuppressLint("WakelockTimeout")
    public fun acquireWakeLockNow(context: Context) {
      if (wakeLock == null || wakeLock?.isHeld == false) {
        val powerManager = checkNotNull(context.getSystemService(POWER_SERVICE) as PowerManager)
        wakeLock =
            powerManager
                .newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    HeadlessJsTaskService::class.java.canonicalName,
                )
                .also { lock ->
                  lock.setReferenceCounted(false)
                  lock.acquire()
                }
      }
    }
  }
}
