/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

/** Represents a View losing focus */
internal class BlurEvent(surfaceId: Int, viewId: Int) : Event<BlurEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun canCoalesce(): Boolean = false

  override fun getEventData(): WritableMap {
    return Arguments.createMap().apply { putInt("target", viewTag) }
  }

  internal companion object {
    internal const val EVENT_NAME: String = "topBlur"
  }
}
