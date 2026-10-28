/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.MotionEvent
import android.view.View

internal class StableTouchCoordinatesHelper(private val view: View) {
  private val location = IntArray(2)
  private var downLocationX = 0
  private var downLocationY = 0

  fun <T> withStableCoordinates(ev: MotionEvent, handler: (MotionEvent) -> T): T {
    getLayoutLocationOnScreen(location)
    if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
      downLocationX = location[0]
      downLocationY = location[1]
    }
    val screenDx = location[0] - downLocationX
    val screenDy = location[1] - downLocationY
    if (screenDx == 0 && screenDy == 0) {
      return handler(ev)
    }
    val scaleX = getCumulativeScaleX()
    val scaleY = getCumulativeScaleY()
    if (scaleX == 0f || scaleY == 0f) {
      return handler(ev)
    }
    val dx = screenDx / scaleX
    val dy = screenDy / scaleY
    ev.offsetLocation(dx, dy)
    try {
      return handler(ev)
    } finally {
      ev.offsetLocation(-dx, -dy)
    }
  }

  private fun getCumulativeScaleX(): Float {
    var scale = view.scaleX
    var ancestor = view.parent
    while (ancestor is View) {
      scale *= ancestor.scaleX
      ancestor = ancestor.parent
    }
    return scale
  }

  private fun getCumulativeScaleY(): Float {
    var scale = view.scaleY
    var ancestor = view.parent
    while (ancestor is View) {
      scale *= ancestor.scaleY
      ancestor = ancestor.parent
    }
    return scale
  }

  private fun getLayoutLocationOnScreen(outLocation: IntArray) {
    view.getLocationOnScreen(outLocation)
    var ancestor = view.parent
    while (ancestor is View) {
      outLocation[0] += ancestor.scrollX
      outLocation[1] += ancestor.scrollY
      ancestor = ancestor.parent
    }
  }
}
