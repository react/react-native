/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T207169925: Migrate CatalystInstance to Reacthost and remove the Suppress("DEPRECATION")
// annotation
@file:Suppress("DEPRECATION")

package com.facebook.react.modules.timing

import android.content.Context
import android.os.Looper
import android.view.Choreographer.FrameCallback
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.common.SystemClock
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.jstasks.HeadlessJsTaskContext
import com.facebook.react.modules.appregistry.AppRegistry
import com.facebook.react.modules.core.JSTimers
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.modules.core.ReactChoreographer.CallbackType
import com.facebook.react.modules.core.TimingModule
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.invocation.InvocationOnMock
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.reset
import org.mockito.kotlin.spy
import org.mockito.kotlin.verify
import org.mockito.kotlin.verifyNoMoreInteractions
import org.mockito.kotlin.whenever
import org.mockito.stubbing.Answer
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

object MockCompat {
  // Same as Mockito's 'eq()', but works for non-nullable types
  fun <T : Any> eq(value: T): T = ArgumentMatchers.eq(value) ?: value

  // Same as Mockito's 'any()', but works for non-nullable types
  fun <T> any(): T {
    ArgumentMatchers.any<T>()
    return uninitialized()
  }

  @Suppress("UNCHECKED_CAST") fun <T> uninitialized(): T = null as T
}

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class TimingModuleTest {
  companion object {
    const val FRAME_TIME_NS = 17 * 1000 * 1000
  }

  private lateinit var reactContext: BridgeReactContext
  private lateinit var headlessContext: HeadlessJsTaskContext
  private lateinit var timingModule: TimingModule
  private lateinit var postFrameCallbackHandler: PostFrameCallbackHandler
  private lateinit var idlePostFrameCallbackHandler: PostFrameCallbackHandler
  private lateinit var jsTimersMock: JSTimers
  private lateinit var systemClock: MockedStatic<SystemClock>
  private lateinit var reactChoreographerMock: ReactChoreographer

  private var currentTimeNs = 0L
  private var reactChoreographerOriginal: ReactChoreographer? = null

  @Before
  fun prepareModules() {
    systemClock = mockStatic(SystemClock::class.java)
    systemClock
        .`when`<Long> { SystemClock.uptimeMillis() }
        .thenAnswer {
          return@thenAnswer currentTimeNs / 1000000
        }
    systemClock
        .`when`<Long> { SystemClock.currentTimeMillis() }
        .thenAnswer {
          return@thenAnswer currentTimeNs / 1000000
        }
    systemClock
        .`when`<Long> { SystemClock.nanoTime() }
        .thenAnswer {
          return@thenAnswer currentTimeNs
        }

    reactChoreographerMock = mock<ReactChoreographer>()
    reactChoreographerOriginal = ReactChoreographer.overrideInstanceForTest(reactChoreographerMock)

    val reactInstance = mock<CatalystInstance>()
    reactContext = spy(BridgeReactContext(mock<Context>()))
    doReturn(reactInstance).`when`(reactContext).catalystInstance
    doReturn(true).`when`(reactContext).hasActiveReactInstance()

    headlessContext = HeadlessJsTaskContext.getInstance(reactContext)

    postFrameCallbackHandler = PostFrameCallbackHandler()
    idlePostFrameCallbackHandler = PostFrameCallbackHandler()

    whenever(
        reactChoreographerMock.postFrameCallback(
            MockCompat.eq(CallbackType.TIMERS_EVENTS),
            MockCompat.any<FrameCallback>(),
        ),
    )
        .thenAnswer {
          return@thenAnswer postFrameCallbackHandler.answer(it)
        }
    whenever(
        reactChoreographerMock.postFrameCallback(
            MockCompat.eq(CallbackType.IDLE_EVENT),
            MockCompat.any<FrameCallback>(),
        ),
    )
        .thenAnswer {
          return@thenAnswer idlePostFrameCallbackHandler.answer(it)
        }

    timingModule = TimingModule(reactContext, mock<DevSupportManager>())
    jsTimersMock = mock<JSTimers>()
    doReturn(jsTimersMock).`when`(reactContext).getJSModule(JSTimers::class.java)
    doReturn(mock<AppRegistry>()).`when`(reactContext).getJSModule(AppRegistry::class.java)
    doAnswer(
        { invocation ->
          (invocation.arguments[0] as Runnable).run()
          return@doAnswer true
        },
    )
        .`when`(reactContext)
        .runOnJSQueueThread(MockCompat.any<Runnable>())

    timingModule.initialize()
  }

  @After
  fun tearDown() {
    systemClock.close()
    ReactChoreographer.overrideInstanceForTest(reactChoreographerOriginal)
  }

  private fun stepChoreographerFrame() {
    shadowOf(Looper.getMainLooper()).idle()

    val callback = postFrameCallbackHandler.getAndResetFrameCallback()
    val idleCallback = idlePostFrameCallbackHandler.getAndResetFrameCallback()
    currentTimeNs += FRAME_TIME_NS
    whenever(SystemClock.uptimeMillis()).thenAnswer {
      return@thenAnswer currentTimeNs / 1000000
    }
    callback?.doFrame(currentTimeNs)
    idleCallback?.doFrame(currentTimeNs)
  }

  @Test
  fun testSimpleTimer() {
    reactContext.onHostResume(null)
    timingModule.createTimer(1.0, 1.0, 0.0, false)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(1.0))
    reset(jsTimersMock)
    stepChoreographerFrame()
    verifyNoMoreInteractions(jsTimersMock)
  }

  @Test
  fun testSimpleRecurringTimer() {
    timingModule.createTimer(100.0, 1.0, 0.0, true)
    reactContext.onHostResume(null)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(100.0))
    reset(jsTimersMock)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(100.0))
  }

  @Test
  fun testCancelRecurringTimer() {
    reactContext.onHostResume(null)
    timingModule.createTimer(105.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(105.0))
    reset(jsTimersMock)
    timingModule.deleteTimer(105.0)
    stepChoreographerFrame()
    verifyNoMoreInteractions(jsTimersMock)
  }

  @Test
  fun testPausingAndResuming() {
    reactContext.onHostResume(null)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jsTimersMock)
    reactContext.onHostPause()
    stepChoreographerFrame()
    verifyNoMoreInteractions(jsTimersMock)
    reset(jsTimersMock)
    reactContext.onHostResume(null)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(41.0))
  }

  @Test
  fun testHeadlessJsTaskInBackground() {
    reactContext.onHostPause()
    val taskConfig = HeadlessJsTaskConfig("foo", JavaOnlyMap())
    val taskId = headlessContext.startTask(taskConfig)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jsTimersMock)
    headlessContext.finishTask(taskId)
    stepChoreographerFrame()
    verifyNoMoreInteractions(jsTimersMock)
  }

  @Test
  fun testHeadlessJsTaskInForeground() {
    val taskConfig = HeadlessJsTaskConfig("foo", JavaOnlyMap())
    val taskId = headlessContext.startTask(taskConfig)
    reactContext.onHostResume(null)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jsTimersMock)
    headlessContext.finishTask(taskId)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jsTimersMock)
    reactContext.onHostPause()
    verifyNoMoreInteractions(jsTimersMock)
  }

  @Test
  fun testHeadlessJsTaskIntertwine() {
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    reactContext.onHostPause()
    val taskConfig = HeadlessJsTaskConfig("foo", JavaOnlyMap())
    val taskId = headlessContext.startTask(taskConfig)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jsTimersMock)
    reactContext.onHostResume(null)
    headlessContext.finishTask(taskId)
    stepChoreographerFrame()
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jsTimersMock)
    reactContext.onHostPause()
    stepChoreographerFrame()
    verifyNoMoreInteractions(jsTimersMock)
  }

  @Test
  fun testSetTimeoutZero() {
    timingModule.createTimer(100.0, 0.0, 0.0, false)
    verify(jsTimersMock).callTimers(JavaOnlyArray.of(100.0))
  }

  @Test
  fun testActiveTimersInRange() {
    reactContext.onHostResume(null)
    assertThat(timingModule.hasActiveTimersInRange(100)).isFalse
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    assertThat(timingModule.hasActiveTimersInRange(100)).isFalse // Repeating
    timingModule.createTimer(42.0, 150.0, 0.0, false)
    assertThat(timingModule.hasActiveTimersInRange(100)).isFalse // Out of range
    assertThat(timingModule.hasActiveTimersInRange(200)).isTrue // In range
  }

  @Test
  fun testIdleCallback() {
    timingModule.setSendIdleEvents(true)
    reactContext.onHostResume(null)
    stepChoreographerFrame()
    verify(jsTimersMock).callIdleCallbacks(SystemClock.currentTimeMillis().toDouble())
  }

  private class PostFrameCallbackHandler : Answer<Unit> {
    private var frameCallback: FrameCallback? = null

    override fun answer(invocation: InvocationOnMock) {
      invocation.arguments[1]?.let { frameCallback = it as FrameCallback }
    }

    fun getAndResetFrameCallback(): FrameCallback? {
      val callback = frameCallback
      frameCallback = null
      return callback
    }
  }
}
