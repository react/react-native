/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.content.Context
import android.hardware.display.DisplayManager
import android.view.Display
import com.facebook.react.bridge.UiThreadUtil

/**
 * The default display's frame interval at its current refresh rate. It is read again when the
 * display reports a change, so a frame never reads the display itself.
 */
internal class DisplayFrameInterval(context: Context) :
    PreMountItemsBetweenFrames.FrameIntervalSource, DisplayManager.DisplayListener {
  private val displayManager: DisplayManager? = context.getSystemService(DisplayManager::class.java)

  @Volatile private var frameIntervalNanos: Long? = null

  fun start() {
    displayManager?.registerDisplayListener(this, UiThreadUtil.getUiThreadHandler())
    // Read once the listener is registered, so a change between the two is not lost, and on the
    // listener's thread, so neither store overwrites the other with an older rate. From Android 16
    // a listener also gets refresh-rate changes only once the process has read the rate.
    if (UiThreadUtil.isOnUiThread()) {
      frameIntervalNanos = readFrameIntervalNanos()
    } else {
      UiThreadUtil.runOnUiThread { frameIntervalNanos = readFrameIntervalNanos() }
    }
  }

  fun stop() {
    displayManager?.unregisterDisplayListener(this)
  }

  override fun frameIntervalNanos(): Long? = frameIntervalNanos

  override fun onDisplayChanged(displayId: Int) {
    if (displayId == Display.DEFAULT_DISPLAY) {
      frameIntervalNanos = readFrameIntervalNanos()
    }
  }

  override fun onDisplayAdded(displayId: Int): Unit = Unit

  override fun onDisplayRemoved(displayId: Int): Unit = Unit

  private fun readFrameIntervalNanos(): Long? {
    val refreshRate = displayManager?.getDisplay(Display.DEFAULT_DISPLAY)?.refreshRate ?: 0f
    return if (refreshRate > 0f) (NANOSECONDS_PER_SECOND / refreshRate).toLong() else null
  }

  private companion object {
    private const val NANOSECONDS_PER_SECOND: Double = 1_000_000_000.0
  }
}
