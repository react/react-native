/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View

/** Shared utility for asserting on MeasureSpecs. */
public object MeasureSpecAssertions {
  @JvmStatic
  public fun assertExplicitMeasureSpec(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val widthMode = View.MeasureSpec.getMode(widthMeasureSpec)
    val heightMode = View.MeasureSpec.getMode(heightMeasureSpec)
    if (widthMode == View.MeasureSpec.UNSPECIFIED || heightMode == View.MeasureSpec.UNSPECIFIED) {
      throw IllegalStateException(
          "A catalyst view must have an explicit width and height given to it. This should " +
              "normally happen as part of the standard catalyst UI framework.",
      )
    }
  }
}
