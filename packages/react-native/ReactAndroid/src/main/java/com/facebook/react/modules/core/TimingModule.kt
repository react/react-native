/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import com.facebook.fbreact.specs.NativeTimingSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.module.annotations.ReactModule

/** Native module for JS timer execution. Timers fire on frame boundaries. */
@Deprecated(
    "TimingModule is part of the legacy architecture and will be removed in a future React Native release."
)
@ReactModule(name = NativeTimingSpec.NAME)
public class TimingModule(
    reactContext: ReactApplicationContext,
    devSupportManager: DevSupportManager,
) : com.facebook.fbreact.specs.NativeTimingSpec(reactContext), JavaScriptTimerExecutor {
  private val javaTimerManager: JavaTimerManager =
      JavaTimerManager(reactContext, this, ReactChoreographer.getInstance(), devSupportManager)

  override fun createTimer(
      callbackIDDouble: Double,
      durationDouble: Double,
      jsSchedulingTime: Double,
      repeat: Boolean,
  ) {
    val callbackID = callbackIDDouble.toInt()
    val duration = durationDouble.toInt()
    javaTimerManager.createAndMaybeCallTimer(callbackID, duration, jsSchedulingTime, repeat)
  }

  override fun deleteTimer(timerIdDouble: Double) {
    val timerId = timerIdDouble.toInt()
    javaTimerManager.deleteTimer(timerId)
  }

  override fun setSendIdleEvents(sendIdleEvents: Boolean) {
    javaTimerManager.setSendIdleEvents(sendIdleEvents)
  }

  override fun callTimers(timerIDs: WritableArray) {
    getReactApplicationContextIfActiveOrWarn()
        ?.getJSModule(JSTimers::class.java)
        ?.callTimers(timerIDs)
  }

  override fun callIdleCallbacks(frameTime: Double) {
    getReactApplicationContextIfActiveOrWarn()
        ?.getJSModule(JSTimers::class.java)
        ?.callIdleCallbacks(frameTime)
  }

  override fun emitTimeDriftWarning(warningMessage: String) {
    getReactApplicationContextIfActiveOrWarn()
        ?.getJSModule(JSTimers::class.java)
        ?.emitTimeDriftWarning(warningMessage)
  }

  override fun invalidate() {
    javaTimerManager.onInstanceDestroy()
  }

  @VisibleForTesting
  public fun hasActiveTimersInRange(rangeMs: Long): Boolean =
      javaTimerManager.hasActiveTimersInRange(rangeMs)

  public companion object {
    public const val NAME: String = NativeTimingSpec.NAME
  }
}
