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
 * Runs [block] on the UI thread, inline if already there. [ActivityResultRegistry] is `@MainThread`
 * but not enforced at runtime: an off-thread call corrupts it silently, and RN calls in from the JS
 * and native-modules threads.
 */
internal fun onUiThread(block: () -> Unit) {
  if (UiThreadUtil.isOnUiThread()) block() else UiThreadUtil.runOnUiThread(block)
}

/**
 * Default [ReactActivityResultCaller], owned by a [ReactContext].
 *
 * Registrations are accepted at any time and bound to the current Activity's
 * [ActivityResultRegistry] immediately or on the next `onHostResume`. They outlive any single
 * Activity: keys stay stable so AndroidX can re-associate a result after Activity recreation.
 *
 * Every `onHostResume` checks each launcher against the *current* registry, not just "already
 * bound to something": with multi-Activity navigation the new Activity resumes before the old one
 * is destroyed (whose onHostDestroy is dropped once `currentActivity` moves on), so a bound-only
 * check would leave launchers attached to the previous Activity's dead registry.
 *
 * Threading: [entries] is concurrent and reachable from any thread; everything touching the
 * registry goes through [onUiThread]. Registration stays on the caller's thread so the launcher
 * returns immediately and a duplicate key throws at the causing frame. Only the registry call
 * moves to the UI thread.
 */
internal class ReactActivityResultCallerImpl(private val reactContext: ReactContext) :
    ReactActivityResultCaller, LifecycleEventListener {

  private class Entry<I, O>(
      val key: String,
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
      // Release any previous (possibly dead) registry first; staying registered there leaks its
      // Activity and sends launches to the wrong one.
      launcher.unbind()
      launcher.bind(registry, registry.register(key, contract, callback))
    }
  }

  private val entries = ConcurrentHashMap<String, Entry<*, *>>()

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun <I, O> registerForActivityResult(
      owner: Any,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I> {
    if(owner::class.java.isAnonymousClass) {
      throw IllegalArgumentException(
        "ActivityResult owner must be a named class, but got an anonymous class. " +
          "Pass an instance of a named class instead."
      )
    }

    return register(
        key = "${owner.javaClass.name}:${contract.javaClass.name}",
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
    if(owner::class.java.isAnonymousClass) {
      throw IllegalArgumentException(
        "ActivityResult owner must be a named class, but got an anonymous class. " +
          "Pass an instance of a named class instead."
      )
    }

    return register(
        key = "${owner.javaClass.name}:${contract.javaClass.name}:$key",
        collisionHint = "Pass a key that is unique among this owner's launchers of this contract.",
        contract = contract,
        callback = callback)
  }

  private fun <I, O> register(
      key: String,
      collisionHint: String,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I> {
    val launcher = DeferredActivityResultLauncher(key, contract) { entries.remove(key) }
    val entry = Entry(key, contract, callback, launcher)
    if (entries.putIfAbsent(key, entry) != null) {
      throw IllegalStateException(
          "A launcher is already registered for key '$key'. $collisionHint")
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
    // Detach from the dying registry but keep the registrations: they rebind under the same keys
    // on the next onHostResume, which is how AndroidX re-associates a surviving result.
    entries.values.forEach { it.launcher.unbind() }
  }

  private fun currentRegistry(): ActivityResultRegistry? {
    val activity = reactContext.currentActivity ?: return null
    val owner = activity as? ActivityResultRegistryOwner
      ?: throw IllegalStateException(
        "Current Activity ${activity.javaClass.name} is not an ActivityResultRegistryOwner; " +
          "ActivityResultContract launchers cannot be registered."
      )
    return owner.activityResultRegistry
  }
}
