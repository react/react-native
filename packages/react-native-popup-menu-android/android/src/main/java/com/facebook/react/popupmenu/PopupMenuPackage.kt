/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.popupmenu

import com.facebook.react.BaseReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

@ReactModuleList(nativeModules = arrayOf())
public class PopupMenuPackage() : BaseReactPackage(), ViewManagerOnDemandReactPackage {
  private val viewManagersMap: Map<String, ModuleSpec> =
      mapOf(
          ReactPopupMenuManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec({ ReactPopupMenuManager() }),
      )

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return null
  }

  protected override fun getViewManagers(reactContext: ReactApplicationContext): List<ModuleSpec> {
    return viewManagersMap.values.toList()
  }

  override fun getViewManagerNames(reactContext: ReactApplicationContext): Collection<String> {
    return viewManagersMap.keys
  }

  override fun createViewManager(
      reactContext: ReactApplicationContext,
      viewManagerName: String,
  ): ViewManager<*, *>? {
    val spec: ModuleSpec? = viewManagersMap.get(viewManagerName)
    return if (spec != null) (spec.getProvider().get() as ViewManager<*, *>) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider { emptyMap() }
  }
}
