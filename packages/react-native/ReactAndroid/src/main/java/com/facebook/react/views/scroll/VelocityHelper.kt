/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.MotionEvent
import android.view.VelocityTracker

/**
 * This Class helps to calculate the velocity for all ScrollView. The x and y velocity will later on
 * send to ReactScrollViewHelper for further use.
 */
internal class VelocityHelper {
  private var velocityTracker: VelocityTracker? = null

  /* Needs to call ACTION_UP/CANCEL to update the xVelocity/yVelocity */
  var xVelocity = 0f
    private set

  var yVelocity = 0f
    private set

  /**
   * Call from a ScrollView in onTouchEvent. Calculating the velocity for END_DRAG movement and send
   * them back to react ScrollResponder.js
   */
  fun calculateVelocity(ev: MotionEvent) {
    if (velocityTracker == null) {
      velocityTracker = VelocityTracker.obtain()
    }

    velocityTracker?.let { tracker ->
      tracker.addMovement(ev)
      when (ev.action and MotionEvent.ACTION_MASK) {
        MotionEvent.ACTION_UP,
        MotionEvent.ACTION_CANCEL -> {
          // Calculate velocity on END_DRAG
          tracker.computeCurrentVelocity(1) // points/millisecond
          xVelocity = tracker.xVelocity
          yVelocity = tracker.yVelocity
          tracker.recycle()
          velocityTracker = null
        }
      }
    }
  }
}
