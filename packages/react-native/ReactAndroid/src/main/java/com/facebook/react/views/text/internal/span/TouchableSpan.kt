/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * Interface for spans that receive touch events from [PreparedLayoutTextView]. Unlike
 * [ClickableSpan] which only provides an onClick callback with no position information,
 * TouchableSpan receives layout-relative coordinates, enabling position-aware interactions such as
 * dismiss animations originating from the tap point.
 */
@UnstableReactNativeAPI
public interface TouchableSpan {
  /**
   * Called when a touch event occurs on text covered by this span.
   *
   * @param action the [MotionEvent] action (e.g. [MotionEvent.ACTION_DOWN], [ACTION_UP])
   * @param layoutX x coordinate relative to the text layout
   * @param layoutY y coordinate relative to the text layout
   * @return true if the event was consumed
   */
  public fun onTouchEvent(action: Int, layoutX: Float, layoutY: Float): Boolean
}
