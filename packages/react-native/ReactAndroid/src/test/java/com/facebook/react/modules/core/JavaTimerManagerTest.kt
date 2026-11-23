/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import android.os.Looper
import android.view.Choreographer
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowArguments
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.atLeastOnce
import org.mockito.kotlin.clearInvocations
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class JavaTimerManagerTest {
  private lateinit var reactChoreographer: ReactChoreographer
  private lateinit var timerExecutor: JavaScriptTimerExecutor

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    reactChoreographer = mock()
    timerExecutor = mock()
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun newTimerManager(keepTimersRunningWhileHostPaused: Boolean): JavaTimerManager {
    ReactNativeFeatureFlags.dangerouslyReset()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun keepTimersRunningWhileHostPausedAndroid(): Boolean =
              keepTimersRunningWhileHostPaused
        }
    )
    val timerManager =
        JavaTimerManager(
            mock<ReactApplicationContext>(),
            timerExecutor,
            reactChoreographer,
            mock<DevSupportManager>(),
        )
    shadowOf(Looper.getMainLooper()).idle()
    return timerManager
  }

  private fun postedTimerCallback(): Choreographer.FrameCallback {
    val captor = argumentCaptor<Choreographer.FrameCallback>()
    verify(reactChoreographer)
        .postFrameCallback(eq(ReactChoreographer.CallbackType.TIMERS_EVENTS), captor.capture())
    return captor.firstValue
  }

  @Test
  fun `timers run from creation, survive host pause, and stop on instance destroy`() {
    val timerManager = newTimerManager(keepTimersRunningWhileHostPaused = true)
    timerManager.onHostPause()
    timerManager.createTimer(timerId = 1, delay = 0, repeat = false)

    val frameCallback = postedTimerCallback()
    frameCallback.doFrame(Long.MAX_VALUE)
    verify(timerExecutor).callTimers(any())

    timerManager.onInstanceDestroy()
    timerManager.createTimer(timerId = 2, delay = 0, repeat = false)
    frameCallback.doFrame(Long.MAX_VALUE)
    verify(timerExecutor).callTimers(any())
  }

  @Test
  fun `instance destroy stops timers even while a headless task is active`() {
    for (keepTimersRunningWhileHostPaused in listOf(true, false)) {
      reactChoreographer = mock()
      timerExecutor = mock()
      val timerManager = newTimerManager(keepTimersRunningWhileHostPaused)
      timerManager.onHeadlessJsTaskStart(taskId = 1)
      val frameCallback = postedTimerCallback()

      timerManager.onInstanceDestroy()
      timerManager.createTimer(timerId = 1, delay = 0, repeat = false)
      frameCallback.doFrame(Long.MAX_VALUE)

      verify(timerExecutor, never()).callTimers(any())
      verify(reactChoreographer, times(1))
          .postFrameCallback(eq(ReactChoreographer.CallbackType.TIMERS_EVENTS), any())
    }
  }

  @Test
  fun `a headless task starting after instance destroy does not run timers`() {
    for (keepTimersRunningWhileHostPaused in listOf(true, false)) {
      reactChoreographer = mock()
      timerExecutor = mock()
      val timerManager = newTimerManager(keepTimersRunningWhileHostPaused)
      timerManager.createTimer(timerId = 1, delay = 0, repeat = false)

      timerManager.onInstanceDestroy()
      timerManager.onHeadlessJsTaskStart(taskId = 1)
      val captor = argumentCaptor<Choreographer.FrameCallback>()
      verify(reactChoreographer, atLeastOnce())
          .postFrameCallback(eq(ReactChoreographer.CallbackType.TIMERS_EVENTS), captor.capture())
      clearInvocations(reactChoreographer)
      captor.lastValue.doFrame(Long.MAX_VALUE)

      verify(timerExecutor, never()).callTimers(any())
      verify(reactChoreographer, never())
          .postFrameCallback(eq(ReactChoreographer.CallbackType.TIMERS_EVENTS), any())
    }
  }

  @Test
  fun `timers wait for host resume without the flag`() {
    newTimerManager(keepTimersRunningWhileHostPaused = false)

    verify(reactChoreographer, never())
        .postFrameCallback(eq(ReactChoreographer.CallbackType.TIMERS_EVENTS), any())
  }
}
