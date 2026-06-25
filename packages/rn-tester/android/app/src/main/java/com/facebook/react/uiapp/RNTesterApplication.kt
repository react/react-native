/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uiapp

import android.app.Application
import com.facebook.fbreact.specs.SampleLegacyModule
import com.facebook.fbreact.specs.SampleTurboModule
import com.facebook.react.BaseReactPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uiapp.component.MyLegacyViewManager
import com.facebook.react.uiapp.component.MyNativeViewManager
import com.facebook.react.uiapp.component.ReportFullyDrawnViewManager
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

internal class RNTesterApplication : Application(), ReactApplication {
  override val reactHost: ReactHost by
      lazy(LazyThreadSafetyMode.NONE) {
        val packages: List<ReactPackage> =
            PackageList(this@RNTesterApplication).packages.apply {
              add(
                  object : BaseReactPackage() {
                    override fun getModule(
                        name: String,
                        reactContext: ReactApplicationContext,
                    ): NativeModule? =
                        when (name) {
                          SampleTurboModule.NAME -> SampleTurboModule(reactContext)
                          SampleLegacyModule.NAME -> SampleLegacyModule(reactContext)
                          else -> null
                        }

                    // Note: Specialized annotation processor for @ReactModule isn't configured in
                    // OSS yet. For now, hardcode this information, though it's not necessary for
                    // most modules.
                    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
                        ReactModuleInfoProvider {
                          mapOf(
                              SampleTurboModule.NAME to
                                  ReactModuleInfo(
                                      SampleTurboModule.NAME,
                                      "SampleTurboModule",
                                      canOverrideExistingModule = false,
                                      needsEagerInit = false,
                                      isCxxModule = false,
                                      isTurboModule = true,
                                  ),
                              SampleLegacyModule.NAME to
                                  ReactModuleInfo(
                                      SampleLegacyModule.NAME,
                                      "SampleLegacyModule",
                                      canOverrideExistingModule = false,
                                      needsEagerInit = false,
                                      isCxxModule = false,
                                      isTurboModule = false,
                                  ),
                          )
                        }
                  }
              )
              add(
                  object : ReactPackage, ViewManagerOnDemandReactPackage {
                    override fun getViewManagerNames(reactContext: ReactApplicationContext) =
                        listOf(
                            "RNTMyNativeView",
                            "RNTMyLegacyNativeView",
                            "RNTReportFullyDrawnView",
                        )

                    override fun createViewManagers(
                        reactContext: ReactApplicationContext
                    ): List<ViewManager<*, *>> =
                        listOf(
                            MyNativeViewManager(),
                            MyLegacyViewManager(reactContext),
                            ReportFullyDrawnViewManager(),
                        )

                    override fun createViewManager(
                        reactContext: ReactApplicationContext,
                        viewManagerName: String,
                    ): ViewManager<*, out ReactShadowNode<*>>? =
                        when (viewManagerName) {
                          "RNTMyNativeView" -> MyNativeViewManager()
                          "RNTMyLegacyNativeView" -> MyLegacyViewManager(reactContext)
                          "RNTReportFullyDrawnView" -> ReportFullyDrawnViewManager()
                          else -> null
                        }
                  }
              )
            }

        DefaultReactHost.getDefaultReactHost(
            applicationContext,
            packages,
            jsMainModulePath = BuildConfig.JS_MAIN_MODULE_NAME,
            jsBundleAssetPath = BuildConfig.BUNDLE_ASSET_NAME,
            useDevSupport = BuildConfig.DEBUG,
        )
      }

  override fun onCreate() {
    ReactFontManager.getInstance().addCustomFont(this, "Rubik", R.font.rubik)
    ReactFontManager.getInstance().addCustomFont(this, "FiraCode", R.font.firacode)
    super.onCreate()
    loadReactNative(this)
  }
}
