/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events

import android.annotation.SuppressLint
import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.fabric.FabricSoLoader.staticInit
import com.facebook.react.uimanager.events.EventCategoryDef

/**
 * This class holds reference to the C++ EventEmitter object. Instances of this class are created in
 * FabricMountingManager.cpp, where the pointer to the C++ event emitter is set.
 */
@DoNotStripAny
@SuppressLint("MissingNativeLoadLibrary")
internal class EventEmitterWrapper private constructor() : HybridClassBase() {
  private external fun dispatchEvent(
      eventName: String,
      params: NativeMap?,
      @EventCategoryDef category: Int,
      eventTimestamp: Long,
  )

  private external fun dispatchEventSynchronously(
      eventName: String,
      params: NativeMap?,
      eventTimestamp: Long,
  )

  private external fun dispatchUniqueEvent(
      eventName: String,
      params: NativeMap?,
      eventTimestamp: Long,
  )

  /**
   * Invokes the execution of the C++ EventEmitter.
   *
   * @param eventName [String] name of the event to execute.
   * @param params [WritableMap] payload of the event
   * @param eventCategory event category
   * @param eventTimestamp timestamp when the event was triggered (in milliseconds since boot)
   */
  @Synchronized
  fun dispatch(
      eventName: String,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
      eventTimestamp: Long,
  ) {
    if (!isValid) {
      return
    }
    dispatchEvent(eventName, params as NativeMap?, eventCategory, eventTimestamp)
  }

  @Synchronized
  fun dispatchEventSynchronously(eventName: String, params: WritableMap?, eventTimestamp: Long) {
    if (!isValid) {
      return
    }
    UiThreadUtil.assertOnUiThread()
    dispatchEventSynchronously(eventName, params as NativeMap?, eventTimestamp)
  }

  /**
   * Invokes the execution of the C++ EventEmitter. C++ will coalesce events sent to the same
   * target.
   *
   * @param eventName [String] name of the event to execute.
   * @param params [WritableMap] payload of the event
   * @param eventTimestamp timestamp when the event was triggered (in milliseconds since boot)
   */
  @Synchronized
  fun dispatchUnique(eventName: String, params: WritableMap?, eventTimestamp: Long) {
    if (!isValid) {
      return
    }
    dispatchUniqueEvent(eventName, params as NativeMap?, eventTimestamp)
  }

  @Synchronized
  fun destroy() {
    if (isValid) {
      resetNative()
    }
  }

  private companion object {
    init {
      staticInit()
    }
  }
}
