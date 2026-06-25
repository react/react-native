/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.GuardedFrameCallback
import java.util.concurrent.atomic.AtomicBoolean

internal fun interface AnimationFrameCallback {
  fun onAnimationFrame(frameTimeMs: Double)
}

@DoNotStripAny
internal class AnimationBackendChoreographer(
    reactApplicationContext: ReactApplicationContext,
) {

  var frameCallback: AnimationFrameCallback? = null
  private var lastFrameTimeMs: Double = 0.0
  private val reactChoreographer: ReactChoreographer = ReactChoreographer.getInstance()
  private val choreographerCallback: GuardedFrameCallback =
      object : GuardedFrameCallback(reactApplicationContext) {
        override fun doFrameGuarded(frameTimeNanos: Long) {
          executeFrameCallback(frameTimeNanos)
        }
      }

  // When true, the always-registered frame callback runs as a no-op.
  //
  // The callback is registered with ReactChoreographer once (on the UI thread)
  // and re-posts itself every frame regardless of this flag, so it stays
  // registered for the lifetime of the choreographer.
  private val paused: AtomicBoolean = AtomicBoolean(true)

  init {
    // Register the self-reposting callback once, on the UI thread, so the
    // callback queues are only ever mutated from the UI thread.
    UiThreadUtil.runOnUiThread { postCallback() }
  }

  fun resume() {
    paused.set(false)
  }

  fun pause() {
    paused.set(true)
  }

  private fun postCallback() {
    reactChoreographer.postFrameCallback(
        ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
        choreographerCallback,
    )
  }

  private fun executeFrameCallback(frameTimeNanos: Long) {
    val currentFrameTimeMs = calculateTimestamp(frameTimeNanos)
    // Only drive the animation backend while enabled. It is possible for the
    // ChoreographerCallback to be executed twice within the same frame due to
    // frame drops; if this occurs, the additional callback execution should be
    // ignored.
    if (!paused.get() && currentFrameTimeMs > lastFrameTimeMs) {
      frameCallback?.onAnimationFrame(currentFrameTimeMs)
    }

    lastFrameTimeMs = currentFrameTimeMs
    // Always re-post (on the UI thread) so the callback stays registered for the
    // next frame, whether or not we are currently paused.
    postCallback()
  }

  private fun calculateTimestamp(frameTimeNanos: Long): Double {
    val nanosecondsInMilliseconds = 1000000.0
    return frameTimeNanos / nanosecondsInMilliseconds
  }
}
