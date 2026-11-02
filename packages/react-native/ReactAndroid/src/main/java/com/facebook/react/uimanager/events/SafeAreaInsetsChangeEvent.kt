/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil.pxToDp

/**
 * Emitted when the unsafe-area overlap of a view's rendered bounds changes.
 *
 * Dispatched synchronously so that the layout depending on the insets is mounted in the frame the
 * insets changed in, rather than the one after it.
 */
internal class SafeAreaInsetsChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val insetTop: Float,
    private val insetRight: Float,
    private val insetBottom: Float,
    private val insetLeft: Float,
) : Event<SafeAreaInsetsChangeEvent>(surfaceId, viewTag) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
      Arguments.createMap().apply {
        putMap(
            "insets",
            Arguments.createMap().apply {
              putDouble("top", insetTop.toDp())
              putDouble("right", insetRight.toDp())
              putDouble("bottom", insetBottom.toDp())
              putDouble("left", insetLeft.toDp())
            },
        )
      }

  override fun experimental_isSynchronous(): Boolean = true

  internal companion object {
    const val EVENT_NAME: String = "topSafeAreaInsetsChange"

    private fun Float.toDp(): Double = pxToDp().toDouble()
  }
}
