/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.fabric.FabricUIManagerBinding
import com.facebook.react.fabric.mounting.MountingManager

/**
 * Pull model mount item. Enqueued (on the commit thread) when C++ notifies that a transaction is
 * available for a surface. When it executes on the UI thread it asks C++ to pull the surface's
 * pending transaction and apply it synchronously, so the diff + batch construction happens on the
 * UI thread instead of the commit thread (matching iOS).
 */
@DoNotStripAny
internal class PullTransactionMountItem(
    private val surfaceId: Int,
    private val binding: FabricUIManagerBinding,
) : MountItem {

  override fun execute(mountingManager: MountingManager) {
    binding.pullAndExecuteTransaction(surfaceId)
  }

  override fun getSurfaceId(): Int = surfaceId

  override fun toString(): String = "PullTransactionMountItem [surfaceId: $surfaceId]"
}
