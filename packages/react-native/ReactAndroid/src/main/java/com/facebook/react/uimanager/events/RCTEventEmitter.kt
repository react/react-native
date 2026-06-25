/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.internal.InteropLegacyArchitecture

/**
 * Paper JS interface to emit events from native to JS.
 *
 * Deprecated in favor of [RCTModernEventEmitter], which works with both the old and new renderer.
 */
@DoNotStripAny
@InteropLegacyArchitecture
@Deprecated("Use [RCTModernEventEmitter] instead")
public interface RCTEventEmitter : JavaScriptModule {
  /**
   * @param targetTag react tag of the view that receives the event
   * @param eventName name of event
   * @param params event params
   */
  @Deprecated("Use [RCTModernEventEmitter.receiveEvent] instead")
  public fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?)

  @Deprecated("Use [EventDispatcher] to dispatch touch events instead")
  public fun receiveTouches(
      eventName: String,
      touches: WritableArray,
      changedIndices: WritableArray,
  ): Unit = Unit
}
