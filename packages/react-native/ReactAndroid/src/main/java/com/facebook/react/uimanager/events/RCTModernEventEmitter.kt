/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.WritableMap

/**
 * This is a transitional replacement for [RCTEventEmitter] that works with Fabric and non-Fabric
 * renderers. [RCTEventEmitter] works with Fabric as well, but there are negative perf implications
 * and it should be avoided.
 *
 * This interface will *also* be deleted in the distant future and be replaced with a new interface
 * that doesn't need the old `receiveEvent` method at all. But for the foreseeable future, this is
 * the recommended interface to use for EventEmitters.
 */
@Suppress("DEPRECATION")
public interface RCTModernEventEmitter : RCTEventEmitter {
  @Deprecated(
      "Use RCTModernEventEmitter",
      ReplaceWith("RCTModernEventEmitter.receiveEvent(surfaceId, targetTag, eventName, params)"),
  )
  override fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?) {
    receiveEvent(-1, targetTag, eventName, params)
  }

  @Deprecated("Use the overload with eventTimestamp parameter instead.")
  public fun receiveEvent(surfaceId: Int, targetTag: Int, eventName: String, params: WritableMap?) {
    // We assume this event can't be coalesced. `customCoalesceKey` has no meaning in Fabric.
    receiveEvent(surfaceId, targetTag, eventName, false, 0, params, EventCategoryDef.UNSPECIFIED)
  }

  @Deprecated("Use the overload with eventTimestamp parameter instead.")
  public fun receiveEvent(
      surfaceId: Int,
      targetTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      customCoalesceKey: Int,
      params: WritableMap?,
      @EventCategoryDef category: Int,
  )

  /**
   * Receives an event with a specific timestamp. The default implementation delegates to the
   * non-timestamped version for backward compatibility with existing implementations.
   *
   * @param eventTimestamp The timestamp when the event was triggered (in milliseconds since boot,
   *   from SystemClock.uptimeMillis())
   */
  public fun receiveEvent(
      surfaceId: Int,
      targetTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      customCoalesceKey: Int,
      params: WritableMap?,
      @EventCategoryDef category: Int,
      eventTimestamp: Long,
  ) {
    receiveEvent(
        surfaceId,
        targetTag,
        eventName,
        canCoalesceEvent,
        customCoalesceKey,
        params,
        category,
    )
  }
}
