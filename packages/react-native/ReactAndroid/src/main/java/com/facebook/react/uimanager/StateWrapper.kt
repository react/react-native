/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.mapbuffer.ReadableMapBuffer

/**
 * This is a wrapper that can be used for passing State objects from Fabric C++ core to
 * platform-specific components in Java. State allows you to break out of uni-directional dataflow
 * by calling updateState, which communicates state back to the C++ layer.
 */
public interface StateWrapper {
  /**
   * Maps to EventQueue::UpdateMode in C++.
   * Controls how state updates are flushed (Async or Sync).
   */
  public enum class UpdateMode(public val value: Int) {
    Asynchronous(0),
    unstable_Immediate(1)
  }

  /**
   * Get a ReadableMapBuffer object from the C++ layer, which is a K/V map of short keys to values.
   *
   * Unstable API - DO NOT USE.
   */
  public val stateDataMapBuffer: ReadableMapBuffer?

  /**
   * Get a ReadableNativeMap object from the C++ layer, which is a K/V map of string keys to values.
   */
  public val stateData: ReadableNativeMap?

  /**
   * Pass a map of values back to the C++ layer. The operation is performed synchronously and cannot
   * fail.
   * updateMode controls whether the update is queued asynchronously or flushed immediately.
   */
  public fun updateState(map: WritableMap, updateMode: UpdateMode = UpdateMode.Asynchronous)

  /**
   * Mark state as unused and clean up in Java and in native. This should be called as early as
   * possible when you know a StateWrapper will no longer be used. If there's ANY chance of it being
   * used legitimately, don't destroy it! It is expected that all StateWrappers are destroyed
   * immediately upon stopSurface.
   */
  public fun destroyState()
}
