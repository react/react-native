/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.os.Looper
import android.view.Display
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.ShadowDisplay
import org.robolectric.shadows.ShadowDisplayManager

@RunWith(RobolectricTestRunner::class)
class DisplayFrameIntervalTest {
  private val display: Display = ShadowDisplay.getDefaultDisplay()

  private fun setRefreshRate(refreshRate: Float) {
    shadowOf(display).setRefreshRate(refreshRate)
    ShadowDisplayManager.changeDisplay(Display.DEFAULT_DISPLAY, "")
    shadowOf(Looper.getMainLooper()).idle()
  }

  @Test
  fun readsTheDefaultDisplaysFrameAtEveryRefreshRate() {
    val frameIntervalNanosByRefreshRate =
        listOf(1f, 60f, 90f, 120f, 144f, 165f, 185f, 240f).associateWith { refreshRate ->
          setRefreshRate(refreshRate)
          DisplayFrameInterval(RuntimeEnvironment.getApplication()).frameIntervalNanos()
        }

    assertThat(frameIntervalNanosByRefreshRate)
        .isEqualTo(
            mapOf(
                1f to 1_000_000_000L,
                60f to 16_666_666L,
                90f to 11_111_111L,
                120f to 8_333_333L,
                144f to 6_944_444L,
                165f to 6_060_606L,
                185f to 5_405_405L,
                240f to 4_166_666L,
            )
        )
  }

  @Test
  fun followsARefreshRateChangeTheDisplayReports() {
    setRefreshRate(120f)
    val frameInterval = DisplayFrameInterval(RuntimeEnvironment.getApplication())
    frameInterval.start()

    setRefreshRate(60f)

    assertThat(frameInterval.frameIntervalNanos()).isEqualTo(SIXTY_HERTZ_FRAME_NANOS)
  }

  @Test
  fun keepsItsFrameOnceStopped() {
    setRefreshRate(120f)
    val frameInterval = DisplayFrameInterval(RuntimeEnvironment.getApplication())
    frameInterval.start()
    frameInterval.stop()

    setRefreshRate(60f)

    assertThat(frameInterval.frameIntervalNanos()).isEqualTo(ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS)
  }

  @Test
  fun reportsNoFrameWhileTheDisplayReportsNoRefreshRate() {
    setRefreshRate(0f)

    assertThat(DisplayFrameInterval(RuntimeEnvironment.getApplication()).frameIntervalNanos())
        .isNull()
  }

  private companion object {
    const val SIXTY_HERTZ_FRAME_NANOS: Long = 1_000_000_000L / 60
    const val ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS: Long = 1_000_000_000L / 120
  }
}
