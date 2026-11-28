/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.popupmenu

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

public class PopupMenuSelectionEvent(surfaceId: Int, viewId: Int, private val item: Int) :
    Event<PopupMenuSelectionEvent>(surfaceId, viewId) {

  override fun getEventName(): String {
    return EVENT_NAME
  }

  protected override fun getEventData(): WritableMap {
    val eventData: WritableMap = Arguments.createMap()
    eventData.putInt("target", viewTag)
    eventData.putDouble("item", item.toDouble())
    return eventData
  }

  public companion object {
    public const val EVENT_NAME: String = "topPopupMenuSelectionChange"
  }
}
