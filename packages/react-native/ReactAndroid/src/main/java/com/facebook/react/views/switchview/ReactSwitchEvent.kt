/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

/** Event emitted by a ReactSwitchManager once a switch is fully switched on/off */
internal class ReactSwitchEvent(surfaceId: Int, viewId: Int, private val isChecked: Boolean) :
    Event<ReactSwitchEvent>(surfaceId, viewId) {

  @Deprecated(
      "Use the constructor with surfaceId, viewId and isChecked parameters.",
      replaceWith = ReplaceWith("ReactSwitchEvent(surfaceId, viewId, isChecked)"),
  )
  constructor(viewId: Int, isChecked: Boolean) : this(ViewUtil.NO_SURFACE_ID, viewId, isChecked)

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
      Arguments.createMap().apply {
        putInt("target", viewTag)
        putBoolean("value", isChecked)
      }

  private companion object {
    private const val EVENT_NAME = "topChange"
  }
}
