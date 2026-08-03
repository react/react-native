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
import com.facebook.react.common.ReactConstants

/**
 * Default [ReactActivityResultCaller], owned by a [ReactContext].
 *
 * Registrations are accepted at any time -- native modules are created lazily, typically well after
 * the host Activity has resumed -- and bound to the current Activity's [ActivityResultRegistry]
 * either immediately (when an Activity is already available) or on the next `onHostResume`. When
 * the host Activity is destroyed the registrations are kept and rebound against the new Activity's
 * registry under the same keys, so AndroidX can re-associate a result that arrives after Activity
 * recreation.
 */
internal class ReactActivityResultCallerImpl(private val reactContext: ReactContext) :
    ReactActivityResultCaller, LifecycleEventListener {

  private class Entry<I, O>(
      val key: String,
      val registrantDescription: String,
      val contract: ActivityResultContract<I, O>,
      val callback: ActivityResultCallback<O>,
      val launcher: DeferredActivityResultLauncher<I>,
  )

  private val entries = LinkedHashMap<String, Entry<*, *>>()

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


  @Synchronized
  private fun <I, O> register(
      key: String,
      registrantDescription: String,
      collisionHint: String,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I> {
    entries[key]?.let { existing ->
      throw IllegalStateException(
          "${existing.registrantDescription} already registered a launcher for key '$key'. " +
              collisionHint)
    }
    val launcher = DeferredActivityResultLauncher(key, contract) { unregister(key) }
    val entry = Entry(key, registrantDescription, contract, callback, launcher)
    entries[key] = entry
    currentRegistry()?.let { registry -> bind(entry, registry) }
    return launcher
  }

  @Synchronized
  private fun unregister(key: String) {
    entries.remove(key)
  }

  @Synchronized
  override fun onHostResume() {
    val registry = currentRegistry() ?: return
    for (entry in entries.values) {
      if (!entry.launcher.isBound) {
        bind(entry, registry)
      }
    }
  }

  override fun onHostPause(): Unit = Unit

  @Synchronized
  override fun onHostDestroy() {
    // Detach from the dying registry but keep the registrations: they are rebound against the next
    // host's registry (same keys) on the next onHostResume, which is also how a result that
    // outlives the Activity gets re-associated by AndroidX.
    for (entry in entries.values) {
      entry.launcher.unbind()
    }
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

  private fun <I, O> bind(entry: Entry<I, O>, registry: ActivityResultRegistry) {
    entry.launcher.bind(registry.register(entry.key, entry.contract, entry.callback))
  }
}
