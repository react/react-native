/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.annotation.SuppressLint
import kotlin.concurrent.Volatile

internal class BridgelessAtomicRef<T>(
    @field:Volatile @get:Synchronized @get:JvmName("getNullable") var value: T? = null
) {

  internal fun interface Provider<T> {
    fun get(): T
  }

  internal enum class State {
    Init,
    Creating,
    Success,
    Failure,
  }

  var initialValue: T? = value

  @Volatile private var state: State = State.Init

  @Volatile private var failureMessage: String = ""

  @SuppressLint("CatchGeneralException")
  @Suppress("PLATFORM_CLASS_MAPPED_TO_KOTLIN")
  fun getOrCreate(provider: Provider<T>): T {
    var shouldCreate = false
    synchronized(this) {
      if (state == State.Success) {
        return get()
      }
      if (state == State.Failure) {
        throw RuntimeException(
            "BridgelessAtomicRef: Failed to create object. Reason: $failureMessage"
        )
      }
      if (state != State.Creating) {
        state = State.Creating
        shouldCreate = true
      }
    }

    if (shouldCreate) {
      try {
        // Call provider with lock on `this` released to mitigate deadlock hazard
        value = provider.get()

        synchronized(this) {
          state = State.Success
          (this as Object).notifyAll()
          return get()
        }
      } catch (ex: RuntimeException) {
        synchronized(this) {
          state = State.Failure
          val message = ex.message
          failureMessage = message.toString()
          (this as Object).notifyAll()
        }

        throw RuntimeException("BridgelessAtomicRef: Failed to create object.", ex)
      }
    }

    synchronized(this) {
      var wasInterrupted = false
      while (state == State.Creating) {
        try {
          (this as Object).wait()
        } catch (ex: InterruptedException) {
          // Record the interrupt to restore it after the wait loop completes.
          // We continue waiting because we need the object to be created.
          wasInterrupted = true
        }
      }

      if (wasInterrupted) {
        Thread.currentThread().interrupt()
      }

      if (state == State.Failure) {
        throw RuntimeException(
            "BridgelessAtomicRef: Failed to create object. Reason: $failureMessage"
        )
      }
      return get()
    }
  }

  @get:Synchronized
  val andReset: T
    get() {
      val value = get()
      reset()
      return value
    }

  @Synchronized
  fun reset() {
    value = initialValue
    state = State.Init
    failureMessage = ""
  }

  @Synchronized fun get(): T = checkNotNull(value)
}
