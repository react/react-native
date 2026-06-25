/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // We want to use RCTEventEmitter for interop purposes

package com.facebook.react.internal.interop

import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.common.annotations.internal.InteropLegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * A reimplementation of [RCTEventEmitter] which is using a [EventDispatcher] under the hood.
 *
 * On Fabric, you're supposed to use [EventDispatcher] to dispatch events. However, we provide an
 * interop layer for non-Fabric migrated components.
 *
 * This instance will be returned if the user is invoking `context.getJsModule(RCTEventEmitter) and
 * is providing support for the `receiveEvent` method, so that non-Fabric ViewManagers can continue
 * to deliver events also when Fabric is turned on.
 */
@InteropLegacyArchitecture
internal class InteropEventEmitter(private val reactContext: ReactContext) : RCTEventEmitter {

  private var eventDispatcherOverride: EventDispatcher? = null

  @Deprecated("Deprecated in Java")
  override fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?) {
    val dispatcher = eventDispatcherOverride ?: UIManagerHelper.getEventDispatcher(reactContext)
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
    dispatcher?.dispatchEvent(InteropEvent(eventName, params, surfaceId, targetTag))
  }

  @VisibleForTesting
  fun overrideEventDispatcher(eventDispatcherOverride: EventDispatcher?) {
    this.eventDispatcherOverride = eventDispatcherOverride
  }

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture("InteropEventEmitter")
    }
  }
}
