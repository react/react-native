/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.StateWrapper

/** Factory class that expose creation of [MountItem] */
internal object MountItemFactory {
  /** @return a [DispatchCommandMountItem] for commands identified by an int */
  @JvmStatic
  fun createDispatchCommandMountItem(
      surfaceId: Int,
      reactTag: Int,
      commandId: Int,
      commandArgs: ReadableArray,
  ): DispatchCommandMountItem =
      DispatchIntCommandMountItem(surfaceId, reactTag, commandId, commandArgs)

  /** @return a [DispatchCommandMountItem] for commands identified by a String */
  @JvmStatic
  fun createDispatchCommandMountItem(
      surfaceId: Int,
      reactTag: Int,
      commandId: String,
      commandArgs: ReadableArray,
  ): DispatchCommandMountItem =
      DispatchStringCommandMountItem(surfaceId, reactTag, commandId, commandArgs)

  /** @return a [MountItem] that will control the execution of an AccessibilityEvent */
  @JvmStatic
  fun createSendAccessibilityEventMountItem(
      surfaceId: Int,
      reactTag: Int,
      eventType: Int,
  ): MountItem = SendAccessibilityEventMountItem(surfaceId, reactTag, eventType)

  /** @return a [MountItem] that will be used to preallocate views */
  @JvmStatic
  fun createPreAllocateViewMountItem(
      surfaceId: Int,
      reactTag: Int,
      component: String,
      props: ReadableMap,
      stateWrapper: StateWrapper?,
      isLayoutable: Boolean,
  ): MountItem =
      PreAllocateViewMountItem(surfaceId, reactTag, component, props, stateWrapper, isLayoutable)

  /** @return a [MountItem] that will be used to destroy views */
  @JvmStatic
  fun createDestroyViewMountItem(surfaceId: Int, reactTag: Int): MountItem =
      DestroyUnmountedViewMountItem(surfaceId, reactTag)

  /**
   * @return a [MountItem] that will be read and execute a collection of MountItems serialized in
   *   the int[] and Object[] received by parameter
   */
  @JvmStatic
  fun createIntBufferBatchMountItem(
      surfaceId: Int,
      intBuf: IntArray,
      objBuf: Array<Any?>,
      commitNumber: Int,
  ): MountItem = IntBufferBatchMountItem(surfaceId, intBuf, objBuf, commitNumber)
}
