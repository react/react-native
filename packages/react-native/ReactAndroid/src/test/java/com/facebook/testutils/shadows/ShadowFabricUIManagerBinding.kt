/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

/**
 * [FabricUIManagerBinding] is JNI-backed and Mockito can't mock native methods, so shadow the
 * methods tests need instead. The binding class is `internal`, so it is referenced by name via
 * [Implements.className] rather than a compile-time class literal.
 */
@Implements(className = "com.facebook.react.fabric.FabricUIManagerBinding")
class ShadowFabricUIManagerBinding {
  val pulledSurfaceIds: MutableList<Int> = mutableListOf()
  val reportedMountSurfaceIds: MutableList<Int> = mutableListOf()
  /** Stands in for the C++ pull and mount. */
  var onPull: (surfaceId: Int) -> Unit = {}

  @Implementation
  fun pullAndExecuteTransaction(surfaceId: Int) {
    pulledSurfaceIds.add(surfaceId)
    onPull(surfaceId)
  }

  @Implementation
  fun reportMount(surfaceId: Int) {
    reportedMountSurfaceIds.add(surfaceId)
  }

  @Implementation fun drainPreallocateViewsQueue() = Unit
}
