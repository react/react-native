/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.swiperefresh

import android.view.MotionEvent
import android.view.ViewConfiguration
import android.view.ViewGroup
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.events.NativeGestureUtil
import kotlin.math.abs

/** Basic extension of [SwipeRefreshLayout] with ReactNative-specific functionality. */
public open class ReactSwipeRefreshLayout(reactContext: ReactContext) :
    SwipeRefreshLayout(reactContext) {

  private var didLayout: Boolean = false
  private var refreshing: Boolean = false
  private var progressViewOffset: Float = 0f
  private val touchSlop: Int = ViewConfiguration.get(reactContext).scaledTouchSlop
  private var prevTouchX: Float = 0f
  private var intercepted: Boolean = false
  private var nativeGestureStarted: Boolean = false

  public override fun setRefreshing(refreshing: Boolean) {
    this.refreshing = refreshing

    // `setRefreshing` must be called after the initial layout otherwise it
    // doesn't work when mounting the component with `refreshing = true`.
    // Known Android issue: https://code.google.com/p/android/issues/detail?id=77712
    if (didLayout) {
      super.setRefreshing(refreshing)
    }
  }

  public fun setProgressViewOffset(offset: Float) {
    progressViewOffset = offset

    // The view must be measured before calling `getProgressCircleDiameter` so
    // don't do it before the initial layout.
    if (didLayout) {
      val diameter = progressCircleDiameter
      val start = Math.round(PixelUtil.toPixelFromDIP(offset)) - diameter
      val end = Math.round(PixelUtil.toPixelFromDIP(offset + DEFAULT_CIRCLE_TARGET)) - diameter
      setProgressViewOffset(false, start, end)
    }
  }

  public override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)

    if (!didLayout) {
      didLayout = true

      // Update values that must be set after initial layout.
      setProgressViewOffset(progressViewOffset)
      setRefreshing(refreshing)
    }
  }

  public override fun canChildScrollUp(): Boolean {
    val firstChild = getChildAt(0)
    return firstChild?.canScrollVertically(-1) ?: super.canChildScrollUp()
  }

  /**
   * [SwipeRefreshLayout] overrides [ViewGroup.requestDisallowInterceptTouchEvent] and swallows it.
   * This means that any component underneath SwipeRefreshLayout will now interact incorrectly with
   * Views that are above SwipeRefreshLayout. We fix that by transmitting the call to this View's
   * parents.
   */
  public override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    parent?.requestDisallowInterceptTouchEvent(disallowIntercept)
  }

  public override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    if (shouldInterceptTouchEvent(ev) && super.onInterceptTouchEvent(ev)) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev)
      nativeGestureStarted = true

      // If the pull-to-refresh gesture is interrupted by a parent with its own
      // onInterceptTouchEvent then the refresh indicator gets stuck on-screen
      // so we ask the parent to not intercept this touch event after it started
      parent?.requestDisallowInterceptTouchEvent(true)

      return true
    }
    return false
  }

  public override fun onTouchEvent(ev: MotionEvent): Boolean {
    if (ev.actionMasked == MotionEvent.ACTION_UP && nativeGestureStarted) {
      NativeGestureUtil.notifyNativeGestureEnded(this, ev)
      nativeGestureStarted = false
    }
    return super.onTouchEvent(ev)
  }

  /**
   * [SwipeRefreshLayout] completely bypasses ViewGroup's "disallowIntercept" by overriding
   * [ViewGroup.onInterceptTouchEvent] and never calling super.onInterceptTouchEvent(). This means
   * that horizontal scrolls will always be intercepted, even though they shouldn't, so we have to
   * check for that manually here.
   */
  private fun shouldInterceptTouchEvent(ev: MotionEvent): Boolean {
    when (ev.action) {
      MotionEvent.ACTION_DOWN -> {
        prevTouchX = ev.x
        intercepted = false
      }
      MotionEvent.ACTION_MOVE -> {
        val eventX = ev.x
        val xDiff = abs(eventX - prevTouchX)

        if (intercepted || xDiff > touchSlop) {
          intercepted = true
          return false
        }
      }
    }
    return true
  }

  private companion object {
    private const val DEFAULT_CIRCLE_TARGET = 64f
  }
}
