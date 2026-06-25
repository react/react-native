/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

import android.graphics.Bitmap
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.view.FrameMetrics
import android.view.PixelCopy
import android.view.Window
import com.facebook.proguard.annotations.DoNotStripAny
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.launch

@DoNotStripAny
internal class FrameTimingsObserver(
    private val screenshotsEnabled: Boolean,
    private val onFrameTimingSequence: (sequence: FrameTimingSequence) -> Unit,
) {
  private val isSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
  private val mainHandler = Handler(Looper.getMainLooper())

  // Serial dispatcher for encoding work (single background thread). We limit to 1 thread to
  // minimize the performance impact of screenshot recording.
  private val encodingDispatcher: CoroutineDispatcher =
      Executors.newSingleThreadExecutor().asCoroutineDispatcher()

  // Stores the most recently captured frame to opportunistically encode after the current frame.
  // Replaced frames are emitted as timings without screenshots.
  private val lastFrameBuffer = AtomicReference<FrameData?>(null)

  private var frameCounter: Int = 0
  private val encodingInProgress = AtomicBoolean(false)
  @Volatile private var isTracing: Boolean = false
  @Volatile private var currentWindow: Window? = null

  private data class FrameData(
      val bitmap: Bitmap,
      val frameId: Int,
      val threadId: Int,
      val beginTimestamp: Long,
      val endTimestamp: Long,
  )

  fun start() {
    if (!isSupported) {
      return
    }

    frameCounter = 0
    encodingInProgress.set(false)
    lastFrameBuffer.set(null)
    isTracing = true

    // Emit initial frame event
    val timestamp = System.nanoTime()
    emitFrameTiming(timestamp, timestamp)

    currentWindow?.addOnFrameMetricsAvailableListener(frameMetricsListener, mainHandler)
  }

  fun stop() {
    if (!isSupported) {
      return
    }

    isTracing = false

    currentWindow?.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    mainHandler.removeCallbacksAndMessages(null)
    lastFrameBuffer.getAndSet(null)?.bitmap?.recycle()
  }

  fun setCurrentWindow(window: Window?) {
    if (!isSupported || currentWindow === window) {
      return
    }

    currentWindow?.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    currentWindow = window
    if (isTracing) {
      currentWindow?.addOnFrameMetricsAvailableListener(frameMetricsListener, mainHandler)
    }
  }

  private val frameMetricsListener = Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
    // Guard against calls after stop()
    if (!isTracing) {
      return@OnFrameMetricsAvailableListener
    }
    val beginTimestamp = frameMetrics.getMetric(FrameMetrics.VSYNC_TIMESTAMP)
    val endTimestamp = beginTimestamp + frameMetrics.getMetric(FrameMetrics.TOTAL_DURATION)
    emitFrameTiming(beginTimestamp, endTimestamp)
  }

  private fun emitFrameTiming(beginTimestamp: Long, endTimestamp: Long) {
    val frameId = frameCounter++
    val threadId = Process.myTid()

    if (!screenshotsEnabled) {
      // Screenshots disabled - emit without screenshot
      emitFrameEvent(frameId, threadId, beginTimestamp, endTimestamp, null)
      return
    }

    captureScreenshot(frameId, threadId, beginTimestamp, endTimestamp) { frameData ->
      if (frameData != null) {
        if (encodingInProgress.compareAndSet(false, true)) {
          // Not encoding - encode this frame immediately
          encodeFrame(frameData)
        } else {
          // Encoding thread busy - store current screenshot in buffer for tail-capture
          val oldFrameData = lastFrameBuffer.getAndSet(frameData)
          if (oldFrameData != null) {
            // Skipped frame - emit event without screenshot
            emitFrameEvent(
                oldFrameData.frameId,
                oldFrameData.threadId,
                oldFrameData.beginTimestamp,
                oldFrameData.endTimestamp,
                null,
            )
            oldFrameData.bitmap.recycle()
          }
        }
      } else {
        // Failed to capture (e.g. timeout) - emit without screenshot
        emitFrameEvent(frameId, threadId, beginTimestamp, endTimestamp, null)
      }
    }
  }

  private fun emitFrameEvent(
      frameId: Int,
      threadId: Int,
      beginTimestamp: Long,
      endTimestamp: Long,
      screenshot: ByteArray?,
  ) {
    CoroutineScope(Dispatchers.Default).launch {
      onFrameTimingSequence(
          FrameTimingSequence(frameId, threadId, beginTimestamp, endTimestamp, screenshot)
      )
    }
  }

  private fun encodeFrame(frameData: FrameData) {
    CoroutineScope(encodingDispatcher).launch {
      try {
        val screenshot = encodeScreenshot(frameData.bitmap)
        emitFrameEvent(
            frameData.frameId,
            frameData.threadId,
            frameData.beginTimestamp,
            frameData.endTimestamp,
            screenshot,
        )
      } finally {
        frameData.bitmap.recycle()
      }

      // Clear encoding flag early, allowing new frames to start fresh encoding sessions
      encodingInProgress.set(false)

      // Opportunistically encode tail frame (if present) without blocking new frames
      val tailFrame = lastFrameBuffer.getAndSet(null)
      if (tailFrame != null) {
        try {
          val screenshot = encodeScreenshot(tailFrame.bitmap)
          emitFrameEvent(
              tailFrame.frameId,
              tailFrame.threadId,
              tailFrame.beginTimestamp,
              tailFrame.endTimestamp,
              screenshot,
          )
        } finally {
          tailFrame.bitmap.recycle()
        }
      }
    }
  }

  // Must be called from the main thread so that PixelCopy captures the current frame.
  private fun captureScreenshot(
      frameId: Int,
      threadId: Int,
      beginTimestamp: Long,
      endTimestamp: Long,
      callback: (FrameData?) -> Unit,
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      // PixelCopy not available
      callback(null)
      return
    }

    val window = currentWindow
    if (window == null) {
      // No window
      callback(null)
      return
    }

    val decorView = window.decorView
    val width = decorView.width
    val height = decorView.height
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

    PixelCopy.request(
        window,
        bitmap,
        { copyResult ->
          if (copyResult == PixelCopy.SUCCESS) {
            callback(FrameData(bitmap, frameId, threadId, beginTimestamp, endTimestamp))
          } else {
            bitmap.recycle()
            callback(null)
          }
        },
        mainHandler,
    )
  }

  private fun encodeScreenshot(bitmap: Bitmap): ByteArray? {
    var scaledBitmap: Bitmap? = null
    return try {
      val window = currentWindow ?: return null
      val width = bitmap.width
      val height = bitmap.height
      val density = window.context.resources.displayMetrics.density
      val scaledWidth = (width / density * SCREENSHOT_SCALE_FACTOR).toInt()
      val scaledHeight = (height / density * SCREENSHOT_SCALE_FACTOR).toInt()
      scaledBitmap = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)

      val compressFormat =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Bitmap.CompressFormat.WEBP_LOSSY
          else Bitmap.CompressFormat.JPEG

      ByteArrayOutputStream(SCREENSHOT_OUTPUT_SIZE_HINT).use { outputStream ->
        scaledBitmap.compress(compressFormat, SCREENSHOT_QUALITY, outputStream)
        outputStream.toByteArray()
      }
    } catch (e: Exception) {
      null
    } finally {
      scaledBitmap?.recycle()
    }
  }

  companion object {
    private const val SCREENSHOT_SCALE_FACTOR = 1.0f
    private const val SCREENSHOT_QUALITY = 80

    // Capacity hint for the ByteArrayOutputStream used during bitmap
    // compression. Sized slightly above typical compressed output to minimise
    // internal buffer resizing.
    private const val SCREENSHOT_OUTPUT_SIZE_HINT = 65536 // 64 KB
  }
}
