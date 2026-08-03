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
 * An [ActivityResultLauncher] handed out before the host Activity's `ActivityResultRegistry` is
 * available. It delegates to the real launcher once [bind] is called, and queues a single pending
 * [launch] issued while unbound, firing it on bind. [unbind] detaches it when the host Activity is
 * destroyed so that [ReactActivityResultCallerImpl] can rebind it against the next host's registry.
 *
 * [launch] and [unregister] are called off the UI thread but reach `@MainThread` registry methods,
 * so both hop. [delegate] and [pendingLaunch] are therefore UI-thread only and need no lock. Note
 * [launch] decides bound-vs-queue *inside* the hop: doing it before would let a concurrent [unbind]
 * strand the launch on a dead registry.
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
    // Drop the registration first, so nothing rebinds this launcher while the hop is in flight.
    onUnregister()
    onUiThread {
      delegate?.unregister()
      delegate = null
      pendingLaunch = null
    }
  }

  /**
   * Attaches [launcher], obtained from [registry], and fires any launch queued while unbound.
   * [registry] is remembered so [isBoundTo] can tell whether a later host is a different one.
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

  /** Whether this launcher is already bound to [registry] specifically -- not merely to something. */
  fun isBoundTo(registry: ActivityResultRegistry): Boolean = boundRegistry === registry
}
