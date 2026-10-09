/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.safeareaprovider

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/** Event emitted by [ReactSafeAreaProvider] when its insets or frame change. */
internal class InsetsChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val insets: EdgeInsets,
    private val frame: Rect,
) : Event<InsetsChangeEvent>(surfaceId, viewTag) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
      com.facebook.react.bridge.Arguments.createMap().apply {
        putMap("insets", edgeInsetsToJsMap(insets))
        putMap("frame", rectToJsMap(frame))
      }

  internal companion object {
    const val EVENT_NAME: String = "topInsetsChange"
  }
}
