/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel

/** Event dispatched when total width or height of a view's children changes. */
@Deprecated("Please define your own event for custom components")
public class ContentSizeChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val width: Int,
    private val height: Int,
) : Event<ContentSizeChangeEvent>(surfaceId, viewTag) {
  @Deprecated(
      "Please specify surfaceId explicitly in the constructor.",
      ReplaceWith("constructor(surfaceId, viewTag, width, height)"),
  )
  public constructor(viewTag: Int, width: Int, height: Int) : this(-1, viewTag, width, height)

  public override fun getEventName(): String = "topContentSizeChange"

  override fun getEventData(): WritableMap {
    val res = Arguments.createMap()
    res.putDouble("width", toDIPFromPixel(width.toFloat()).toDouble())
    res.putDouble("height", toDIPFromPixel(height.toFloat()).toDouble())
    return res
  }
}
