/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Point
import android.view.View
import androidx.annotation.UiThread
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.infer.annotation.Assertions
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn

public object RootViewUtil {
  /** Returns the root view of a given view in a react application. */
  @JvmStatic
  public fun getRootView(reactView: View): RootView? {
    var current = reactView
    while (true) {
      if (current is RootView) {
        return current
      }
      val next = current.parent ?: return null
      Assertions.assertCondition(next is View)
      current = next as View
    }
  }

  @UiThread
  @JvmStatic
  public fun getViewportOffset(v: View): Point {
    val locationInWindow = IntArray(2)
    v.getLocationInWindow(locationInWindow)

    if (!isEdgeToEdgeFeatureFlagOn) {
      // When not in edge-to-edge mode, subtract the top system bar insets so the offset is
      // relative to the content area (below the status bar / cutout).
      ViewCompat.getRootWindowInsets(v)?.apply {
        val insets =
            getInsets(
                WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.displayCutout()
            )

        locationInWindow[0] -= insets.left
        locationInWindow[1] -= insets.top
      }
    }

    return Point(locationInWindow[0], locationInWindow[1])
  }
}
