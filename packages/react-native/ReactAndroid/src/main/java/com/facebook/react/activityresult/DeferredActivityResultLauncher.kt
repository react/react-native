/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.activityresult

import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.contract.ActivityResultContract
import androidx.core.app.ActivityOptionsCompat
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants

/**
 * An [ActivityResultLauncher] that may exist before any `ActivityResultRegistry` is available: it
 * delegates to the real launcher once [bind] is called, queues a single [launch] issued while
 * unbound (fired on bind), and can be [unbind]-ed and rebound against a new host's registry.
 *
 * [delegate] and [pendingLaunch] are only touched on the UI thread; [launch] and [unregister] get
 * there via [onUiThread]. [launch] decides between delegating and queueing *on* the UI thread, so
 * a concurrent [unbind] cannot leave it pointed at a dead registry.
 */
internal class DeferredActivityResultLauncher<I>(
    private val key: String,
    private val contract: ActivityResultContract<I, *>,
    private val onUnregister: () -> Unit,
) : ActivityResultLauncher<I>() {

  override fun getContract(): ActivityResultContract<I, *> = contract

  private class PendingLaunch<I>(val input: I, val options: ActivityOptionsCompat?)

  private var delegate: ActivityResultLauncher<I>? = null
  private var boundRegistry: ActivityResultRegistry? = null
  private var pendingLaunch: PendingLaunch<I>? = null

  override fun launch(input: I, options: ActivityOptionsCompat?) {
    onUiThread {
      val boundDelegate = delegate
      if (boundDelegate != null) {
        boundDelegate.launch(input, options)
      } else {
        if (pendingLaunch != null) {
          FLog.w(
              ReactConstants.TAG,
              "Launcher for '$key' was launched again before an Activity was available; " +
                  "replacing the previously queued launch.")
        }
        pendingLaunch = PendingLaunch(input, options)
      }
    }
  }

  override fun unregister() {
    // Drop the registration first so nothing rebinds this launcher in the meantime.
    onUnregister()
    onUiThread {
      delegate?.unregister()
      delegate = null
      pendingLaunch = null
    }
  }

  /**
   * Attaches [launcher], obtained from [registry] (remembered for [isBoundTo]), and fires any
   * queued launch.
   */
  fun bind(registry: ActivityResultRegistry, launcher: ActivityResultLauncher<I>) {
    UiThreadUtil.assertOnUiThread()
    delegate = launcher
    boundRegistry = registry
    pendingLaunch?.let { pending ->
      pendingLaunch = null
      launcher.launch(pending.input, pending.options)
    }
  }

  /** Detaches from the bound registry, keeping any queued launch for the next [bind]. */
  fun unbind() {
    UiThreadUtil.assertOnUiThread()
    delegate?.unregister()
    delegate = null
    boundRegistry = null
  }

  /** Whether this launcher is bound to [registry] itself, not just to any registry. */
  fun isBoundTo(registry: ActivityResultRegistry): Boolean = boundRegistry === registry
}
