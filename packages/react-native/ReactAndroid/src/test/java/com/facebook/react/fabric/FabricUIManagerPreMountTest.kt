/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import android.os.Build
import android.os.Looper
import android.view.Choreographer
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.common.SystemClock
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.mounting.MountItemDispatcher
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.testutils.fakes.FakeBatchEventDispatchedListener
import com.facebook.testutils.shadows.ShadowFabricUIManagerBinding
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowPerformanceTracer
import com.facebook.testutils.shadows.ShadowSoLoader
import kotlin.concurrent.thread
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode
import org.robolectric.shadows.ShadowDisplay
import org.robolectric.util.ReflectionHelpers

/**
 * Drives FabricUIManager's DISPATCH_UI frame callback as the Choreographer does, with React
 * Native's clock under the test's control, to pin where a frame's pre-mount items run.
 */
@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowPerformanceTracer::class,
            ShadowFabricUIManagerBinding::class,
        ],
)
class FabricUIManagerPreMountTest {
  private lateinit var systemClock: MockedStatic<SystemClock>
  private lateinit var reactChoreographer: ReactChoreographer
  private var originalReactChoreographer: ReactChoreographer? = null
  private var isReactChoreographerOverridden: Boolean = false
  private lateinit var reactContext: ReactApplicationContext
  private lateinit var underTest: FabricUIManager
  private lateinit var dispatcher: MountItemDispatcher
  private lateinit var dispatchUiFrameCallback: Choreographer.FrameCallback
  private val handledExceptions: MutableList<Exception> = mutableListOf()
  private var nowNanos: Long = FIRST_FRAME_NANOS
  private var executedPreMountItems: Int = 0

  private fun start(preMountBetweenFrames: Boolean) {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enablePremountItemsBetweenFramesAndroid(): Boolean = preMountBetweenFrames
        },
    )
    systemClock = mockStatic(SystemClock::class.java)
    systemClock.`when`<Long> { SystemClock.nanoTime() }.thenAnswer { nowNanos }
    reactChoreographer = mock()
    originalReactChoreographer = ReactChoreographer.overrideInstanceForTest(reactChoreographer)
    isReactChoreographerOverridden = true
    reactContext =
        spy(ReactTestHelper.createTestReactApplicationContext(RuntimeEnvironment.getApplication()))
    doAnswer { invocation ->
          handledExceptions.add(invocation.getArgument(0))
          null
        }
        .whenever(reactContext)
        .handleException(any())
    underTest =
        FabricUIManager(
            reactContext,
            ViewManagerRegistry(emptyList()),
            FakeBatchEventDispatchedListener(),
        )
    dispatcher = ReflectionHelpers.getField(underTest, "mMountItemDispatcher")
    underTest.onHostResume()
    val frameCallback = argumentCaptor<Choreographer.FrameCallback>()
    verify(reactChoreographer)
        .postFrameCallback(eq(ReactChoreographer.CallbackType.DISPATCH_UI), frameCallback.capture())
    dispatchUiFrameCallback = frameCallback.firstValue
  }

  /** Undoes only what [start] got to, so a failing start reports its own error. */
  @After
  fun tearDown() {
    if (isReactChoreographerOverridden) {
      ReactChoreographer.overrideInstanceForTest(originalReactChoreographer)
    }
    if (::systemClock.isInitialized) {
      systemClock.close()
    }
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  /** Queues items that each take 1 ms and run [onExecute] when they execute. */
  private fun queuePreMountItems(count: Int, onExecute: (index: Int) -> Unit = {}) {
    repeat(count) { index ->
      dispatcher.addPreAllocateMountItem(
          object : MountItem {
            override fun execute(mountingManager: MountingManager) {
              onExecute(index)
              executedPreMountItems++
              nowNanos += MILLISECOND_NANOS
            }

            override fun getSurfaceId(): Int = SURFACE_ID
          }
      )
    }
  }

  /**
   * Runs the DISPATCH_UI callback of the frame at [frameTimeNanos] and returns how many pre-mount
   * items it ran.
   */
  private fun runFrame(frameTimeNanos: Long): Int {
    nowNanos = frameTimeNanos
    val before = executedPreMountItems
    dispatchUiFrameCallback.doFrame(frameTimeNanos)
    return executedPreMountItems - before
  }

  /** Runs everything queued on the UI thread and returns how many pre-mount items it ran. */
  private fun runBetweenFrames(): Int {
    val before = executedPreMountItems
    shadowOf(Looper.getMainLooper()).idle()
    return executedPreMountItems - before
  }

  @Test
  fun withTheFlagOff_aFramePreMountsInsideItsCallbackForHalfOfASixtyHertzFrame() {
    start(preMountBetweenFrames = false)
    queuePreMountItems(count = 20)

    assertThat(runFrame(FIRST_FRAME_NANOS)).isEqualTo(9)
    assertThat(runBetweenFrames()).isZero()
  }

  @Test
  fun withTheFlagOn_aFramePreMountsAfterItsCallbackUntilTheNextVsync() {
    start(preMountBetweenFrames = true)
    queuePreMountItems(count = 20)

    assertThat(runFrame(FIRST_FRAME_NANOS)).isZero()
    assertThat(runBetweenFrames()).isEqualTo(17)
  }

  private fun preMountAfterAFrameOnAOneHundredTwentyHertzDisplay(): Int {
    shadowOf(ShadowDisplay.getDefaultDisplay()).setRefreshRate(120f)
    start(preMountBetweenFrames = true)
    underTest.initialize()
    queuePreMountItems(count = 20)
    runFrame(FIRST_FRAME_NANOS)
    return runBetweenFrames()
  }

  @Test
  fun withTheFlagOn_initializeReadsTheDisplaysRefreshRate() {
    // At 120 Hz the next vsync is 8.33 ms away: items start at 0 to 8 ms.
    assertThat(preMountAfterAFrameOnAOneHundredTwentyHertzDisplay()).isEqualTo(9)
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.Q])
  fun withTheFlagOnBeforeAndroid13_initializeReadsTheDisplaysRefreshRate() {
    assertThat(preMountAfterAFrameOnAOneHundredTwentyHertzDisplay()).isEqualTo(9)
  }

  @Test
  fun withTheFlagOn_aFrameAfterOneWhoseDrawSleptPreMountsInsideItsCallback() {
    start(preMountBetweenFrames = true)
    queuePreMountItems(count = 40)
    val secondFrameNanos = FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS
    runFrame(FIRST_FRAME_NANOS)

    // The frame's draw sleeps until the next vsync, waiting on the render thread.
    nowNanos = secondFrameNanos

    assertThat(runBetweenFrames()).isZero()
    assertThat(runFrame(secondFrameNanos)).isEqualTo(9)
  }

  @Test
  fun withTheFlagOn_pausingCancelsThePreMountingQueuedAfterAFrame() {
    start(preMountBetweenFrames = true)
    queuePreMountItems(count = 20)
    runFrame(FIRST_FRAME_NANOS)

    underTest.onHostPause()

    assertThat(runBetweenFrames()).isZero()
  }

  @Test
  fun withTheFlagOn_aFrameWhoseMountFailsPreMountsNothingAfterIt() {
    start(preMountBetweenFrames = true)
    underTest.addUIManagerEventListener(FailingWillMountItemsListener())
    queuePreMountItems(count = 3)
    dispatcher.addMountItem(
        object : MountItem {
          override fun execute(mountingManager: MountingManager) = Unit

          override fun getSurfaceId(): Int = SURFACE_ID
        }
    )

    runFrame(FIRST_FRAME_NANOS)

    assertThat(handledExceptions).hasSize(1)
    assertThat(runBetweenFrames()).isZero()
    assertThat(runFrame(FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS)).isZero()
    assertThat(runBetweenFrames()).isZero()
  }

  @Test
  fun withTheFlagOn_aSliceQueuedBeforeAFrameWhoseMountFailsRunsNothing() {
    start(preMountBetweenFrames = true)
    queuePreMountItems(count = 20)
    runFrame(FIRST_FRAME_NANOS)
    underTest.addUIManagerEventListener(FailingWillMountItemsListener())
    dispatcher.addMountItem(
        object : MountItem {
          override fun execute(mountingManager: MountingManager) = Unit

          override fun getSurfaceId(): Int = SURFACE_ID
        }
    )

    // The display runs faster than the interval the slices were queued for, so the next frame
    // comes while they are still queued, and its mount fails.
    runFrame(FIRST_FRAME_NANOS + 5 * MILLISECOND_NANOS)

    assertThat(handledExceptions).hasSize(1)
    assertThat(runBetweenFrames()).isZero()
  }

  @Test
  fun withTheFlagOn_invalidatingFromAnotherThreadStopsTheSlices() {
    start(preMountBetweenFrames = true)
    queuePreMountItems(count = 20) { index ->
      if (index == 0) {
        // React Native destroys an instance on a background thread, here while a slice runs.
        thread { underTest.invalidate() }.join()
      }
    }
    runFrame(FIRST_FRAME_NANOS)

    // The slice that was running finishes its 1 ms, and none runs after it.
    assertThat(runBetweenFrames()).isEqualTo(2)
  }

  private class FailingWillMountItemsListener : UIManagerListener {
    override fun willDispatchViewUpdates(uiManager: UIManager) = Unit

    override fun willMountItems(uiManager: UIManager) {
      throw IllegalStateException("willMountItems failed")
    }

    override fun didMountItems(uiManager: UIManager) = Unit

    override fun didDispatchMountItems(uiManager: UIManager) = Unit

    override fun didScheduleMountItems(uiManager: UIManager) = Unit
  }

  private companion object {
    const val SURFACE_ID: Int = 1
    const val MILLISECOND_NANOS: Long = 1_000_000L
    const val SIXTY_HERTZ_FRAME_NANOS: Long = 1_000_000_000L / 60
    const val FIRST_FRAME_NANOS: Long = 1_000_000_000L
  }
}
