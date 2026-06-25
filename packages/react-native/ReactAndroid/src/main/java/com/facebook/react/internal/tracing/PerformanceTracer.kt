/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.tracing

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.soloader.SoLoader

/**
 * JNI interface to access PerformanceTracer methods from React Native Inspector Modern.
 *
 * This provides access to reportMark and reportMeasure methods which are used for performance
 * tracing in the React Native DevTools.
 */
@DoNotStrip
public object PerformanceTracer {
  init {
    SoLoader.loadLibrary("react_tracingjni")
  }

  public fun <T> trace(name: String, block: () -> T): T {
    return trace(name, null /* track */, null /* trackGroup */, null /* color */, block)
  }

  public fun <T> trace(name: String, track: String, block: () -> T): T {
    return trace(name, track, null /* trackGroup */, null /* color */, block)
  }

  public fun <T> trace(name: String, track: String, trackGroup: String, block: () -> T): T {
    return trace(name, track, trackGroup, null /* color */, block)
  }

  public fun <T> trace(
      name: String,
      track: String?,
      trackGroup: String?,
      color: String?,
      block: () -> T,
  ): T {
    if (!isTracing()) {
      return block()
    }

    val startTimeNanos = java.lang.System.nanoTime()
    try {
      return block()
    } finally {
      val endTimeNanos = java.lang.System.nanoTime()
      reportTimeStamp(
          name,
          startTimeNanos,
          endTimeNanos,
          track,
          trackGroup,
          color,
      )
    }
  }

  /** Callback interface for tracing state changes. */
  @DoNotStrip
  public interface TracingStateCallback {
    /**
     * Called when tracing state changes.
     *
     * @param isTracing true if tracing has started, false if tracing has stopped
     */
    @DoNotStrip public fun onTracingStateChanged(isTracing: Boolean)
  }

  /**
   * Report a Performance.mark() event - a labelled timestamp.
   *
   * @param name The name/label of the mark
   * @param timestampNanos The timestamp in nanoseconds (monotonic time)
   * @param detail Optional map with additional detail (pass null if not needed)
   */
  @DoNotStrip
  @JvmStatic
  public external fun reportMark(name: String, timestampNanos: Long, detail: ReadableNativeMap?)

  /**
   * Report a Performance.measure() event - a labelled duration.
   *
   * @param name The name/label of the measure
   * @param startTimestampNanos The start timestamp in nanoseconds (monotonic time)
   * @param durationNanos The duration in nanoseconds
   * @param detail Optional map with additional detail (pass null if not needed)
   */
  @DoNotStrip
  @JvmStatic
  public external fun reportMeasure(
      name: String,
      startTimestampNanos: Long,
      durationNanos: Long,
      detail: ReadableNativeMap?,
  )

  /**
   * Report a TimeStamp Trace Event - a labelled entry on Performance timeline.
   *
   * @param name The name/label of the timestamp
   * @param startTimeNanos Start timestamp in nanoseconds (monotonic time)
   * @param endTimeNanos End timestamp in nanoseconds (monotonic time)
   * @param trackName Optional track name for organizing the timestamp
   * @param trackGroup Optional track group for organizing the timestamp
   * @param color Optional color name (e.g., "primary", "secondary", "error", "warning")
   */
  @DoNotStrip
  @JvmStatic
  public external fun reportTimeStamp(
      name: String,
      startTimeNanos: Long,
      endTimeNanos: Long,
      trackName: String?,
      trackGroup: String?,
      color: String?,
  )

  /**
   * Check if the tracer is currently tracing.
   *
   * @return true if tracing is active, false otherwise
   */
  @DoNotStrip @JvmStatic public external fun isTracing(): Boolean

  /**
   * Subscribe to tracing state changes (start/stop events).
   *
   * @param callback The callback to invoke when tracing starts or stops
   * @return A subscription ID that can be used to unsubscribe
   */
  @DoNotStrip
  @JvmStatic
  public external fun subscribeToTracingStateChanges(callback: TracingStateCallback): Int

  /**
   * Unsubscribe from tracing state changes.
   *
   * @param subscriptionId The subscription ID returned from subscribeToTracingStateChanges
   */
  @DoNotStrip @JvmStatic public external fun unsubscribeFromTracingStateChanges(subscriptionId: Int)
}
