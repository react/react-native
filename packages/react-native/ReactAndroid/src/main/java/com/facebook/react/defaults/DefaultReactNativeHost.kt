/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.defaults

import android.app.Application
import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UIManagerProvider
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.fabric.FabricUIManagerProviderImpl
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.hermes.HermesInstance
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.ViewManagerResolver

/**
 * A utility class that allows you to simplify the setup of a [ReactNativeHost] for new apps in Open
 * Source.
 *
 * Specifically, for apps that are using the New Architecture, this Default class takes care of
 * providing the default TurboModuleManagerDelegateBuilder and the default JSIModulePackage,
 * provided the name of the dynamic library to load.
 */
public abstract class DefaultReactNativeHost
protected constructor(
    application: Application,
) : ReactNativeHost(application) {

  override fun getReactPackageTurboModuleManagerDelegateBuilder():
      ReactPackageTurboModuleManagerDelegate.Builder? =
      if (isNewArchEnabled) {
        DefaultTurboModuleManagerDelegate.Builder()
      } else {
        error(
            "Overriding isNewArchEnabled to false is not supported anymore since React Native 0.82. Please check your MainApplication.kt file, and remove the override for `isNewArchEnabled`."
        )
      }

  override fun getUIManagerProvider(): UIManagerProvider? =
      if (isNewArchEnabled) {
        UIManagerProvider { reactApplicationContext: ReactApplicationContext ->
          val componentFactory = ComponentFactory()
          DefaultComponentsRegistry.register(componentFactory)

          val viewManagerRegistry =
              if (getLazyViewManagersEnabled()) {
                ViewManagerRegistry(
                    object : ViewManagerResolver {
                      override fun getViewManager(viewManagerName: String) =
                          reactInstanceManager.createViewManager(viewManagerName)

                      override fun getViewManagerNames() = reactInstanceManager.viewManagerNames
                    }
                )
              } else {
                ViewManagerRegistry(
                    reactInstanceManager.getOrCreateViewManagers(reactApplicationContext)
                )
              }

          FabricUIManagerProviderImpl(componentFactory, viewManagerRegistry)
              .createUIManager(reactApplicationContext)
        }
      } else {
        error(
            "Overriding isNewArchEnabled to false is not supported anymore since React Native 0.82. Please check your MainApplication.kt file, and remove the override for `isNewArchEnabled`."
        )
      }

  override fun clear() {
    super.clear()
    DefaultReactHost.invalidate()
  }

  /**
   * Returns whether the user wants to use the New Architecture or not.
   *
   * If true, we will load the default JSI Module Package and TurboModuleManagerDelegate needed to
   * enable the New Architecture
   *
   * If false, the app will not attempt to load the New Architecture modules.
   */
  protected open val isNewArchEnabled: Boolean
    get() = true

  /**
   * Returns whether the user wants to use Hermes.
   *
   * If true, the app will load the Hermes engine, and fail if not found. If false, the app will
   * load the JSC engine, and fail if not found.
   */
  @Deprecated(
      "Setting isHermesEnabled inside `ReactNativeHost` is deprecated and this field will be ignored. If this field is set to true, you can safely remove it. If this field is set to false, please follow the setup on https://github.com/react-native-community/javascriptcore to continue using JSC",
      ReplaceWith(""),
  )
  protected open val isHermesEnabled: Boolean
    get() = true

  /**
   * Converts this [ReactNativeHost] (bridge-mode) to a [ReactHost] (bridgeless-mode).
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   */
  @UnstableReactNativeAPI
  internal fun toReactHost(
      context: Context,
      jsRuntimeFactory: JSRuntimeFactory? = null,
  ): ReactHost {
    val concreteJSRuntimeFactory = jsRuntimeFactory ?: HermesInstance()
    return DefaultReactHost.getDefaultReactHost(
        context,
        getPackages(),
        getJSMainModuleName(),
        getBundleAssetName() ?: "index.android.bundle",
        getJSBundleFile(),
        concreteJSRuntimeFactory,
        getUseDeveloperSupport(),
    )
  }
}
