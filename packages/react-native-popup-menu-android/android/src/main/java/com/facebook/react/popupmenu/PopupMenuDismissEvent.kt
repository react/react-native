/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.popupmenu

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

public class PopupMenuDismissEvent(surfaceId: Int, viewId: Int) :
    Event<PopupMenuDismissEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  protected override fun getEventData(): WritableMap? = null

  public companion object {
    public const val EVENT_NAME: String = "topPopupMenuDismiss"
  }
}
