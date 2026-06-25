/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.UnexpectedNativeTypeException
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.react.uimanager.events.RCTModernEventEmitter

/** Handles updating a [ValueAnimatedNode] when an event gets dispatched. */
internal class EventAnimationDriver(
    @JvmField var eventName: String,
    @JvmField internal var viewTag: Int,
    private val eventPath: List<String>,
    @JvmField internal var valueNode: ValueAnimatedNode,
) : RCTModernEventEmitter {
  @Deprecated("Use the overload with eventTimestamp parameter instead.")
  override fun receiveEvent(
      surfaceId: Int,
      targetTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      customCoalesceKey: Int,
      params: WritableMap?,
      @EventCategoryDef category: Int,
  ) {
    requireNotNull(params) { "Native animated events must have event data." }

    // Get the new value for the node by looking into the event map using the provided event path.
    var currMap: ReadableMap? = params
    var currArray: ReadableArray? = null
    for (i in 0 until eventPath.size - 1) {
      if (currMap != null) {
        val key = eventPath[i]
        val keyType = currMap.getType(key)
        if (keyType == ReadableType.Map) {
          currMap = currMap.getMap(key)
          currArray = null
        } else if (keyType == ReadableType.Array) {
          currArray = currMap.getArray(key)
          currMap = null
        } else {
          throw UnexpectedNativeTypeException("Unexpected type $keyType for key '$key'")
        }
      } else {
        val index = eventPath[i].toInt()
        val keyType = currArray?.getType(index)
        if (keyType == ReadableType.Map) {
          currMap = currArray.getMap(index)
          currArray = null
        } else if (keyType == ReadableType.Array) {
          currArray = currArray.getArray(index)
          currMap = null
        } else {
          throw UnexpectedNativeTypeException("Unexpected type $keyType for index '$index'")
        }
      }
    }
    val lastKey = eventPath[eventPath.size - 1]
    if (currMap != null) {
      valueNode.nodeValue = currMap.getDouble(lastKey)
    } else {
      val lastIndex = lastKey.toInt()
      valueNode.nodeValue = currArray?.getDouble(lastIndex) ?: 0.0
    }
  }
}
