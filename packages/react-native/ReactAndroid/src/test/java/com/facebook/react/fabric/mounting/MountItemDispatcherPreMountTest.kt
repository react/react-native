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
class MountItemDispatcherPreMountTest {
  private lateinit var systemClock: MockedStatic<SystemClock>
  private lateinit var dispatcher: MountItemDispatcher
  private var nowNanos: Long = 0L
  private val executed: MutableList<String> = mutableListOf()

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    systemClock = mockStatic(SystemClock::class.java)
    systemClock.`when`<Long> { SystemClock.nanoTime() }.thenAnswer { nowNanos }
    val mountingManager = mock<MountingManager>()
    whenever(mountingManager.surfaceIsStopped(any())).thenReturn(false)
    whenever(mountingManager.isWaitingForViewAttach(any())).thenReturn(false)
    dispatcher = MountItemDispatcher(mountingManager, mock())
  }

  @After
  fun tearDown() {
    systemClock.close()
  }

  private fun recordingItem(name: String, costNanos: Long): MountItem =
      object : MountItem {
        override fun execute(mountingManager: MountingManager) {
          executed.add(name)
          nowNanos += costNanos
        }

        override fun getSurfaceId(): Int = SURFACE_ID
      }

  private fun queuePreMountItems(count: Int, costNanos: Long) {
    repeat(count) { index ->
      dispatcher.addPreAllocateMountItem(recordingItem("premount $index", costNanos))
    }
  }

  @Test
  fun preMountsForHalfOfASixtyHertzFrameFromTheFrameStart() {
    queuePreMountItems(count = 20, costNanos = MILLISECOND_NANOS)
    nowNanos = FIRST_FRAME_NANOS

    dispatcher.dispatchPreMountItems(FIRST_FRAME_NANOS)

    // Items start at 0, 1, ... 8 ms; 8.33 ms is half of a 60 Hz frame.
    assertThat(executed).hasSize(9)
  }

  @Test
  fun preMountsUntilADeadlineAndReportsWhetherItemsAreLeft() {
    queuePreMountItems(count = 6, costNanos = MILLISECOND_NANOS)
    nowNanos = FIRST_FRAME_NANOS

    val itemsLeft = dispatcher.dispatchPreMountItemsUntil(FIRST_FRAME_NANOS + 3 * MILLISECOND_NANOS)

    assertThat(executed).hasSize(4)
    assertThat(itemsLeft).isTrue()
    assertThat(dispatcher.dispatchPreMountItemsUntil(nowNanos + SECOND_NANOS)).isFalse()
    assertThat(executed).hasSize(6)
    assertThat(dispatcher.hasPreMountItems()).isFalse()
  }

  @Test
  fun aMountBatchRunsEveryPreMountItemLeftBeforeItself() {
    queuePreMountItems(count = 3, costNanos = MILLISECOND_NANOS)
    dispatcher.addMountItem(recordingItem("mount", costNanos = 0L))

    dispatcher.tryDispatchMountItems()

    assertThat(executed).containsExactly("premount 0", "premount 1", "premount 2", "mount")
  }

  private companion object {
    const val SURFACE_ID: Int = 1
    const val MILLISECOND_NANOS: Long = 1_000_000L
    const val SECOND_NANOS: Long = 1_000_000_000L
    const val FIRST_FRAME_NANOS: Long = SECOND_NANOS
  }
}
