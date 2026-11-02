/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.os.Looper
import android.view.Choreographer
import com.facebook.react.common.SystemClock
import java.time.Duration
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.LooperMode

@RunWith(RobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
class VsyncFrameIntervalTest {
  private lateinit var systemClock: MockedStatic<SystemClock>
  private var nowNanos: Long = FRAME_TIME_NANOS

  @Before
  fun setUp() {
    systemClock = mockStatic(SystemClock::class.java)
    systemClock.`when`<Long> { SystemClock.nanoTime() }.thenAnswer { nowNanos }
  }

  @After
  fun tearDown() {
    systemClock.close()
  }

  private fun frameDataPresentingAt(
      vararg expectedPresentationTimesNanos: Long
  ): Choreographer.FrameData {
    val timelines =
        expectedPresentationTimesNanos
            .map { presentationTimeNanos ->
              mock<Choreographer.FrameTimeline> {
                on { expectedPresentationTimeNanos } doReturn presentationTimeNanos
              }
            }
            .toTypedArray()
    return mock {
      on { frameTimelines } doReturn timelines
      on { frameTimeNanos } doReturn FRAME_TIME_NANOS
    }
  }

  @Test
  fun aVsyncsFrameTimelinesAreSpacedByTheFrameInterval() {
    assertThat(
            VsyncFrameInterval.computeTimelineSpacingNanos(
                FRAME_TIME_NANOS,
                FRAME_TIME_NANOS + SIXTY_HERTZ_FRAME_NANOS,
            )
        )
        .isEqualTo(SIXTY_HERTZ_FRAME_NANOS)
    assertThat(VsyncFrameInterval.computeTimelineSpacingNanos(1L, 1L)).isZero()
  }

  @Test
  fun aVsyncsTimelineSpacingAnswersInsteadOfTheDisplaysInterval() {
    // The display reports its 120 Hz mode while the app's frames run at 60 Hz.
    val frameInterval = VsyncFrameInterval { ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS }

    frameInterval.onVsync(frameDataPresentingAt(0L, SIXTY_HERTZ_FRAME_NANOS))

    assertThat(frameInterval.frameIntervalNanos()).isEqualTo(SIXTY_HERTZ_FRAME_NANOS)
  }

  @Test
  fun aSpacingMoreThanTwoFramesOldLeavesTheDisplaysInterval() {
    val frameInterval = VsyncFrameInterval { ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS }
    frameInterval.onVsync(frameDataPresentingAt(0L, SIXTY_HERTZ_FRAME_NANOS))

    // The next burst starts after the frame callback stopped, when the rate may have changed.
    nowNanos = FRAME_TIME_NANOS + 3 * SIXTY_HERTZ_FRAME_NANOS

    assertThat(frameInterval.frameIntervalNanos()).isEqualTo(ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS)
  }

  @Test
  fun aVsyncWithOneTimelineLeavesTheDisplaysInterval() {
    val frameInterval = VsyncFrameInterval { ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS }

    frameInterval.onVsync(frameDataPresentingAt(0L))

    assertThat(frameInterval.frameIntervalNanos()).isEqualTo(ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS)
  }

  @Test
  fun cancellingDropsTheTimelineSpacing() {
    val frameInterval = VsyncFrameInterval { ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS }
    frameInterval.onVsync(frameDataPresentingAt(0L, SIXTY_HERTZ_FRAME_NANOS))

    frameInterval.cancel()

    assertThat(frameInterval.frameIntervalNanos()).isEqualTo(ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS)
  }

  @Test
  fun aRequestedVsyncWithOneTimelineLeavesTheDisplaysInterval() {
    val frameInterval = VsyncFrameInterval { ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS }

    frameInterval.requestNextFrameInterval()
    // Robolectric's Android 13 vsync carries a single frame timeline.
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(VSYNC_WAIT_MILLISECONDS))

    assertThat(frameInterval.frameIntervalNanos()).isEqualTo(ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS)
  }

  private companion object {
    const val FRAME_TIME_NANOS: Long = 1_000_000_000L
    const val SIXTY_HERTZ_FRAME_NANOS: Long = 1_000_000_000L / 60
    const val ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS: Long = 1_000_000_000L / 120
    const val VSYNC_WAIT_MILLISECONDS: Long = 50L
  }
}
