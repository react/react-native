/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.view.View
import android.widget.FrameLayout
import android.widget.TextView
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.ReactConstants
import com.facebook.react.modules.debug.FpsDebugFrameCallback
import java.util.Locale

/**
 * View that automatically monitors and displays the current app frame rate. Also logs the current
 * FPS to logcat while active.
 *
 * NB: Requires API 16 for use of FpsDebugFrameCallback.
 */
internal class FpsView(reactContext: ReactContext) : FrameLayout(reactContext) {
  private val textView: TextView
  private val frameCallback: FpsDebugFrameCallback
  private val fpsMonitorRunnable: FPSMonitorRunnable

  init {
    inflate(reactContext, R.layout.fps_view, this)
    textView = findViewById<View>(R.id.fps_text) as TextView
    frameCallback = FpsDebugFrameCallback(reactContext)
    fpsMonitorRunnable = FPSMonitorRunnable()
    setCurrentFPS(0.0, 0.0, 0, 0, frameCallback.isRunningOnFabric)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    frameCallback.reset()
    frameCallback.start()
    fpsMonitorRunnable.start()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    frameCallback.stop()
    fpsMonitorRunnable.stop()
  }

  private fun setCurrentFPS(
      currentFPS: Double,
      currentJSFPS: Double,
      droppedUIFrames: Int,
      total4PlusFrameStutters: Int,
      runningOnFabric: Boolean,
  ) {
    var fpsString =
        String.format(
            Locale.US,
            "UI: %.1f fps\n%d dropped so far\n%d stutters (4+) so far",
            currentFPS,
            droppedUIFrames,
            total4PlusFrameStutters,
        )
    if (!runningOnFabric) {
      // The JS FPS is only relevant for the legacy architecture, as Fabric we don't use
      // BridgeIdleDebugListener to track JS frame drops.
      fpsString += String.format(Locale.US, "\nJS: %.1f fps", currentJSFPS)
    }
    textView.text = fpsString
    FLog.d(ReactConstants.TAG, fpsString)
  }

  /** Timer that runs every UPDATE_INTERVAL_MS ms and updates the currently displayed FPS. */
  private inner class FPSMonitorRunnable : Runnable {
    private var shouldStop = false
    private var totalFramesDropped = 0
    private var total4PlusFrameStutters = 0

    override fun run() {
      if (shouldStop) {
        return
      }
      totalFramesDropped += frameCallback.expectedNumFrames - frameCallback.numFrames
      total4PlusFrameStutters += frameCallback.get4PlusFrameStutters()
      setCurrentFPS(
          frameCallback.fps,
          frameCallback.jsFPS,
          totalFramesDropped,
          total4PlusFrameStutters,
          frameCallback.isRunningOnFabric,
      )
      frameCallback.reset()
      postDelayed(this, UPDATE_INTERVAL_MS.toLong())
    }

    fun start() {
      shouldStop = false
      post(this)
    }

    fun stop() {
      shouldStop = true
    }
  }

  companion object {
    private const val UPDATE_INTERVAL_MS = 500
  }
}
