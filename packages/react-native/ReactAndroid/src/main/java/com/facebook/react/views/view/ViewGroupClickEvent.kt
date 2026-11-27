/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/** Represents a Click on the ReactViewGroup */
internal class ViewGroupClickEvent(surfaceId: Int, viewId: Int) :
    Event<ViewGroupClickEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun canCoalesce(): Boolean = false

  protected override fun getEventData(): WritableMap = Arguments.createMap()

  private companion object {
    private const val EVENT_NAME: String = "topClick"
  }
}
