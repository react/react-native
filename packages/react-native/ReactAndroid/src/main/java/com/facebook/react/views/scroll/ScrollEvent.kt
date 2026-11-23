/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.os.SystemClock
import androidx.core.util.Pools.SynchronizedPool
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

/** A event dispatched from a ScrollView scrolling. */
public class ScrollEvent private constructor() : Event<ScrollEvent>() {
  private var scrollX = 0f
  private var scrollY = 0f
  private var xVelocity = 0f
  private var yVelocity = 0f
  private var contentWidth = 0
  private var contentHeight = 0
  private var scrollViewWidth = 0
  private var scrollViewHeight = 0
  private var scrollEventType: ScrollEventType? = null
  private var timestamp: Long = 0

  override fun onDispose() {
    try {
      EVENTS_POOL.release(this)
    } catch (e: IllegalStateException) {
      // This exception can be thrown when an event is double-released.
      // This is a problem but won't cause user-visible impact, so it's okay to fail silently.
      ReactSoftExceptionLogger.logSoftException(TAG, e)
    }
  }

  private fun init(
      surfaceId: Int,
      viewTag: Int,
      scrollEventType: ScrollEventType?,
      scrollX: Float,
      scrollY: Float,
      xVelocity: Float,
      yVelocity: Float,
      contentWidth: Int,
      contentHeight: Int,
      scrollViewWidth: Int,
      scrollViewHeight: Int,
  ) {
    val timestampMs = SystemClock.uptimeMillis()
    super.init(surfaceId, viewTag, timestampMs)

    this.scrollEventType = scrollEventType
    this.scrollX = scrollX
    this.scrollY = scrollY
    this.xVelocity = xVelocity
    this.yVelocity = yVelocity
    this.contentWidth = contentWidth
    this.contentHeight = contentHeight
    this.scrollViewWidth = scrollViewWidth
    this.scrollViewHeight = scrollViewHeight
    this.timestamp = timestampMs
  }

  override fun getEventName(): String =
      ScrollEventType.getJSEventName(Assertions.assertNotNull(scrollEventType))

  override fun canCoalesce(): Boolean = scrollEventType == ScrollEventType.SCROLL

  override fun getEventData(): WritableMap {
    val data = DoubleArray(ScrollEventHelper.FIELDS)
    data[ScrollEventHelper.CONTENT_OFFSET_X_INDEX] = toDIPFromPixel(scrollX).toDouble()
    data[ScrollEventHelper.CONTENT_OFFSET_Y_INDEX] = toDIPFromPixel(scrollY).toDouble()
    data[ScrollEventHelper.CONTENT_WIDTH_INDEX] = toDIPFromPixel(contentWidth.toFloat()).toDouble()
    data[ScrollEventHelper.CONTENT_HEIGHT_INDEX] =
        toDIPFromPixel(contentHeight.toFloat()).toDouble()
    data[ScrollEventHelper.LAYOUT_WIDTH_INDEX] =
        toDIPFromPixel(scrollViewWidth.toFloat()).toDouble()
    data[ScrollEventHelper.LAYOUT_HEIGHT_INDEX] =
        toDIPFromPixel(scrollViewHeight.toFloat()).toDouble()
    data[ScrollEventHelper.VELOCITY_X_INDEX] = toDIPFromPixel(xVelocity).toDouble()
    data[ScrollEventHelper.VELOCITY_Y_INDEX] = toDIPFromPixel(yVelocity).toDouble()
    data[ScrollEventHelper.TIMESTAMP_INDEX] = timestamp.toDouble()
    return ScrollEventHelper.nativeCreateScrollPayload(
        data,
        viewTag,
        !ReactNativeFeatureFlags.shouldTriggerResponderTransferOnScrollAndroid(),
    )
  }

  public companion object {
    private val TAG = ScrollEvent::class.java.simpleName
    private val EVENTS_POOL = SynchronizedPool<ScrollEvent>(3)

    @JvmStatic
    public fun obtain(
        surfaceId: Int,
        viewTag: Int,
        scrollEventType: ScrollEventType?,
        scrollX: Float,
        scrollY: Float,
        xVelocity: Float,
        yVelocity: Float,
        contentWidth: Int,
        contentHeight: Int,
        scrollViewWidth: Int,
        scrollViewHeight: Int,
    ): ScrollEvent =
        (EVENTS_POOL.acquire() ?: ScrollEvent()).apply {
          init(
              surfaceId,
              viewTag,
              scrollEventType,
              scrollX,
              scrollY,
              xVelocity,
              yVelocity,
              contentWidth,
              contentHeight,
              scrollViewWidth,
              scrollViewHeight,
          )
        }

    @Deprecated(
        "Use the obtain version that explicitly takes surfaceId as an argument",
        ReplaceWith(
            "obtain(surfaceId, viewTag, scrollEventType, scrollX, scrollY, xVelocity, yVelocity, contentWidth, contentHeight, scrollViewWidth, scrollViewHeight)",
        ),
    )
    @JvmStatic
    public fun obtain(
        viewTag: Int,
        scrollEventType: ScrollEventType?,
        scrollX: Float,
        scrollY: Float,
        xVelocity: Float,
        yVelocity: Float,
        contentWidth: Int,
        contentHeight: Int,
        scrollViewWidth: Int,
        scrollViewHeight: Int,
    ): ScrollEvent =
        obtain(
            ViewUtil.NO_SURFACE_ID,
            viewTag,
            scrollEventType,
            scrollX,
            scrollY,
            xVelocity,
            yVelocity,
            contentWidth,
            contentHeight,
            scrollViewWidth,
            scrollViewHeight,
        )
  }
}
