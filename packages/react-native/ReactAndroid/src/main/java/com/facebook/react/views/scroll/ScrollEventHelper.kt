/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactNativeJNISoLoader
import com.facebook.react.bridge.WritableNativeMap

/** Builds the payload of a [ScrollEvent] in one native call. */
@DoNotStrip
internal object ScrollEventHelper {
  init {
    ReactNativeJNISoLoader.staticInit()
  }

  // Keep in sync with the field indices in ScrollEventHelper.cpp.
  const val CONTENT_OFFSET_X_INDEX = 0
  const val CONTENT_OFFSET_Y_INDEX = 1
  const val CONTENT_WIDTH_INDEX = 2
  const val CONTENT_HEIGHT_INDEX = 3
  const val LAYOUT_WIDTH_INDEX = 4
  const val LAYOUT_HEIGHT_INDEX = 5
  const val VELOCITY_X_INDEX = 6
  const val VELOCITY_Y_INDEX = 7
  const val TIMESTAMP_INDEX = 8
  const val FIELDS = 9

  /**
   * Creates the payload of a scroll event: `contentInset` (all zero), `contentOffset`,
   * `contentSize`, `layoutMeasurement`, `velocity`, `target`, `timestamp` and
   * `responderIgnoreScroll`.
   *
   * @param data [FIELDS] values, in DIPs, at the indices above.
   */
  @DoNotStrip
  @JvmStatic
  external fun nativeCreateScrollPayload(
      data: DoubleArray,
      target: Int,
      responderIgnoreScroll: Boolean,
  ): WritableNativeMap
}
