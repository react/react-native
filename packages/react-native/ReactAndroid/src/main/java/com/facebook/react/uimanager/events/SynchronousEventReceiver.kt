/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI

@UnstableReactNativeAPI
internal interface SynchronousEventReceiver {
  fun receiveEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
      experimentalIsSynchronous: Boolean,
  )

  /**
   * Receives an event with a specific timestamp. The default implementation delegates to the
   * non-timestamped version for backward compatibility with existing implementations.
   *
   * @param eventTimestamp timestamp when the event was triggered (in milliseconds since boot, from
   *   SystemClock.uptimeMillis())
   */
  fun receiveEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
      experimentalIsSynchronous: Boolean,
      eventTimestamp: Long,
  ) {
    receiveEvent(
        surfaceId,
        reactTag,
        eventName,
        canCoalesceEvent,
        params,
        eventCategory,
        experimentalIsSynchronous,
    )
  }
}
