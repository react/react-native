/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT
import com.facebook.react.fabric.mounting.MountingManager

internal class SynchronousMountItem(private val reactTag: Int, private val props: ReadableMap) :
    MountItem {

  override fun execute(mountingManager: MountingManager) {
    try {
      mountingManager.storeSynchronousMountPropsOverride(reactTag, props)
      mountingManager.updatePropsSynchronously(reactTag, props)
    } catch (ex: Exception) {
      // The surface-stopped race condition (which was the primary source of exceptions here)
      // is now handled by null-safe lookups in MountingManager. This catch remains as a
      // safety net for other potential failures (e.g., view manager bugs, state
      // inconsistencies during prop updates).
    }
  }

  override fun toString(): String {
    val propsString = if (IS_DEVELOPMENT_ENVIRONMENT) props.toHashMap().toString() else "<hidden>"
    return "SYNC UPDATE PROPS [$reactTag]: $propsString"
  }

  override fun getSurfaceId(): Int = View.NO_ID
}
