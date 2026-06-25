/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import android.annotation.SuppressLint
import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.RuntimeScheduler
import com.facebook.react.fabric.events.EventBeatManager
import com.facebook.react.uimanager.PixelUtil.getDisplayMetricDensity

@DoNotStripAny
@SuppressLint("MissingNativeLoadLibrary")
internal class FabricUIManagerBinding : HybridClassBase() {
  init {
    initHybrid()
  }

  private external fun initHybrid()

  private external fun installFabricUIManager(
      runtimeExecutor: RuntimeExecutor,
      runtimeScheduler: RuntimeScheduler,
      uiManager: FabricUIManager,
      eventBeatManager: EventBeatManager,
      componentsRegistry: ComponentFactory,
  )

  external fun startSurface(surfaceId: Int, moduleName: String, initialProps: NativeMap?)

  external fun startSurfaceWithConstraints(
      surfaceId: Int,
      moduleName: String,
      initialProps: NativeMap?,
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
      offsetX: Float,
      offsetY: Float,
      isRTL: Boolean,
      doLeftAndRightSwapInRTL: Boolean,
  )

  external fun startSurfaceWithSurfaceHandler(
      surfaceId: Int,
      surfaceHandler: SurfaceHandlerBinding,
      isMountable: Boolean,
  )

  external fun findNextFocusableElement(parentTag: Int, focusedTag: Int, direction: Int): Int

  external fun getRelativeAncestorList(rootTag: Int, childTag: Int): IntArray

  external fun stopSurface(surfaceId: Int)

  external fun stopSurfaceWithSurfaceHandler(surfaceHandler: SurfaceHandlerBinding)

  external fun setPixelDensity(pointScaleFactor: Float)

  external fun setConstraints(
      surfaceId: Int,
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
      offsetX: Float,
      offsetY: Float,
      isRTL: Boolean,
      doLeftAndRightSwapInRTL: Boolean,
  )

  external fun driveCxxAnimations()

  external fun driveAnimationBackend(frameTimeMs: Double)

  external fun drainPreallocateViewsQueue()

  external fun reportMount(surfaceId: Int)

  external fun setAnimationBackendChoreographer(
      animationBackendChoreographer: AnimationBackendChoreographer
  )

  external fun mergeReactRevision(surfaceId: Int)

  fun register(
      runtimeExecutor: RuntimeExecutor,
      runtimeScheduler: RuntimeScheduler,
      fabricUIManager: FabricUIManager,
      eventBeatManager: EventBeatManager,
      componentFactory: ComponentFactory,
      animationBackendChoreographer: AnimationBackendChoreographer,
  ) {
    fabricUIManager.setBinding(this)
    animationBackendChoreographer.frameCallback = AnimationFrameCallback { frameTimeMs: Double ->
      driveAnimationBackend(frameTimeMs)
    }
    setAnimationBackendChoreographer(animationBackendChoreographer)

    installFabricUIManager(
        runtimeExecutor,
        runtimeScheduler,
        fabricUIManager,
        eventBeatManager,
        componentFactory,
    )
    setPixelDensity(getDisplayMetricDensity())
  }

  private external fun uninstallFabricUIManager()

  fun unregister() {
    uninstallFabricUIManager()
  }

  private companion object {
    init {
      FabricSoLoader.staticInit()
    }
  }
}
