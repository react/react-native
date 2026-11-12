/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.os.Build
import androidx.annotation.DoNotInline
import androidx.annotation.RequiresApi

internal object FrameIntervalSources {
  /**
   * The frame interval source for the running Android version: from Android 13 the vsync's frame
   * timelines, with [displayFrameInterval] behind them, and before it [displayFrameInterval] alone.
   */
  @JvmStatic
  fun create(
      displayFrameInterval: DisplayFrameInterval
  ): PreMountItemsBetweenFrames.FrameIntervalSource =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Api33Utils.createVsyncFrameInterval(displayFrameInterval)
      } else {
        displayFrameInterval
      }

  /** Holds the only reference to the Android 13 class, so an older Android never verifies it. */
  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private object Api33Utils {
    @DoNotInline
    fun createVsyncFrameInterval(
        displayFrameInterval: DisplayFrameInterval
    ): PreMountItemsBetweenFrames.FrameIntervalSource = VsyncFrameInterval(displayFrameInterval)
  }
}
