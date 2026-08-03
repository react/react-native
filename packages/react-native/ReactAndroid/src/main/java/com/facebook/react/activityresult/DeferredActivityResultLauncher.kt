/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.activityresult

import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract
import androidx.core.app.ActivityOptionsCompat
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants

/**
 * An [ActivityResultLauncher] handed out before the host Activity's `ActivityResultRegistry` is
 * available. It delegates to the real launcher once [bind] is called, and queues a single pending
 * [launch] issued while unbound, firing it on bind. [unbind] detaches it when the host Activity is
 * destroyed so that [ReactActivityResultCallerImpl] can rebind it against the next host's registry.
 */
internal class DeferredActivityResultLauncher<I>(
    private val key: String,
    private val contract: ActivityResultContract<I, *>,
    private val onUnregister: () -> Unit,
) : ActivityResultLauncher<I>() {

  override fun getContract(): ActivityResultContract<I, *> = contract

  private class PendingLaunch<I>(val input: I, val options: ActivityOptionsCompat?)

  private var delegate: ActivityResultLauncher<I>? = null
  private var pendingLaunch: PendingLaunch<I>? = null

  @Synchronized
  override fun launch(input: I, options: ActivityOptionsCompat?) {
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

  @Synchronized
  override fun unregister() {
    delegate?.unregister()
    delegate = null
    pendingLaunch = null
    onUnregister()
  }

  /** Attaches the real launcher and fires any launch queued while unbound. */
  @Synchronized
  fun bind(launcher: ActivityResultLauncher<I>) {
    delegate = launcher
    pendingLaunch?.let { pending ->
      pendingLaunch = null
      launcher.launch(pending.input, pending.options)
    }
  }

  /** Detaches from a dying registry, keeping any queued launch for the next [bind]. */
  @Synchronized
  fun unbind() {
    delegate?.unregister()
    delegate = null
  }

  @get:Synchronized
  val isBound: Boolean
    get() = delegate != null
}
