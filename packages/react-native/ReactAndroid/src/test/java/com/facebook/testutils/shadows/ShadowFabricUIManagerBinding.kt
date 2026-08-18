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

  @Implementation
  fun pullAndExecuteTransaction(surfaceId: Int) {
    pulledSurfaceIds.add(surfaceId)
  }
}
