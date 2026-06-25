/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.jni.HybridClassBase
import com.facebook.soloader.SoLoader

/**
 * JNI test helper that wraps a real C++ [FabricMountingManager] to exercise native code paths
 * around preallocateShadowView, destroyUnmountedShadowNode, and the allocatedViewRegistry_
 * lifecycle.
 */
class FabricMountingManagerTestHelper private constructor(fabricUIManager: FabricUIManager) :
    HybridClassBase() {

  init {
    initHybrid(fabricUIManager)
  }

  private external fun initHybrid(fabricUIManager: FabricUIManager)

  external fun startSurface(surfaceId: Int)

  external fun stopSurface(surfaceId: Int)

  external fun preallocateView(surfaceId: Int, tag: Int)

  external fun destroyUnmountedView(surfaceId: Int, tag: Int)

  external fun isTagAllocated(surfaceId: Int, tag: Int): Boolean

  companion object {
    init {
      SoLoader.loadLibrary("fabricjni")
      SoLoader.loadLibrary("fabricjni_test_helper")
    }

    @JvmStatic
    fun create(fabricUIManager: FabricUIManager): FabricMountingManagerTestHelper {
      return FabricMountingManagerTestHelper(fabricUIManager)
    }
  }
}
