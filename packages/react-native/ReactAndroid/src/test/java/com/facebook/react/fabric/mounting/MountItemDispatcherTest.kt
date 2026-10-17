/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import com.facebook.react.common.SystemClock
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowPerformanceTracer
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows = [ShadowSoLoader::class, ShadowNativeLoader::class, ShadowPerformanceTracer::class]
)
class MountItemDispatcherTest {
  private lateinit var systemClock: MockedStatic<SystemClock>
  private lateinit var dispatcher: MountItemDispatcher
  private var nowNanos: Long = 0L
  private var executedItems: Int = 0
  private var displayFrameIntervalNanos: Long? = SIXTY_HERTZ_FRAME_NANOS

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    systemClock = mockStatic(SystemClock::class.java)
    systemClock.`when`<Long> { SystemClock.nanoTime() }.thenAnswer { nowNanos }
    val mountingManager = mock<MountingManager>()
    whenever(mountingManager.surfaceIsStopped(any())).thenReturn(false)
    whenever(mountingManager.isWaitingForViewAttach(any())).thenReturn(false)
    dispatcher = MountItemDispatcher(mountingManager, mock()) { displayFrameIntervalNanos }
  }

  @After
  fun tearDown() {
    systemClock.close()
  }

  /** Queues items that each take [costNanos] of the frame to execute. */
  private fun queuePreMountItems(count: Int, costNanos: Long) {
    repeat(count) {
      dispatcher.addPreAllocateMountItem(
          object : MountItem {
            override fun execute(mountingManager: MountingManager) {
              executedItems++
              nowNanos += costNanos
            }

            override fun getSurfaceId(): Int = SURFACE_ID
          }
      )
    }
  }

  /**
   * Runs one frame of pre-mounting starting at [frameTimeNanos] and returns how many items it
   * executed.
   */
  private fun preMountFrame(frameTimeNanos: Long): Int {
    nowNanos = frameTimeNanos
    val before = executedItems
    dispatcher.dispatchPreMountItems(frameTimeNanos)
    return executedItems - before
  }

  /** Runs one frame at each refresh rate and returns how many items each frame pre-mounted. */
  private fun preMountFrameAtEachRefreshRate(refreshRates: List<Int>): Map<Int, Int> =
      refreshRates.withIndex().associate { (index, refreshRate) ->
        displayFrameIntervalNanos = NANOSECONDS_PER_SECOND / refreshRate
        queuePreMountItems(count = 20, costNanos = MILLISECOND_NANOS)
        refreshRate to preMountFrame(FIRST_FRAME_NANOS + index * NANOSECONDS_PER_SECOND)
      }

  @Test
  fun preMountsForHalfOfTheDisplaysFrameFromThirtyHertzUp() {
    // Items start at 0, 1, 2, ... ms, and the first one starting past half of the frame waits for
    // the next frame: half of a 30 Hz frame is 16.67 ms, of a 185 Hz frame 2.70 ms.
    assertThat(preMountFrameAtEachRefreshRate(listOf(30, 48, 60, 90, 120, 144, 165, 185, 240)))
        .isEqualTo(
            mapOf(
                30 to 17,
                48 to 11,
                60 to 9,
                90 to 6,
                120 to 5,
                144 to 4,
                165 to 4,
                185 to 3,
                240 to 3,
            )
        )
  }

  @Test
  fun neverPreMountsLongerThanHalfOfAThirtyHertzFrameBelowThirtyHertz() {
    // Half of a 1 Hz frame would be 500 ms; every rate below 30 Hz keeps 16.67 ms.
    assertThat(preMountFrameAtEachRefreshRate(listOf(1, 10, 24)))
        .isEqualTo(mapOf(1 to 17, 10 to 17, 24 to 17))
  }

  @Test
  fun preMountsForHalfOfASixtyHertzFrameWhileTheDisplayReportsNoRate() {
    displayFrameIntervalNanos = null
    queuePreMountItems(count = 20, costNanos = MILLISECOND_NANOS)

    assertThat(preMountFrame(FIRST_FRAME_NANOS)).isEqualTo(9)
  }

  @Test
  fun theBudgetFollowsTheDisplayBackToSixtyHertz() {
    displayFrameIntervalNanos = ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 20, costNanos = MILLISECOND_NANOS)
    assertThat(preMountFrame(FIRST_FRAME_NANOS)).isEqualTo(5)

    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS

    assertThat(preMountFrame(FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS)).isEqualTo(9)
  }

  @Test
  fun aSkippedFrameKeepsTheDisplaysBudget() {
    displayFrameIntervalNanos = ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 20, costNanos = MILLISECOND_NANOS)
    assertThat(preMountFrame(FIRST_FRAME_NANOS)).isEqualTo(5)

    // The next frame runs two vsyncs later; the budget still comes from the display.
    assertThat(preMountFrame(FIRST_FRAME_NANOS + 2 * ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS))
        .isEqualTo(5)
  }

  private companion object {
    const val SURFACE_ID: Int = 1
    const val MILLISECOND_NANOS: Long = 1_000_000L
    const val NANOSECONDS_PER_SECOND: Long = 1_000_000_000L
    const val FIRST_FRAME_NANOS: Long = NANOSECONDS_PER_SECOND
    const val SIXTY_HERTZ_FRAME_NANOS: Long = NANOSECONDS_PER_SECOND / 60
    const val ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS: Long = NANOSECONDS_PER_SECOND / 120
  }
}
