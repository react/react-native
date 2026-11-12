/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.common.logging.FLog
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Announces each bundle and segment file the bridgeless runtime is about to run, so an observer can
 * tell which JavaScript ran and where it came from.
 */
@UnstableReactNativeAPI
public object ReactJavaScriptLoads {

  @UnstableReactNativeAPI
  public fun interface Listener {
    /**
     * Called before React Native runs the script, on the thread that loads it. [sourceURL] names
     * the script: the dev server URL for a bundle a dev server served, `assets://` for one read
     * from the APK's assets, or the file path. [path] is the file read, null for an asset.
     * [revisionId] is the dev server's label for the revision it built the bundle from, null when
     * it sent none. Listeners must not block. One that throws is logged and does not stop the load.
     */
    public fun onWillExecute(sourceURL: String, path: String?, revisionId: String?)
  }

  private const val TAG = "ReactJavaScriptLoads"

  private val listeners = CopyOnWriteArrayList<Listener>()

  @Volatile private var started = false

  @JvmStatic
  public fun addListener(listener: Listener) {
    listeners.addIfAbsent(listener)
  }

  @JvmStatic
  public fun removeListener(listener: Listener) {
    listeners.remove(listener)
  }

  /**
   * Whether this process has started running a bundle or registering a segment, so a listener added
   * later can tell that it missed some.
   */
  @JvmStatic public fun hasStartedExecuting(): Boolean = started

  internal fun willExecute(sourceURL: String, path: String?, revisionId: String?) {
    started = true
    for (listener in listeners) {
      try {
        listener.onWillExecute(sourceURL, path, revisionId)
      } catch (e: Exception) {
        FLog.e(TAG, "A JavaScript load listener threw", e)
      }
    }
  }
}
