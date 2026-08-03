/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.activityresult

import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContract
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import java.util.concurrent.ConcurrentHashMap

/**
 * Runs [block] on the UI thread, inline if already there.
 *
 * [ActivityResultRegistry] is `@MainThread` and its key tables are unsynchronized. Nothing enforces
 * that at runtime, so an off-thread call corrupts them silently rather than throwing -- and RN
 * registers on the JS thread and launches on the native-modules thread.
 */
internal fun onUiThread(block: () -> Unit) {
  if (UiThreadUtil.isOnUiThread()) block() else UiThreadUtil.runOnUiThread(block)
}

/**
 * Default [ReactActivityResultCaller], owned by a [ReactContext].
 *
 * Registrations are accepted at any time -- native modules are created lazily, typically well after
 * the host Activity has resumed -- and bound to the current Activity's [ActivityResultRegistry]
 * either immediately (when an Activity is already available) or on the next `onHostResume`.
 * Registrations outlive any single Activity: keys stay stable, so AndroidX can re-associate a result
 * that arrives after Activity recreation.
 *
 * ## Which registry a launcher is bound to
 *
 * Every `onHostResume` reconciles each launcher against the *current* registry, rebinding it if it
 * is attached to a different one. It deliberately does not stop at "already bound to something":
 * with multi-Activity navigation the new Activity resumes before the old one is destroyed, and
 * `ReactHostImpl.onHostDestroy(activity)` drops the old Activity's destroy entirely once
 * `currentActivity` has moved on. A launcher that only checked "am I bound?" would stay attached to
 * the previous Activity's dead registry -- leaking it, and misrouting anything launched from the new
 * screen.
 *
 * ## Threading
 *
 * [entries] is concurrent and reachable from any thread. Everything that touches
 * [ActivityResultRegistry] goes through [onUiThread].
 *
 * Registration itself stays on the caller's thread, so the launcher is returned immediately and a
 * duplicate key throws from the frame that caused it. Only the registry call is hopped.
 */
internal class ReactActivityResultCallerImpl(private val reactContext: ReactContext) :
    ReactActivityResultCaller, LifecycleEventListener {

  private class Entry<I, O>(
      val key: String,
      val registrantDescription: String,
      private val contract: ActivityResultContract<I, O>,
      private val callback: ActivityResultCallback<O>,
      val launcher: DeferredActivityResultLauncher<I>,
  ) {
    /**
     * Ensures the launcher is bound to [registry], rebinding if it is currently attached to a
     * different one. On [Entry] so an `Entry<*, *>` can be bound without unchecked casts.
     */
    fun bindTo(registry: ActivityResultRegistry) {
      if (launcher.isBoundTo(registry)) return
      // Release the previous host's registry first: it may already be dead, and leaving the
      // callback registered there leaks that Activity and misroutes anything launched from it.
      launcher.unbind()
      launcher.bind(registry, registry.register(key, contract, callback))
    }
  }

  private val entries = ConcurrentHashMap<String, Entry<*, *>>()

  init {
    reactContext.addLifecycleEventListener(this)
  }

  private fun getOwnerId(owner: Any): String = owner.javaClass.name

  override fun <I, O> registerForActivityResult(
      owner: Any,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I> {
    val id = getOwnerId(owner)
    return register(
        key = "$id:${contract.javaClass.name}",
        registrantDescription = id,
        collisionHint =
            "Register once and reuse the launcher, or pass a distinct key per launcher: " +
                "registerForActivityResult(owner, \"someName\", contract, callback).",
        contract = contract,
        callback = callback)
  }

  override fun <I, O> registerForActivityResult(
      owner: Any,
      key: String,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I> {
    val id = getOwnerId(owner)
    return register(
        key = "$id:${contract.javaClass.name}:$key",
        registrantDescription = id,
        collisionHint = "Pass a key that is unique among this owner's launchers of this contract.",
        contract = contract,
        callback = callback)
  }

  private fun <I, O> register(
      key: String,
      registrantDescription: String,
      collisionHint: String,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I> {
    val launcher = DeferredActivityResultLauncher(key, contract) { entries.remove(key) }
    val entry = Entry(key, registrantDescription, contract, callback, launcher)
    entries.putIfAbsent(key, entry)?.let { existing ->
      throw IllegalStateException(
          "${existing.registrantDescription} already registered a launcher for key '$key'. " +
              collisionHint)
    }
    onUiThread { currentRegistry()?.let { registry -> entry.bindTo(registry) } }
    return launcher
  }

  override fun onHostResume() = onUiThread {
    val registry = currentRegistry() ?: return@onUiThread
    entries.values.forEach { it.bindTo(registry) }
  }

  override fun onHostPause(): Unit = Unit

  override fun onHostDestroy() = onUiThread {
    // Detach from the dying registry but keep the registrations: they rebind against the next host's
    // registry under the same keys on the next onHostResume, which is how AndroidX re-associates a
    // result that outlives the Activity.
    entries.values.forEach { it.launcher.unbind() }
  }

  private fun currentRegistry(): ActivityResultRegistry? {
    val activity = reactContext.currentActivity ?: return null
    val owner = activity as? ActivityResultRegistryOwner
    if (owner == null) {
      FLog.w(
          ReactConstants.TAG,
          "Current Activity ${activity.javaClass.name} is not an ActivityResultRegistryOwner; " +
              "ActivityResultContract launchers will stay queued until one is available.")
      return null
    }
    return owner.activityResultRegistry
  }
}
