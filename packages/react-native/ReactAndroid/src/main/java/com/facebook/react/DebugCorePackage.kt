/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UIManager
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.views.debuggingoverlay.DebuggingOverlayManager

/** Package defining core debugging modules and viewManagers e.g. [DebuggingOverlayManager]). */
@ReactModuleList(nativeModules = [])
public class DebugCorePackage public constructor() :
    BaseReactPackage(), ViewManagerOnDemandReactPackage {

  /** A map of view managers that should be registered with [UIManager] */
  private val viewManagersMap: Map<String, ModuleSpec> by
      lazy(LazyThreadSafetyMode.NONE) {
        mapOf(
            DebuggingOverlayManager.REACT_CLASS to
                ModuleSpec.viewManagerSpec { DebuggingOverlayManager() },
        )
      }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    emptyMap()
  }

  public override fun getModule(
      name: String,
      reactContext: ReactApplicationContext,
  ): NativeModule? = null

  public override fun getViewManagers(reactContext: ReactApplicationContext): List<ModuleSpec> =
      viewManagersMap.values.toList()

  override fun getViewManagerNames(reactContext: ReactApplicationContext): Collection<String> =
      viewManagersMap.keys

  override fun createViewManager(
      reactContext: ReactApplicationContext,
      viewManagerName: String,
  ): ViewManager<*, *>? =
      viewManagersMap.getOrDefault(viewManagerName, null)?.provider?.get() as? ViewManager<*, *>
}
