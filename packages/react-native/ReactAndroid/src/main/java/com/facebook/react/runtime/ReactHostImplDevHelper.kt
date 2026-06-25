/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import android.os.Bundle
import android.view.View
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.inspector.TracingState
import com.facebook.react.devsupport.inspector.TracingStateProvider
import com.facebook.react.devsupport.perfmonitor.PerfMonitorDevHelper
import com.facebook.react.devsupport.perfmonitor.PerfMonitorInspectorTarget
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Implementation of [ReactInstanceDevHelper] for [ReactHostImpl].
 *
 * This allows [BridgelessDevSupportHelper] and other classes inside the .devsupport package to
 * communicate with the Bridgeless infrastructure without exposing public APIs.
 */
@UnstableReactNativeAPI
@OptIn(FrameworkAPI::class)
internal class ReactHostImplDevHelper(private val delegate: ReactHostImpl) :
    ReactInstanceDevHelper, PerfMonitorDevHelper, TracingStateProvider {

  override val currentActivity: Activity?
    get() = delegate.lastUsedActivity

  override val javaScriptExecutorFactory: JavaScriptExecutorFactory
    get() = throw IllegalStateException("Not implemented for bridgeless mode")

  override val currentReactContext: ReactContext?
    get() = delegate.currentReactContext

  override val inspectorTarget: PerfMonitorInspectorTarget?
    get() = delegate.reactHostInspectorTarget

  override fun onJSBundleLoadedFromServer() {
    // Not implemented, only referenced by BridgeDevSupportManager
  }

  override fun toggleElementInspector() {
    val reactContext = delegate.currentReactContext
    reactContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit("toggleElementInspector", null)
  }

  override fun createRootView(appKey: String): View? {
    val currentActivity = currentActivity
    if (currentActivity != null && !delegate.isSurfaceWithModuleNameAttached(appKey)) {
      val reactSurface = ReactSurfaceImpl.createWithView(currentActivity, appKey, Bundle())
      reactSurface.attach(delegate)
      reactSurface.start()

      return reactSurface.view
    }
    return null
  }

  override fun destroyRootView(rootView: View) {
    val surface = (rootView as? ReactSurfaceView)?.surface ?: return
    // stop() synchronously removes the surface from ReactHostImpl.attachedSurfaces via
    // detachSurface(), then asynchronously tears down the React component tree.
    // detach() severs the surface's back-reference to the host.
    // clear() removes child views from the ReactSurfaceView.
    surface.stop()
    surface.detach()
    surface.clear()
  }

  override fun reload(reason: String) {
    delegate.reload(reason)
  }

  override fun loadBundle(bundleLoader: JSBundleLoader): TaskInterface<Boolean> =
      delegate.loadBundle(bundleLoader)

  override fun getTracingState(): TracingState {
    return delegate.reactHostInspectorTarget?.getTracingState() ?: TracingState.ENABLED_IN_CDP_MODE
  }
}
