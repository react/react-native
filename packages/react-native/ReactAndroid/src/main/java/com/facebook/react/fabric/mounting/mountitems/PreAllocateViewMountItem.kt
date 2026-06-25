/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.mountitems.FabricNameComponentMapping.getFabricComponentName
import com.facebook.react.uimanager.StateWrapper

/** [MountItem] that is used to pre-allocate views for JS components. */
internal class PreAllocateViewMountItem(
    private val surfaceId: Int,
    private val reactTag: Int,
    component: String,
    private val props: ReadableMap,
    private val stateWrapper: StateWrapper?,
    private val isLayoutable: Boolean,
) : MountItem {
  private val fabricComponentName = getFabricComponentName(component)

  override fun getSurfaceId(): Int = surfaceId

  override fun execute(mountingManager: MountingManager) {
    val surfaceMountingManager = mountingManager.getSurfaceManager(surfaceId)
    if (surfaceMountingManager == null) {
      FLog.e(
          FabricUIManager.TAG,
          "Skipping View PreAllocation; no SurfaceMountingManager found for [$surfaceId]",
      )
      return
    }
    surfaceMountingManager.preallocateView(
        fabricComponentName,
        reactTag,
        props,
        stateWrapper,
        isLayoutable,
    )
  }

  override fun toString(): String {
    val result =
        StringBuilder("PreAllocateViewMountItem [")
            .append(reactTag)
            .append("] - component: ")
            .append(fabricComponentName)
            .append(" surfaceId: ")
            .append(surfaceId)
            .append(" isLayoutable: ")
            .append(isLayoutable)

    if (FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT) {
      result
          .append(" props: ")
          .append(props.toString() ?: "<null>")
          .append(" state: ")
          .append(stateWrapper?.toString() ?: "<null>")
    }

    return result.toString()
  }
}
