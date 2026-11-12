/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.os.Build
import android.view.Choreographer
import androidx.annotation.RequiresApi
import androidx.annotation.UiThread
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.infer.annotation.ThreadConfined.UI
import com.facebook.react.common.SystemClock

/**
 * The interval the app's frames run at, from the frame timelines the Choreographer hands a vsync
 * callback from Android 13: they are spaced by the rate the frames run at, where the display's
 * refresh rate can report its mode's. [requestNextFrameInterval] asks for the next vsync's
 * timelines, and a spacing more than two frames old, or a vsync that offers fewer than two
 * timelines, leaves the answer to [displayFrameInterval].
 */
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
internal class VsyncFrameInterval(
    private val displayFrameInterval: PreMountItemsBetweenFrames.FrameIntervalSource,
) : PreMountItemsBetweenFrames.FrameIntervalSource, Choreographer.VsyncCallback {
  /** Zero while no vsync has offered a spacing. */
  private var timelineSpacingNanos: Long = 0L
  private var timelineFrameTimeNanos: Long = 0L
  private var isVsyncCallbackPosted: Boolean = false

  @UiThread
  @ThreadConfined(UI)
  override fun frameIntervalNanos(): Long? {
    val spacingNanos = timelineSpacingNanos
    return if (
        spacingNanos > 0L &&
            SystemClock.nanoTime() - timelineFrameTimeNanos <= MAX_SPACING_AGE_FRAMES * spacingNanos
    ) {
      spacingNanos
    } else {
      displayFrameInterval.frameIntervalNanos()
    }
  }

  @UiThread
  @ThreadConfined(UI)
  override fun requestNextFrameInterval() {
    if (!isVsyncCallbackPosted) {
      isVsyncCallbackPosted = true
      Choreographer.getInstance().postVsyncCallback(this)
    }
  }

  @UiThread
  @ThreadConfined(UI)
  override fun onVsync(data: Choreographer.FrameData) {
    isVsyncCallbackPosted = false
    val timelines = data.frameTimelines
    timelineSpacingNanos =
        if (timelines.size < 2) {
          0L
        } else {
          computeTimelineSpacingNanos(
              timelines[0].expectedPresentationTimeNanos,
              timelines[1].expectedPresentationTimeNanos,
          )
        }
    timelineFrameTimeNanos = data.frameTimeNanos
  }

  @UiThread
  @ThreadConfined(UI)
  override fun cancel() {
    if (isVsyncCallbackPosted) {
      Choreographer.getInstance().removeVsyncCallback(this)
      isVsyncCallbackPosted = false
    }
    timelineSpacingNanos = 0L
  }

  internal companion object {
    private const val MAX_SPACING_AGE_FRAMES: Long = 2L

    /** How far apart two consecutive frame timelines present, or zero when they do not advance. */
    fun computeTimelineSpacingNanos(
        firstPresentationTimeNanos: Long,
        secondPresentationTimeNanos: Long,
    ): Long = (secondPresentationTimeNanos - firstPresentationTimeNanos).coerceAtLeast(0L)
  }
}
