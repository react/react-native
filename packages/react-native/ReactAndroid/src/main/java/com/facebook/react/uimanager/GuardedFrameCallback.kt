/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.Choreographer
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.ReactContext

/**
 * Abstract base for a Choreographer FrameCallback that should have any RuntimeExceptions it throws
 * handled by the [JSExceptionHandler] registered if the app is in dev mode.
 *
 * @property exceptionHandler The handler for RuntimeExceptions thrown during frame callbacks.
 * @constructor Creates a GuardedFrameCallback with the specified exception handler.
 */
public abstract class GuardedFrameCallback
protected constructor(private val exceptionHandler: JSExceptionHandler) :
    Choreographer.FrameCallback {
  /**
   * Creates a GuardedFrameCallback using the exception handler from the provided ReactContext.
   *
   * @param reactContext The React context whose exception handler will be used.
   */
  protected constructor(reactContext: ReactContext) : this(reactContext.exceptionHandler)

  /**
   * Choreographer frame callback implementation that guards [doFrameGuarded] with exception
   * handling.
   *
   * Wraps calls to [doFrameGuarded] in a try-catch block. Any RuntimeExceptions thrown are caught
   * and passed to the exception handler instead of crashing the app.
   *
   * @param frameTimeNanos The time in nanoseconds when the frame started being rendered.
   */
  public override fun doFrame(frameTimeNanos: Long) {
    try {
      doFrameGuarded(frameTimeNanos)
    } catch (e: RuntimeException) {
      exceptionHandler.handleException(e)
    }
  }

  /**
   * Like the standard doFrame but RuntimeExceptions will be caught and passed to
   * [ReactContext#handleException(RuntimeException)].
   */
  protected abstract fun doFrameGuarded(frameTimeNanos: Long)
}
