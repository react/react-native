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
    val dx = (location[0] - downLocationX).toFloat()
    val dy = (location[1] - downLocationY).toFloat()
    if (dx == 0f && dy == 0f) {
      return handler(ev)
    }
    ev.offsetLocation(dx, dy)
    try {
      return handler(ev)
    } finally {
      ev.offsetLocation(-dx, -dy)
    }
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
