/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.os.Handler
import android.os.Looper
import com.facebook.react.common.build.ReactBuildConfig

/** Utility for interacting with the UI thread. */
public object UiThreadUtil {

  private val mainHandler: Handler by
      lazy(LazyThreadSafetyMode.SYNCHRONIZED) { Handler(Looper.getMainLooper()) }

  /**
   * Returns the handler associated with the main (UI) thread.
   *
   * @return The handler for the main thread
   */
  @JvmStatic public fun getUiThreadHandler(): Handler = mainHandler

  /** @return `true` if the current thread is the UI thread. */
  @JvmStatic
  public fun isOnUiThread(): Boolean = Looper.getMainLooper().thread == Thread.currentThread()

  /**
   * Throws an [AssertionException] if the current thread is not the UI thread. This is a no-op in
   * production and is only meant to run in debug mode! If you need to check for incorrect-thread
   * issues in production, duplicate this code and call it elsewhere.
   */
  @JvmStatic
  public fun assertOnUiThread() {
    if (ReactBuildConfig.DEBUG) {
      SoftAssertions.assertCondition(isOnUiThread(), "Expected to run on UI thread!")
    }
  }

  /**
   * Throws an [AssertionException] if the current thread is the UI thread. This is a noop in
   * production, and is only meant to run in debug mode! If you need to check for incorrect-thread
   * issues in production, duplicate this code and call it elsewhere.
   */
  @JvmStatic
  public fun assertNotOnUiThread() {
    if (ReactBuildConfig.DEBUG) {
      SoftAssertions.assertCondition(!isOnUiThread(), "Expected not to run on UI thread!")
    }
  }

  /** Runs the given [Runnable] on the UI thread. */
  @JvmStatic
  public fun runOnUiThread(runnable: Runnable): Boolean = mainHandler.postDelayed(runnable, 0)

  /** Runs the given [Runnable] on the UI thread after the specified delay. */
  @JvmStatic
  public fun runOnUiThread(runnable: Runnable, delayInMs: Long): Boolean =
      mainHandler.postDelayed(runnable, delayInMs)

  /** Removes the given [Runnable] on the UI thread. */
  @JvmStatic
  public fun removeOnUiThread(runnable: Runnable) {
    mainHandler.removeCallbacks(runnable)
  }
}
